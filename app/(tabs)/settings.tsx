import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import ContactItem from '@/components/ContactItem';
import {
  setContacts,
  setThreshold,
  setCountdown,
  pingFirebase,
  listenToConfig,
  listenToContacts,
  setMockCrashEvent,
  resetCrashState,
  DeviceConfig,
} from '@/hooks/useFirebase';

const STORAGE_KEYS = {
  CONTACTS: '@crashguard_contacts',
  NOTIFICATIONS_ENABLED: '@crashguard_notif_enabled',
  MOCK_MODE: '@crashguard_mock_mode',
};

const COUNTDOWN_OPTIONS = [10, 20, 30];

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

export default function SettingsScreen() {
  const [contacts, setLocalContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState('');
  const [threshold, setLocalThreshold] = useState(2.5);
  const [countdown, setLocalCountdown] = useState(30);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [pingResult, setPingResult] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);
  const [mockInterval, setMockInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Load from AsyncStorage and Firebase
  useEffect(() => {
    (async () => {
      const storedNotif = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
      if (storedNotif !== null) setNotifEnabled(JSON.parse(storedNotif));

      const storedMock = await AsyncStorage.getItem(STORAGE_KEYS.MOCK_MODE);
      if (storedMock !== null) setMockMode(JSON.parse(storedMock));
    })();

    const unsubConfig = listenToConfig((config: DeviceConfig | null) => {
      if (config) {
        setLocalThreshold(config.threshold ?? 2.5);
        setLocalCountdown(config.countdown ?? 30);
      }
    });

    const unsubContacts = listenToContacts((c: string[]) => {
      setLocalContacts(c);
    });

    return () => {
      unsubConfig();
      unsubContacts();
    };
  }, []);

  // Mock mode interval
  useEffect(() => {
    if (mockMode) {
      const interval = setInterval(async () => {
        const mockGforce = 2.5 + Math.random() * 2.5;
        const mockLat = 20.5937 + (Math.random() - 0.5) * 0.01;
        const mockLon = 78.9629 + (Math.random() - 0.5) * 0.01;
        try {
          await setMockCrashEvent(parseFloat(mockGforce.toFixed(2)), mockLat, mockLon);
          showToast('Mock crash event triggered!');
        } catch (e) {
          showToast('Mock failed: check Firebase connection');
        }
      }, 30000);
      setMockInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (mockInterval) clearInterval(mockInterval);
      setMockInterval(null);
    }
  }, [mockMode]);

  const handleAddContact = useCallback(async () => {
    const trimmed = newContact.trim();
    if (!trimmed) return;
    if (contacts.length >= 5) {
      Alert.alert('Limit Reached', 'You can add up to 5 emergency contacts.');
      return;
    }
    const updated = [...contacts, trimmed];
    setLocalContacts(updated);
    setNewContact('');
    try {
      await setContacts(updated);
      showToast('Contact added!');
    } catch {
      showToast('Failed to sync. Check connection.');
    }
  }, [newContact, contacts]);

  const handleDeleteContact = useCallback(async (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    setLocalContacts(updated);
    try {
      await setContacts(updated);
      showToast('Contact removed');
    } catch {
      showToast('Failed to sync. Check connection.');
    }
  }, [contacts]);

  const handleEditContact = useCallback(async (index: number, value: string) => {
    const updated = contacts.map((c, i) => (i === index ? value : c));
    setLocalContacts(updated);
    try {
      await setContacts(updated);
      showToast('Contact updated');
    } catch {
      showToast('Failed to sync.');
    }
  }, [contacts]);

  const handleThresholdChange = useCallback(async (value: number) => {
    const rounded = parseFloat(value.toFixed(1));
    setLocalThreshold(rounded);
    try {
      await setThreshold(rounded);
    } catch {
      showToast('Failed to save threshold');
    }
  }, []);

  const handleCountdownChange = useCallback(async (value: number) => {
    setLocalCountdown(value);
    try {
      await setCountdown(value);
      showToast(`Countdown set to ${value}s`);
    } catch {
      showToast('Failed to save countdown');
    }
  }, []);

  const handleTestConnection = useCallback(async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const ms = await pingFirebase();
      setPingResult(ms);
    } catch {
      Alert.alert('Connection Failed', 'Unable to reach Firebase. Check your internet and config.');
    } finally {
      setPinging(false);
    }
  }, []);

  const toggleNotifications = useCallback(async (value: boolean) => {
    setNotifEnabled(value);
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATIONS_ENABLED,
      JSON.stringify(value)
    );
    showToast(value ? 'Notifications enabled' : 'Notifications disabled');
  }, []);

  const toggleMockMode = useCallback(async (value: boolean) => {
    setMockMode(value);
    await AsyncStorage.setItem(STORAGE_KEYS.MOCK_MODE, JSON.stringify(value));
    if (value) {
      Alert.alert(
        '🔧 Mock Mode ON',
        'A crash event will be simulated every 30 seconds for demo purposes.',
        [{ text: 'Got it' }]
      );
    } else {
      // Clear any pending mock state from Firebase so it doesn't instantly trigger again
      try {
        await resetCrashState();
      } catch (e) {
        console.warn('Could not reset crash state:', e);
      }
    }
  }, []);

  const saveConfig = useCallback(async () => {
    try {
      await setThreshold(threshold);
      await setCountdown(countdown);
      showToast('Configuration saved successfully');
    } catch {
      showToast('Failed to save configuration');
    }
  }, [threshold, countdown]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={Colors.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Emergency Contacts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <Text style={styles.sectionSub}>
            Up to 5 contacts notified on SOS ({contacts.length}/5)
          </Text>

          {contacts.map((c, i) => (
            <ContactItem
              key={`${c}-${i}`}
              contact={c}
              index={i}
              onDelete={handleDeleteContact}
              onEdit={handleEditContact}
            />
          ))}

          {contacts.length < 5 && (
            <View style={styles.addContactRow}>
              <TextInput
                style={styles.addContactInput}
                placeholder="+91XXXXXXXXXX"
                placeholderTextColor={Colors.textMuted}
                value={newContact}
                onChangeText={setNewContact}
                keyboardType="phone-pad"
                selectionColor={Colors.primary}
                onSubmitEditing={handleAddContact}
              />
              <TouchableOpacity
                style={styles.addContactBtn}
                onPress={handleAddContact}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── G-Force Threshold ── */}
        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <View>
              <Text style={styles.sectionTitle}>G-Force Threshold</Text>
              <Text style={styles.sectionSub}>
                Trigger alert above this impact level
              </Text>
            </View>
            <View style={styles.thresholdBadge}>
              <Text style={styles.thresholdValue}>{threshold.toFixed(1)}g</Text>
            </View>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={1.5}
            maximumValue={5.0}
            step={0.1}
            value={threshold}
            onSlidingComplete={handleThresholdChange}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor="rgba(255,255,255,0.12)"
            thumbTintColor={Colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>1.5g (Sensitive)</Text>
            <Text style={styles.sliderLabelText}>5.0g (Severe)</Text>
          </View>
        </View>

        {/* ── Countdown Duration ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Countdown Duration</Text>
          <Text style={styles.sectionSub}>
            Time before SOS is automatically sent
          </Text>
          <View style={styles.countdownOptions}>
            {COUNTDOWN_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.countdownOption,
                  countdown === option && styles.countdownOptionActive,
                ]}
                onPress={() => handleCountdownChange(option)}
              >
                <Text
                  style={[
                    styles.countdownOptionText,
                    countdown === option && styles.countdownOptionTextActive,
                  ]}
                >
                  {option}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Device Connection ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Connection</Text>
          <TouchableOpacity
            style={styles.pingBtn}
            onPress={handleTestConnection}
            disabled={pinging}
          >
            {pinging ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="wifi" size={18} color="#fff" />
            )}
            <Text style={styles.pingBtnText}>
              {pinging ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>

          {pingResult !== null && (
            <View
              style={[
                styles.pingResult,
                { borderColor: pingResult < 200 ? Colors.safe : Colors.warning },
              ]}
            >
              <Ionicons
                name={pingResult < 200 ? 'checkmark-circle' : 'warning'}
                size={16}
                color={pingResult < 200 ? Colors.safe : Colors.warning}
              />
              <Text
                style={[
                  styles.pingResultText,
                  { color: pingResult < 200 ? Colors.safe : Colors.warning },
                ]}
              >
                Response time: {pingResult}ms
                {pingResult < 200
                  ? ' — Excellent'
                  : pingResult < 500
                  ? ' — Good'
                  : ' — Slow'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Toggles ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="notifications" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.toggleLabel}>Push Notifications</Text>
                <Text style={styles.toggleSub}>
                  Receive alerts when crash detected
                </Text>
              </View>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: Colors.primary + '60' }}
              thumbColor={notifEnabled ? Colors.primary : Colors.textMuted}
            />
          </View>

          <View style={[styles.toggleRow, styles.toggleRowWarning]}>
            <View style={styles.toggleInfo}>
              <Ionicons name="bug" size={18} color={Colors.warning} />
              <View>
                <Text style={[styles.toggleLabel, { color: Colors.warning }]}>
                  Demo / Mock Mode
                </Text>
                <Text style={styles.toggleSub}>
                  Simulate crash every 30s (for testing)
                </Text>
              </View>
            </View>
            <Switch
              value={mockMode}
              onValueChange={toggleMockMode}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: Colors.warning + '60' }}
              thumbColor={mockMode ? Colors.warning : Colors.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveConfig}>
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtnGradient}
          >
            <Text style={styles.saveBtnText}>Save Device Config</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>CrashGuard v1.0.0</Text>
          <Text style={styles.versionText}>B-Tech IoT Project</Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 14,
    lineHeight: 17,
  },
  addContactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  addContactInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.inputBorder,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  addContactBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  thresholdBadge: {
    backgroundColor: Colors.primary + '22',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  thresholdValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabelText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  countdownOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  countdownOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  countdownOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  countdownOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  countdownOptionTextActive: {
    color: Colors.primary,
  },
  pingBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pingBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pingResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pingResultText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: Colors.divider,
    marginTop: 6,
  },
  toggleRowWarning: {
    marginTop: 0,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  versionRow: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  bottomPad: {
    height: 20,
  },
});
