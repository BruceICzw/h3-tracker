import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { socket } from '../services/socket';
import { Colors, Radius } from '../constants/theme';

type DriverInfo = {
  socketId: string;
  latitude: number;
  longitude: number;
};

type OrderStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_DRIVERS';

const STATUS_LABELS: Record<OrderStatus, string> = {
  REQUESTED: 'Finding Driver...',
  ASSIGNED: 'Driver Assigned',
  ACCEPTED: 'Driver En Route',
  PICKED_UP: 'Order Picked Up',
  COMPLETED: 'Delivered',
  CANCELLED: 'Cancelled',
  NO_DRIVERS: 'No Drivers Available',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  REQUESTED: Colors.tertiary,
  ASSIGNED: Colors.primary,
  ACCEPTED: Colors.primary,
  PICKED_UP: Colors.secondaryContainer,
  COMPLETED: Colors.secondaryContainer,
  CANCELLED: Colors.error,
  NO_DRIVERS: Colors.error,
};

export default function CustomerLiveTrackingScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams<{
    orderId: string;
    pickupLat: string;
    pickupLng: string;
    dropoffLat: string;
    dropoffLng: string;
  }>();

  const [orderStatus, setOrderStatus] = useState<OrderStatus>('REQUESTED');
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [drivers, setDrivers] = useState<Record<string, any>>({});

  const pickupLat = parseFloat(params.pickupLat ?? '0');
  const pickupLng = parseFloat(params.pickupLng ?? '0');
  const dropoffLat = parseFloat(params.dropoffLat ?? '0');
  const dropoffLng = parseFloat(params.dropoffLng ?? '0');

  // Center map on pickup
  const mapRegion = {
    latitude: pickupLat || -17.8292,
    longitude: pickupLng || 31.0522,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  useEffect(() => {
    socket.on('order:status-update', (data: { orderId: string; status: OrderStatus; driverId?: string; driver?: DriverInfo }) => {
      if (data.orderId !== params.orderId) return;
      setOrderStatus(data.status);
      if (data.driver) setDriver(data.driver);
      if (data.status === 'COMPLETED') {
        Alert.alert('Delivery Complete', 'Your order has been delivered!', [
          { text: 'OK', onPress: () => router.replace('/screens/CustomerCreateOrderScreen') },
        ]);
      }
      if (data.status === 'NO_DRIVERS') {
        Alert.alert('No Drivers', 'No drivers available nearby. Try again shortly.', [
          { text: 'Back', onPress: () => router.back() },
        ]);
      }
    });

    socket.on('drivers:update', (data: Record<string, any>) => {
      setDrivers(data);
      // Update driver position if we have an assigned driver
      if (driver && data[driver.socketId]) {
        setDriver((prev) =>
          prev ? { ...prev, ...data[prev.socketId] } : prev
        );
      }
    });

    return () => {
      socket.off('order:status-update');
      socket.off('drivers:update');
    };
  }, [params.orderId, driver]);

  const driverCoords =
    driver && driver.latitude
      ? { latitude: driver.latitude, longitude: driver.longitude }
      : null;

  const efficiency = orderStatus === 'ASSIGNED' || orderStatus === 'ACCEPTED' ? '94.2' : '--';

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        customMapStyle={darkMapStyle}
        region={mapRegion}
      >
        {/* Pickup marker */}
        {pickupLat !== 0 && (
          <Marker
            coordinate={{ latitude: pickupLat, longitude: pickupLng }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.pickupMarker}>
              <View style={styles.pickupMarkerInner}>
                <Text style={{ fontSize: 12 }}>📍</Text>
              </View>
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText}>PICKUP</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoffLat !== 0 && (
          <Marker
            coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.dropoffMarker}>
              <View style={styles.dropoffMarkerInner}>
                <Text style={{ fontSize: 12 }}>🏁</Text>
              </View>
              <View style={styles.markerLabelTertiary}>
                <Text style={styles.markerLabelTextTertiary}>DROP</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Driver marker */}
        {driverCoords && (
          <Marker coordinate={driverCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarkerOuter}>
              <View style={styles.driverMarkerInner}>
                <Text style={{ fontSize: 18 }}>🚚</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Route line */}
        {driverCoords && pickupLat !== 0 && (
          <Polyline
            coordinates={[driverCoords, { latitude: pickupLat, longitude: pickupLng }]}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
        {pickupLat !== 0 && dropoffLat !== 0 && (
          <Polyline
            coordinates={[
              { latitude: pickupLat, longitude: pickupLng },
              { latitude: dropoffLat, longitude: dropoffLng },
            ]}
            strokeColor={`${Colors.primary}60`}
            strokeWidth={2}
            lineDashPattern={[6, 6]}
          />
        )}
      </MapView>

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.topBarInner}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>⬡</Text>
            <Text style={styles.logoText}>HexTrack</Text>
          </View>
          <View style={styles.topBarRight}>
            <Text style={styles.topBarStatus}>TELEMETRY ACTIVE</Text>
            <TouchableOpacity
              onPress={() => router.replace('/screens/CustomerCreateOrderScreen')}
              style={styles.avatarBtn}
            >
              <Text style={styles.avatarText}>C</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Telemetry panel (top-left) */}
      <View style={styles.telemetryPanel}>
        <View style={styles.telemetryHeader}>
          <View style={styles.pulseDot} />
          <Text style={styles.telemetryTitle}>LIVE TELEMETRY</Text>
        </View>
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryMetricLabel}>EFFICIENCY</Text>
          <Text style={styles.telemetryMetricValue}>{efficiency}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: efficiency !== '--' ? '94%' : '0%' }]} />
        </View>
      </View>

      {/* Driver detail card */}
      <View style={styles.driverCard}>
        {/* Driver info */}
        <View style={styles.driverCardTop}>
          <View style={styles.driverAvatarWrap}>
            <View style={styles.driverAvatar}>
              <Text style={{ fontSize: 22 }}>👤</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>4.9 ★</Text>
            </View>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>
              {driver ? `Driver #${driver.socketId.slice(0, 6)}` : 'Searching...'}
            </Text>
            <Text style={styles.driverRole}>HexTrack Fleet Driver</Text>
            <View style={styles.driverBadgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[orderStatus]}20` }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[orderStatus] }]}>
                  {orderStatus}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>{driver ? '5' : '--'}</Text>
            <Text style={styles.etaUnit}>MINS</Text>
          </View>
        </View>

        {/* Status label */}
        <Text style={styles.statusMessage}>{STATUS_LABELS[orderStatus]}</Text>

        {/* Actions */}
        <View style={styles.driverActions}>
          <TouchableOpacity style={styles.msgBtn}>
            <Text style={styles.msgIcon}>💬</Text>
            <Text style={styles.msgText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn}>
            <Text style={styles.callIcon}>📞</Text>
            <Text style={styles.callText}>Contact</Text>
          </TouchableOpacity>
        </View>
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
  telemetryPanel: {
    position: 'absolute',
    top: 72,
    left: 16,
    zIndex: 40,
    backgroundColor: 'rgba(25,28,34,0.82)',
    borderRadius: Radius.sm,
    padding: 14,
    width: 160,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  telemetryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryContainer,
  },
  telemetryTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: `${Colors.onSurface}60`,
    letterSpacing: 2,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  telemetryMetricLabel: { fontSize: 9, color: `${Colors.onSurface}40`, letterSpacing: 1 },
  telemetryMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  driverCard: {
    position: 'absolute',
    bottom: 72,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(25,28,34,0.93)',
    borderRadius: Radius.md,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  driverCardTop: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  driverAvatarWrap: { position: 'relative' },
  driverAvatar: {
    width: 52,
    height: 52,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  ratingText: { fontSize: 8, fontWeight: '700', color: Colors.onSecondary },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: Colors.onSurface, marginBottom: 2 },
  driverRole: { fontSize: 12, color: Colors.outline, marginBottom: 6 },
  driverBadgeRow: { flexDirection: 'row', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  statusBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  etaBox: { alignItems: 'flex-end' },
  etaLabel: { fontSize: 9, fontWeight: '700', color: `${Colors.onSurface}50`, letterSpacing: 2 },
  etaValue: { fontSize: 24, fontWeight: '700', color: Colors.primary, letterSpacing: -1 },
  etaUnit: { fontSize: 9, color: Colors.outline, letterSpacing: 1 },
  statusMessage: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 14,
  },
  driverActions: { flexDirection: 'row', gap: 10 },
  msgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  msgIcon: { fontSize: 15 },
  msgText: { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callIcon: { fontSize: 15 },
  callText: { fontSize: 13, fontWeight: '700', color: Colors.onPrimary },
  pickupMarker: { alignItems: 'center', gap: 3 },
  pickupMarkerInner: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  markerLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: `${Colors.surfaceContainerHighest}f0`,
    borderRadius: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  markerLabelText: { fontSize: 8, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
  dropoffMarker: { alignItems: 'center', gap: 3 },
  dropoffMarkerInner: {
    width: 32,
    height: 32,
    backgroundColor: Colors.tertiary,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.tertiary,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  markerLabelTertiary: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: `${Colors.surfaceContainerHighest}f0`,
    borderRadius: 2,
  },
  markerLabelTextTertiary: { fontSize: 8, fontWeight: '700', color: Colors.tertiary, letterSpacing: 1 },
  driverMarkerOuter: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMarkerInner: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
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
