import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { socket, SERVER_URL } from '../services/socket';
import { Colors, Radius } from '../constants/theme';

const SUGGESTED = [
  { label: 'Residence', sublabel: '4220 Mission St', distance: '3.2 km', icon: '🏠' },
  { label: 'HQ Office', sublabel: '101 Market St', distance: '12.8 km', icon: '🏢' },
];

const FLEET_TYPES = [
  { id: 'standard', label: 'Standard', icon: '🚚', active: true },
  { id: 'express', label: 'Express', icon: '🚀', active: false },
  { id: 'cargo', label: 'Cargo', icon: '📦', active: false },
];

export default function CustomerCreateOrderScreen() {
  const router = useRouter();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState('standard');

  const handleCreateOrder = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert('Missing Fields', 'Please enter both pickup and drop-off locations.');
      return;
    }

    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location permissions.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude: pickupLat, longitude: pickupLng } = loc.coords;

      // Use an offset to simulate dropoff (in real app user picks on map)
      const dropoffLat = pickupLat + 0.01;
      const dropoffLng = pickupLng + 0.01;

      const response = await fetch(`${SERVER_URL}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat,
          pickupLng,
          dropoffLat,
          dropoffLng,
          customerId: socket.id,
        }),
      });

      const data = await response.json();

      if (data.orderId) {
        router.push({
          pathname: '/screens/CustomerLiveTrackingScreen',
          params: {
            orderId: data.orderId,
            pickupLat: String(pickupLat),
            pickupLng: String(pickupLng),
            dropoffLat: String(dropoffLat),
            dropoffLng: String(dropoffLng),
          },
        });
      } else {
        Alert.alert('Error', 'Failed to create order. Please try again.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Could not reach the HexTrack server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hex grid overlay */}
      <View style={styles.hexOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>⬡</Text>
            <Text style={styles.logoText}>HexTrack</Text>
          </View>
          <View style={styles.topBarRight}>
            <Text style={styles.topBarSubtitle}>NEW JOURNEY</Text>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.avatarBtn}>
              <Text style={styles.avatarText}>C</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pickup input */}
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <View style={styles.pickupDotContainer}>
                <View style={styles.pickupDot} />
                <View style={styles.inputConnector} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>PICKUP LOCATION</Text>
                <TextInput
                  style={styles.textInput}
                  value={pickup}
                  onChangeText={setPickup}
                  placeholder="Search operational hex..."
                  placeholderTextColor={Colors.outlineVariant}
                />
              </View>
              <Text style={styles.inputSuffix}>⊕</Text>
            </View>
          </View>

          {/* Dropoff input */}
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <View style={styles.hexVialSmall}>
                <View style={styles.hexVialDot} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>DROP-OFF DESTINATION</Text>
                <TextInput
                  style={styles.textInput}
                  value={dropoff}
                  onChangeText={setDropoff}
                  placeholder="Enter destination..."
                  placeholderTextColor={Colors.outlineVariant}
                />
              </View>
              <Text style={styles.inputSuffix}>🗺</Text>
            </View>
          </View>

          {/* Suggested destinations */}
          <View style={styles.suggestedGrid}>
            {SUGGESTED.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={styles.suggestedCard}
                onPress={() => setDropoff(s.sublabel)}
                activeOpacity={0.8}
              >
                <View style={styles.suggestedCardTop}>
                  <View style={styles.suggestedIconWrap}>
                    <Text style={styles.suggestedIcon}>{s.icon}</Text>
                  </View>
                  <Text style={styles.suggestedDist}>{s.distance}</Text>
                </View>
                <Text style={styles.suggestedLabel}>{s.label}</Text>
                <Text style={styles.suggestedSublabel}>{s.sublabel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fleet telemetry */}
          <View style={styles.fleetCard}>
            <View style={styles.fleetHeader}>
              <View style={styles.fleetOnlineRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.fleetOnlineText}>FLEET ONLINE</Text>
              </View>
              <Text style={styles.fleetHex}>CURRENT HEX: 88283082d7fffff</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fleetTypes}
            >
              {FLEET_TYPES.map((ft) => (
                <TouchableOpacity
                  key={ft.id}
                  style={[
                    styles.fleetType,
                    selectedFleet === ft.id && styles.fleetTypeActive,
                    selectedFleet !== ft.id && styles.fleetTypeInactive,
                  ]}
                  onPress={() => setSelectedFleet(ft.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.fleetTypeIconWrap,
                      selectedFleet === ft.id
                        ? styles.fleetIconWrapActive
                        : styles.fleetIconWrapInactive,
                    ]}
                  >
                    <Text style={styles.fleetTypeIcon}>{ft.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.fleetTypeLabel,
                      selectedFleet !== ft.id && styles.fleetTypeLabelInactive,
                    ]}
                  >
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleCreateOrder}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.ctaIcon}>⬡</Text>
                <Text style={styles.ctaText}>DISPATCH ORDER NOW</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>◎</Text>
            <Text style={styles.navLabel}>Live Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItemActive}>
            <Text style={styles.navIconActive}>☰</Text>
            <Text style={styles.navLabelActive}>Orders</Text>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  hexOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: Colors.outlineVariant,
  },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: 'rgba(16,19,26,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.outlineVariant}20`,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 18, color: Colors.primary },
  logoText: { fontSize: 18, fontWeight: '700', color: Colors.primary, letterSpacing: -0.5 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarSubtitle: { fontSize: 10, fontWeight: '700', color: `${Colors.onSurface}60`, letterSpacing: 2 },
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },
  inputCard: {
    backgroundColor: 'rgba(16,19,26,0.75)',
    borderRadius: Radius.sm,
    padding: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: `${Colors.surfaceContainerLowest}60`,
    borderRadius: Radius.sm,
  },
  pickupDotContainer: { alignItems: 'center', gap: 2 },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryContainer,
    shadowColor: Colors.secondaryContainer,
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  inputConnector: {
    width: 1,
    height: 20,
    backgroundColor: `${Colors.outlineVariant}40`,
  },
  hexVialSmall: {
    width: 16,
    height: 20,
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: `${Colors.primary}50`,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexVialDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: Colors.primary,
  },
  inputContent: { flex: 1 },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.outline,
    letterSpacing: 2,
    marginBottom: 3,
  },
  textInput: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onSurface,
    padding: 0,
  },
  inputSuffix: { fontSize: 18, color: `${Colors.outline}80` },
  suggestedGrid: { flexDirection: 'row', gap: 10 },
  suggestedCard: {
    flex: 1,
    backgroundColor: 'rgba(16,19,26,0.75)',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.outlineVariant}15`,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  suggestedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  suggestedIconWrap: {
    width: 36,
    height: 36,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedIcon: { fontSize: 16 },
  suggestedDist: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.outline,
    letterSpacing: 1,
  },
  suggestedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  suggestedSublabel: { fontSize: 11, color: Colors.outline },
  fleetCard: {
    backgroundColor: 'rgba(16,19,26,0.75)',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  fleetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: `${Colors.surfaceContainerHighest}60`,
  },
  fleetOnlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryContainer,
  },
  fleetOnlineText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondaryContainer,
    letterSpacing: 2,
  },
  fleetHex: { fontSize: 9, fontWeight: '500', color: Colors.outline, letterSpacing: 0.5 },
  fleetTypes: { padding: 14, gap: 12 },
  fleetType: { alignItems: 'center', gap: 6, minWidth: 64 },
  fleetTypeActive: { opacity: 1 },
  fleetTypeInactive: { opacity: 0.4 },
  fleetTypeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fleetIconWrapActive: {
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  fleetIconWrapInactive: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: `${Colors.outlineVariant}40`,
  },
  fleetTypeIcon: { fontSize: 22 },
  fleetTypeLabel: { fontSize: 10, fontWeight: '700', color: Colors.onSurface },
  fleetTypeLabelInactive: { color: Colors.outline },
  ctaBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.sm,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaIcon: { fontSize: 18 },
  ctaText: { fontSize: 12, fontWeight: '800', color: Colors.onPrimary, letterSpacing: 2 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    backgroundColor: 'rgba(16,19,26,0.95)',
    borderTopWidth: 1,
    borderTopColor: `${Colors.outlineVariant}20`,
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
