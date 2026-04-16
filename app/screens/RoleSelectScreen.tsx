import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../constants/theme';

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Hex grid background texture */}
      <View style={styles.hexGrid} pointerEvents="none" />
      <View style={styles.gradientOverlay} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>⬡</Text>
          <Text style={styles.logoText}>HexTrack</Text>
        </View>
        <Text style={styles.tagline}>SMART DISPATCH SYSTEM</Text>
      </View>

      {/* Hero label */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>INITIALISE SESSION</Text>
        <Text style={styles.heroTitle}>Select{'\n'}Your Role</Text>
        <Text style={styles.heroSub}>
          Choose how you'll interact with the dispatch network
        </Text>
      </View>

      {/* Role cards */}
      <View style={styles.cardsContainer}>
        {/* Driver card */}
        <TouchableOpacity
          style={[styles.roleCard, styles.roleCardDriver]}
          activeOpacity={0.85}
          onPress={() => router.replace('/screens/DriverDashboardScreen')}
        >
          <View style={styles.roleCardHeader}>
            <View style={styles.hexVialPrimary}>
              <Text style={styles.roleIcon}>🚚</Text>
            </View>
            <View style={[styles.statusChip, styles.statusChipGreen]}>
              <Text style={styles.statusChipText}>DRIVER</Text>
            </View>
          </View>
          <Text style={styles.roleTitle}>Fleet Driver</Text>
          <Text style={styles.roleDesc}>
            Receive dispatch orders, update your location in real-time, and manage deliveries
          </Text>
          <View style={styles.roleStats}>
            <View style={styles.roleStat}>
              <Text style={styles.roleStatValue}>H3</Text>
              <Text style={styles.roleStatLabel}>GRID TRACKING</Text>
            </View>
            <View style={styles.roleStatDivider} />
            <View style={styles.roleStat}>
              <Text style={styles.roleStatValue}>LIVE</Text>
              <Text style={styles.roleStatLabel}>ORDER ALERTS</Text>
            </View>
          </View>
          <View style={styles.primaryGradientBtn}>
            <Text style={styles.primaryBtnText}>GO ONLINE AS DRIVER</Text>
          </View>
        </TouchableOpacity>

        {/* Customer card */}
        <TouchableOpacity
          style={[styles.roleCard, styles.roleCardCustomer]}
          activeOpacity={0.85}
          onPress={() => router.replace('/screens/CustomerCreateOrderScreen')}
        >
          <View style={styles.roleCardHeader}>
            <View style={styles.hexVialTertiary}>
              <Text style={styles.roleIcon}>📦</Text>
            </View>
            <View style={[styles.statusChip, styles.statusChipPrimary]}>
              <Text style={styles.statusChipTextPrimary}>CUSTOMER</Text>
            </View>
          </View>
          <Text style={styles.roleTitle}>Request Delivery</Text>
          <Text style={styles.roleDesc}>
            Create delivery orders and track your assigned driver in real-time on the map
          </Text>
          <View style={styles.roleStats}>
            <View style={styles.roleStat}>
              <Text style={styles.roleStatValue}>AUTO</Text>
              <Text style={styles.roleStatLabel}>DISPATCH</Text>
            </View>
            <View style={styles.roleStatDivider} />
            <View style={styles.roleStat}>
              <Text style={styles.roleStatValue}>LIVE</Text>
              <Text style={styles.roleStatLabel}>TRACKING</Text>
            </View>
          </View>
          <View style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>CREATE DELIVERY ORDER</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        H3 Spatial Index · Real-Time WebSocket · Smart Dispatch
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 32,
  },
  hexGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    backgroundColor: Colors.outlineVariant,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 20,
    color: Colors.primary,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.outline,
    letterSpacing: 2,
  },
  heroSection: {
    marginBottom: 28,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.onSurface,
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 13,
    color: Colors.outline,
    lineHeight: 18,
  },
  cardsContainer: {
    flex: 1,
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.sm,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  roleCardDriver: {},
  roleCardCustomer: {
    backgroundColor: Colors.surfaceContainer,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  hexVialPrimary: {
    width: 44,
    height: 44,
    backgroundColor: `${Colors.primary}18`,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexVialTertiary: {
    width: 44,
    height: 44,
    backgroundColor: `${Colors.tertiary}18`,
    borderWidth: 1,
    borderColor: `${Colors.tertiary}40`,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 20,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  statusChipGreen: {
    backgroundColor: `${Colors.secondaryContainer}20`,
    borderWidth: 1,
    borderColor: `${Colors.secondaryContainer}40`,
  },
  statusChipPrimary: {
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondaryContainer,
    letterSpacing: 2,
  },
  statusChipTextPrimary: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.outline,
    lineHeight: 17,
    marginBottom: 14,
  },
  roleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  roleStat: {
    alignItems: 'center',
  },
  roleStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  roleStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.outline,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  roleStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.4,
  },
  primaryGradientBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onPrimary,
    letterSpacing: 2,
  },
  ghostBtn: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  ghostBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
  },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 1,
    marginTop: 16,
    opacity: 0.5,
  },
});
