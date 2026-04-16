import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { socket } from '../services/socket';
import { Colors, Radius } from '../constants/theme';
import DriverOrderAlertScreen from './DriverOrderAlertScreen';

type Driver = {
  latitude: number;
  longitude: number;
  h3Index: string;
  status: string;
};

type Order = {
  id: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  status: string;
};

const RECENT_TRIPS = [
  { id: '#HT-8821', route: 'Financial District → SOMA', amount: '$18.20' },
  { id: '#HT-9103', route: 'Mission District → Port', amount: '$32.50' },
  { id: '#HT-4410', route: 'Union Square → North Beach', amount: '$14.15' },
];

export default function DriverDashboardScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [drivers, setDrivers] = useState<Record<string, Driver>>({});
  const [isOnline, setIsOnline] = useState(false);
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);

  // Start location tracking
  useEffect(() => {
    let subscriber: Location.LocationSubscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscriber = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 1 },
        (loc) => {
          setLocation(loc.coords);
          if (isOnline) {
            socket.emit('driver:update-location', {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      );
    };

    startTracking();
    return () => { subscriber?.remove(); };
  }, [isOnline]);

  // Socket listeners
  useEffect(() => {
    socket.on('drivers:update', (data: Record<string, Driver>) => {
      setDrivers(data);
    });

    socket.on('order:assigned', (order: Order) => {
      setIncomingOrder(order);
    });

    return () => {
      socket.off('drivers:update');
      socket.off('order:assigned');
    };
  }, []);

  const handleToggleOnline = () => {
    if (!isOnline) {
      socket.emit('driver:register');
      if (location) {
        socket.emit('driver:update-location', {
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    }
    setIsOnline((prev) => !prev);
  };

  const handleAcceptOrder = (orderId: string) => {
    socket.emit('order:accept', { orderId });
    setIncomingOrder(null);
  };

  const handleRejectOrder = (orderId: string) => {
    socket.emit('order:reject', { orderId });
    setIncomingOrder(null);
  };

  const mapRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }
    : {
        latitude: -17.8292,
        longitude: 31.0522,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };

  const driverCount = Object.keys(drivers).length;

  return (
    <View style={styles.container}>
      {/* Map Canvas */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        customMapStyle={darkMapStyle}
        region={mapRegion}
        showsUserLocation={false}
      >
        {/* Own marker */}
        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.selfMarkerOuter}>
              <View style={styles.selfMarkerInner}>
                <Text style={styles.markerIcon}>🚚</Text>
              </View>
            </View>
          </Marker>
        )}
        {/* Pulse ring when online */}
        {location && isOnline && (
          <Circle
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radius={300}
            fillColor="rgba(0,218,243,0.06)"
            strokeColor="rgba(0,218,243,0.2)"
            strokeWidth={1}
          />
        )}
        {/* Other drivers */}
        {Object.entries(drivers).map(([id, driver]) => {
          if (id === socket.id) return null;
          return (
            <Marker
              key={id}
              coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.otherDriverMarker}>
                <Text style={{ fontSize: 10 }}>🚗</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.topBarInner}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>⬡</Text>
            <Text style={styles.logoText}>HexTrack</Text>
          </View>
          <View style={styles.topBarRight}>
            <Text style={styles.topBarStatus}>
              {isOnline ? 'TELEMETRY ACTIVE' : 'STANDBY'}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.avatarBtn}>
              <Text style={styles.avatarText}>D</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Online / Offline Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.togglePill}>
          <TouchableOpacity
            style={[styles.toggleOption, !isOnline && styles.toggleOptionActive]}
            onPress={() => setIsOnline(false)}
          >
            <Text style={[styles.toggleText, !isOnline && styles.toggleTextActive]}>
              OFFLINE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, isOnline && styles.toggleOptionOnline]}
            onPress={handleToggleOnline}
          >
            <Text style={[styles.toggleText, isOnline && styles.toggleTextOnline]}>
              ONLINE
            </Text>
          </TouchableOpacity>
        </View>
        {isOnline && (
          <View style={styles.onlineChip}>
            <View style={styles.pulseDot} />
            <Text style={styles.onlineChipText}>SYSTEM ONLINE</Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Earnings */}
        <View style={styles.earningsRow}>
          <View>
            <Text style={styles.earningsLabel}>DAILY EARNINGS</Text>
            <Text style={styles.earningsValue}>$248.50</Text>
          </View>
          <View style={styles.earningsRight}>
            <Text style={styles.earningsGrowth}>+12% vs Yesterday</Text>
            <Text style={styles.earningsHours}>8.5 Total Hours</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statLabel}>TRIPS</Text>
            <Text style={styles.statValue}>14</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statLabel}>RATING</Text>
            <Text style={styles.statValue}>4.98</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statLabel}>UPTIME</Text>
            <Text style={styles.statValue}>{driverCount > 0 ? '96%' : '--'}</Text>
          </View>
        </View>

        {/* Recent trips */}
        <View style={styles.tripsHeader}>
          <Text style={styles.tripsTitle}>RECENT LOGISTICS</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.tripsList} showsVerticalScrollIndicator={false}>
          {RECENT_TRIPS.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripIcon}>
                <Text style={{ fontSize: 16 }}>📦</Text>
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripId}>Hub Dispatch {trip.id}</Text>
                <Text style={styles.tripRoute}>{trip.route}</Text>
              </View>
              <Text style={styles.tripAmount}>{trip.amount}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Text style={styles.navIconActive}>◎</Text>
          <Text style={styles.navLabelActive}>Live Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>☰</Text>
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🚚</Text>
          <Text style={styles.navLabel}>Fleet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={styles.navLabel}>Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => mapRef.current?.animateToRegion(mapRegion)}>
        <Text style={styles.fabIcon}>⚡</Text>
      </TouchableOpacity>

      {/* Order Alert Overlay */}
      {incomingOrder && (
        <DriverOrderAlertScreen
          order={incomingOrder}
          onAccept={handleAcceptOrder}
          onReject={handleRejectOrder}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(16,19,26,0.85)',
  },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 18, color: Colors.primary },
  logoText: { fontSize: 18, fontWeight: '700', color: Colors.primary, letterSpacing: -0.5 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarStatus: { fontSize: 10, fontWeight: '700', color: `${Colors.onSurface}60`, letterSpacing: 2 },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  toggleContainer: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 40,
    gap: 8,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(29,32,38,0.85)',
    borderRadius: Radius.sm,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: `${Colors.outlineVariant}30`,
  },
  toggleOption: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: Radius.xs,
  },
  toggleOptionActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  toggleOptionOnline: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: `${Colors.onSurface}60`,
    letterSpacing: 2,
  },
  toggleTextActive: { color: Colors.onSurfaceVariant },
  toggleTextOnline: { color: Colors.onPrimary },
  onlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: `${Colors.secondaryContainer}15`,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.secondaryContainer}30`,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryContainer,
  },
  onlineChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondaryContainer,
    letterSpacing: 2,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(16,19,26,0.93)',
    borderTopWidth: 1,
    borderTopColor: `${Colors.outlineVariant}25`,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.outline,
    letterSpacing: 2,
    marginBottom: 2,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -1,
  },
  earningsRight: { alignItems: 'flex-end' },
  earningsGrowth: { fontSize: 12, fontWeight: '700', color: Colors.secondaryContainer },
  earningsHours: { fontSize: 11, color: Colors.outline, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: `${Colors.surfaceContainerHighest}50`,
    borderRadius: Radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: `${Colors.outlineVariant}20`,
  },
  statIcon: { fontSize: 16, marginBottom: 6 },
  statLabel: { fontSize: 9, fontWeight: '600', color: Colors.outline, letterSpacing: 1.5, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tripsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
  },
  viewAll: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  tripsList: { maxHeight: 140 },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primaryContainer,
  },
  tripIcon: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripInfo: { flex: 1 },
  tripId: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
  tripRoute: { fontSize: 11, color: Colors.outline, marginTop: 1 },
  tripAmount: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(16,19,26,0.95)',
    borderTopWidth: 1,
    borderTopColor: `${Colors.outlineVariant}20`,
    paddingBottom: 4,
  },
  navItem: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 12 },
  navItemActive: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: Radius.xs,
  },
  navIcon: { fontSize: 18, color: `${Colors.onSurface}40`, marginBottom: 2 },
  navIconActive: { fontSize: 18, color: Colors.primary, marginBottom: 2 },
  navLabel: { fontSize: 10, color: `${Colors.onSurface}40`, fontWeight: '500' },
  navLabelActive: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 52,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabIcon: { fontSize: 22 },
  selfMarkerOuter: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfMarkerInner: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  markerIcon: { fontSize: 20 },
  otherDriverMarker: {
    width: 28,
    height: 28,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#10131a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#10131a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b90a0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#191c22' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#32353c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0e14' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
