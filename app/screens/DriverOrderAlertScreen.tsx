import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { Colors, Radius } from '../constants/theme';

type Order = {
  id: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  status: string;
};

type Props = {
  order: Order;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
};

const TIMEOUT_SECONDS = 10;

export default function DriverOrderAlertScreen({ order, onAccept, onReject }: Props) {
  const [countdown, setCountdown] = useState(TIMEOUT_SECONDS);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Slide up animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, []);

  // Pulse the notification icon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Countdown timer — auto-reject at 0
  useEffect(() => {
    if (countdown <= 0) {
      onReject(order.id);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const pickupAddr = `${order.pickupLat.toFixed(4)}, ${order.pickupLng.toFixed(4)}`;
  const dropoffAddr = `${order.dropoffLat.toFixed(4)}, ${order.dropoffLng.toFixed(4)}`;

  return (
    <Modal transparent animationType="none" visible>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Animated.Text style={[styles.alertIcon, { transform: [{ scale: pulseAnim }] }]}>
                🔔
              </Animated.Text>
              <Text style={styles.headerTitle}>NEW DELIVERY REQUEST</Text>
            </View>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.cardBody}>
            {/* Fare + countdown */}
            <View style={styles.fareRow}>
              <View>
                <Text style={styles.fareLabel}>ESTIMATED FARE</Text>
                <Text style={styles.fareValue}>$42.80</Text>
              </View>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownLabel}>AUTO-EXPIRE</Text>
                <Text style={[styles.countdownValue, countdown <= 3 && styles.countdownUrgent]}>
                  {countdown}<Text style={styles.countdownUnit}>s</Text>
                </Text>
              </View>
            </View>

            {/* Stats bento */}
            <View style={styles.bentoGrid}>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoIcon}>📍</Text>
                <Text style={styles.bentoLabel}>DIST. TO PICKUP</Text>
                <Text style={styles.bentoValue}>2.5 <Text style={styles.bentoUnit}>km</Text></Text>
              </View>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoIcon}>⏱</Text>
                <Text style={styles.bentoLabel}>EST. TRIP</Text>
                <Text style={styles.bentoValue}>18 <Text style={styles.bentoUnit}>min</Text></Text>
              </View>
            </View>

            {/* Address flow */}
            <View style={styles.addressFlow}>
              <View style={styles.addressTimeline}>
                <View style={styles.dotPrimary} />
                <View style={styles.timelineLine} />
                <View style={styles.dotTertiary} />
              </View>
              <View style={styles.addressDetails}>
                <View style={styles.addressItem}>
                  <Text style={styles.addressLabel}>PICKUP</Text>
                  <Text style={styles.addressText}>{pickupAddr}</Text>
                </View>
                <View style={styles.addressItem}>
                  <Text style={styles.addressLabel}>DROPOFF</Text>
                  <Text style={styles.addressText}>{dropoffAddr}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => onReject(order.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.rejectText}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(order.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptText}>ACCEPT REQUEST</Text>
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(countdown / TIMEOUT_SECONDS) * 100}%`,
                  backgroundColor: countdown <= 3 ? Colors.error : Colors.primary,
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16,19,26,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(25,28,34,0.97)',
    borderRadius: Radius.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertIcon: { fontSize: 18 },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 2,
  },
  urgentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.errorContainer,
    borderRadius: 20,
  },
  urgentText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 2,
  },
  cardBody: { padding: 20, gap: 16 },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  fareLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 4,
  },
  fareValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.secondaryContainer,
    letterSpacing: -1,
  },
  countdownBox: { alignItems: 'flex-end' },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 4,
  },
  countdownValue: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.tertiary,
    letterSpacing: -0.5,
  },
  countdownUrgent: { color: Colors.error },
  countdownUnit: { fontSize: 16 },
  bentoGrid: { flexDirection: 'row', gap: 10 },
  bentoCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.sm,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  bentoIcon: { fontSize: 14, marginBottom: 4 },
  bentoLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bentoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bentoUnit: { fontSize: 11, color: Colors.onSurfaceVariant },
  addressFlow: { flexDirection: 'row', gap: 12 },
  addressTimeline: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 4,
  },
  dotPrimary: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineLine: {
    width: 1,
    height: 28,
    backgroundColor: `${Colors.outlineVariant}60`,
  },
  dotTertiary: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
    shadowColor: Colors.tertiary,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  addressDetails: { flex: 1, gap: 16 },
  addressItem: {},
  addressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 3,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  rejectText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.sm,
    alignItems: 'center',
    shadowColor: Colors.secondaryContainer,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  acceptText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSecondary,
    letterSpacing: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.surfaceContainerHighest,
    margin: 20,
    marginTop: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
