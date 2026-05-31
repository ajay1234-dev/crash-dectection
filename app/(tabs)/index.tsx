import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import StatusCard from '@/components/StatusCard';
import {
  listenToDeviceStatus,
  DeviceStatus,
} from '@/hooks/useFirebase';

function GsmBars({ signal }: { signal: number }) {
  return (
    <View style={styles.gsmBarsRow}>
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[
            styles.gsmBar,
            {
              height: bar * 5 + 4,
              backgroundColor:
                bar <= signal ? Colors.gsmBar : 'rgba(255,255,255,0.15)',
            },
          ]}
        />
      ))}
    </View>
  );
}

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.6,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          { borderColor: color, transform: [{ scale }], opacity },
        ]}
      />
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </View>
  );
}

export default function DashboardScreen() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = listenToDeviceStatus((s) => {
      setStatus(s);
      setLastUpdated(new Date());
    });
    return unsub;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const isSafe = !status || status.gforce < 2.5;
  const statusColor = isSafe ? Colors.safe : Colors.primary;
  const statusLabel = status?.online
    ? isSafe
      ? 'SYSTEM SAFE'
      : 'ALERT DETECTED'
    : 'DEVICE OFFLINE';

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={Colors.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>CrashGuard</Text>
            <Text style={styles.appSubtitle}>Vehicle Safety Monitor</Text>
          </View>
          <View style={[styles.connectionDot, { backgroundColor: status?.online ? Colors.safe : Colors.primary }]} />
        </View>

        {/* Main Status Indicator */}
        <LinearGradient
          colors={
            isSafe
              ? Colors.gradients.safe
              : Colors.gradients.primary
          }
          style={[styles.mainStatusCard, { opacity: status?.online ? 1 : 0.6 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.mainStatusOverlay}>
            <PulsingDot color="#fff" />
            <Text style={styles.mainStatusLabel}>
              {statusLabel}
            </Text>
            <Text style={styles.monitoringText}>
              {status?.online ? 'Monitoring Active' : 'Connect your device'}
            </Text>
            <View style={styles.lastUpdatedRow}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.lastUpdatedText}>
                Updated: {formatTime(lastUpdated)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Device Status</Text>
        <View style={styles.cardGrid}>
          <StatusCard
            label="Device"
            value={status?.online ? 'Online' : 'Offline'}
            statusColor={status?.online ? Colors.safe : Colors.primary}
            icon={
              <Ionicons
                name={status?.online ? 'wifi' : 'wifi-outline'}
                size={20}
                color={status?.online ? Colors.safe : Colors.primary}
              />
            }
          />
          <StatusCard
            label="GPS Fix"
            value={status?.gpsFix ? 'Acquired' : 'No Fix'}
            statusColor={status?.gpsFix ? Colors.safe : Colors.warning}
            icon={
              <Ionicons
                name="location"
                size={20}
                color={status?.gpsFix ? Colors.safe : Colors.warning}
              />
            }
          />
        </View>

        <View style={styles.cardGrid}>
          <StatusCard
            label="G-Force"
            value={status ? `${status.gforce.toFixed(2)}g` : '--'}
            statusColor={
              !status
                ? Colors.textMuted
                : status.gforce > 2.5
                ? Colors.primary
                : Colors.safe
            }
            icon={
              <Ionicons
                name="flash"
                size={20}
                color={
                  !status
                    ? Colors.textMuted
                    : status.gforce > 2.5
                    ? Colors.primary
                    : Colors.safe
                }
              />
            }
          />
          <StatusCard
            label="Battery"
            value={status ? `${status.battery}%` : '--'}
            statusColor={
              !status
                ? Colors.textMuted
                : status.battery < 20
                ? Colors.primary
                : status.battery < 50
                ? Colors.warning
                : Colors.safe
            }
            icon={
              <Ionicons
                name={
                  !status
                    ? 'battery-dead-outline'
                    : status.battery > 60
                    ? 'battery-full'
                    : status.battery > 20
                    ? 'battery-half'
                    : 'battery-dead'
                }
                size={20}
                color={
                  !status
                    ? Colors.textMuted
                    : status.battery < 20
                    ? Colors.primary
                    : status.battery < 50
                    ? Colors.warning
                    : Colors.safe
                }
              />
            }
          />
        </View>

        {/* GSM Signal */}
        <View style={styles.gsmCard}>
          <View style={styles.gsmCardLeft}>
            <Ionicons name="cellular" size={20} color={Colors.gsmBar} />
            <View style={styles.gsmCardText}>
              <Text style={styles.gsmLabel}>GSM Signal</Text>
              <Text style={styles.gsmValue}>
                {status
                  ? ['No Signal', 'Poor', 'Fair', 'Good', 'Excellent'][
                      status.gsmSignal
                    ]
                  : 'Unknown'}
              </Text>
            </View>
          </View>
          <GsmBars signal={status?.gsmSignal ?? 0} />
        </View>

        {/* Last Seen */}
        {status?.lastSeen ? (
          <View style={styles.lastSeenCard}>
            <Ionicons name="radio-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.lastSeenText}>
              Last hardware ping:{' '}
              {new Date(status.lastSeen).toLocaleString('en-IN')}
            </Text>
          </View>
        ) : null}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  mainStatusCard: {
    borderRadius: 28,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  mainStatusOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  pulseContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  pulseDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  mainStatusLabel: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  monitoringText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 16,
  },
  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
  },
  cardGrid: {
    flexDirection: 'row',
    marginBottom: 4,
    marginHorizontal: -6,
  },
  gsmCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  gsmCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gsmCardText: {},
  gsmLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  gsmValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  gsmBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  gsmBar: {
    width: 8,
    borderRadius: 2,
  },
  lastSeenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    marginBottom: 8,
  },
  lastSeenText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
});
