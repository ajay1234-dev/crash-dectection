import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import CountdownRing from '@/components/CountdownRing';
import {
  listenToCrashEvent,
  listenToCancelAlert,
  listenToConfig,
  listenToContacts,
  setCancelAlert,
  pushHistoryEvent,
  resetCrashState,
  CrashEvent,
} from '@/hooks/useFirebase';

type ScreenPhase = 'alert' | 'sos_sent';

export default function AlertScreen() {
  const router = useRouter();
  const [crashEvent, setCrashEvent] = useState<CrashEvent | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [phase, setPhase] = useState<ScreenPhase>('alert');
  const [contacts, setContacts] = useState<string[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgPulse = useRef(new Animated.Value(0)).current;
  const hasFiredSOS = useRef(false);

  // Background pulsing red glow
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(bgPulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Vibrate on mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    }
    return () => Vibration.cancel();
  }, []);

  // Listen to crash event data
  useEffect(() => {
    const unsub = listenToCrashEvent((event) => {
      if (event) {
        setCrashEvent(event);
      }
    });
    return unsub;
  }, []);

  // Listen to config for countdown duration
  useEffect(() => {
    const unsub = listenToConfig((config) => {
      if (config?.countdown) {
        setTotalSeconds(config.countdown);
        setRemaining(config.countdown);
      }
    });
    return unsub;
  }, []);

  // Listen to contacts
  useEffect(() => {
    const unsub = listenToContacts((c) => setContacts(c));
    return unsub;
  }, []);

  // Listen for remote cancel (from hardware button or other device)
  useEffect(() => {
    const unsub = listenToCancelAlert((cancelled) => {
      if (cancelled) {
        handleCancel();
      }
    });
    return unsub;
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'alert') return;

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!hasFiredSOS.current) {
            hasFiredSOS.current = true;
            fireSOS();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const fireSOS = useCallback(async () => {
    try {
      if (crashEvent) {
        await pushHistoryEvent({
          timestamp: new Date().toISOString(),
          gforce: crashEvent.gforce,
          lat: crashEvent.lat,
          lon: crashEvent.lon,
          outcome: 'sos_sent',
        });
      }
      await resetCrashState();
      setPhase('sos_sent');
    } catch (e) {
      setPhase('sos_sent');
    }
  }, [crashEvent]);

  const handleCancel = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    Vibration.cancel();
    try {
      if (crashEvent) {
        await pushHistoryEvent({
          timestamp: new Date().toISOString(),
          gforce: crashEvent.gforce,
          lat: crashEvent.lat,
          lon: crashEvent.lon,
          outcome: 'cancelled',
        });
      }
      await setCancelAlert(true);
      await resetCrashState();
    } catch (_) {}
    router.replace('/(tabs)');
  }, [crashEvent, router]);

  const handleDismissSOS = useCallback(() => {
    Vibration.cancel();
    router.replace('/(tabs)');
  }, [router]);

  const bgColor = bgPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(226,75,74,0.06)', 'rgba(226,75,74,0.18)'],
  });

  // ── SOS Sent Confirmation Screen ──
  if (phase === 'sos_sent') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.sosSentContainer}>
          <View style={styles.sosIconWrapper}>
            <Ionicons name="checkmark-circle" size={72} color={Colors.safe} />
          </View>
          <Text style={styles.sosSentTitle}>SOS SENT</Text>
          <Text style={styles.sosSentSub}>
            Emergency services and contacts have been notified.
          </Text>

          {contacts.length > 0 && (
            <View style={styles.contactsNotifiedCard}>
              <Text style={styles.contactsNotifiedTitle}>Contacts Notified:</Text>
              {contacts.map((c, i) => (
                <View key={i} style={styles.contactsNotifiedRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={Colors.safe}
                  />
                  <Text style={styles.contactsNotifiedText}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          {crashEvent && (
            <View style={styles.sosDetailCard}>
              <Text style={styles.sosDetailLabel}>Impact Recorded</Text>
              <Text style={styles.sosDetailValue}>
                {crashEvent.gforce.toFixed(2)}g
              </Text>
              <Text style={styles.sosDetailLocation}>
                {crashEvent.lat.toFixed(5)}, {crashEvent.lon.toFixed(5)}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismissSOS}>
            <Text style={styles.dismissBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Crash Alert Screen ──
  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.glowOverlay, { backgroundColor: bgColor }]} />

      <ScrollView
        contentContainerStyle={styles.alertContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.alertHeader}>
          <View style={styles.alertBadge}>
            <Ionicons name="warning" size={16} color={Colors.primary} />
            <Text style={styles.alertBadgeText}>CRASH DETECTED</Text>
          </View>
        </View>

        {/* Impact info */}
        <View style={styles.impactCard}>
          <Ionicons name="flash" size={28} color={Colors.primary} />
          <View>
            <Text style={styles.impactLabel}>Impact Detected</Text>
            <Text style={styles.impactValue}>
              {crashEvent ? `${crashEvent.gforce.toFixed(2)}g` : '...g'}
            </Text>
          </View>
        </View>

        {/* Countdown Ring */}
        <View style={styles.ringContainer}>
          <CountdownRing
            totalSeconds={totalSeconds}
            remainingSeconds={remaining}
            size={230}
            strokeWidth={10}
            color={Colors.primary}
          />
          <Text style={styles.ringSubtext}>
            SOS sends automatically when timer ends
          </Text>
        </View>

        {/* Location */}
        {crashEvent && (
          <View style={styles.locationCard}>
            <Ionicons name="location" size={16} color={Colors.safe} />
            <Text style={styles.locationText}>
              {crashEvent.lat.toFixed(5)}, {crashEvent.lon.toFixed(5)}
            </Text>
          </View>
        )}

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Ionicons name="shield-checkmark" size={22} color="#fff" />
          <Text style={styles.cancelButtonText}>I'm Safe — Cancel Alert</Text>
        </TouchableOpacity>

        <Text style={styles.cancelHint}>
          Pressing this will record the event as "Cancelled by driver"
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  alertHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '25',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  alertBadgeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 28,
    width: '100%',
  },
  impactLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  impactValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ringSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 14,
    fontStyle: 'italic',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 28,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: Colors.safe,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    elevation: 6,
    shadowColor: Colors.safe,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cancelHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  // SOS Sent styles
  sosSentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sosIconWrapper: {
    marginBottom: 16,
  },
  sosSentTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.safe,
    letterSpacing: 2,
    marginBottom: 8,
  },
  sosSentSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  contactsNotifiedCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.safe + '40',
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  contactsNotifiedTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 10,
  },
  contactsNotifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  contactsNotifiedText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  sosDetailCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  sosDetailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  sosDetailValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  sosDetailLocation: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  dismissBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
