import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import EventCard from '@/components/EventCard';
import { listenToHistory, HistoryEvent } from '@/hooks/useFirebase';

const OUTCOME_CONFIG = {
  sos_sent: { color: Colors.primary, label: 'SOS Sent', icon: 'alert-circle' as const },
  cancelled: { color: Colors.warning, label: 'Cancelled', icon: 'checkmark-circle' as const },
  normal: { color: Colors.safe, label: 'Normal Trip', icon: 'shield-checkmark' as const },
};

export default function HistoryScreen() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);

  useEffect(() => {
    const unsub = listenToHistory((data) => {
      setEvents(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const openInMaps = useCallback((lat: number, lon: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    Linking.openURL(url);
  }, []);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="shield-checkmark" size={56} color={Colors.safe + '60'} />
        <Text style={styles.emptyTitle}>No Events Yet</Text>
        <Text style={styles.emptySubtitle}>
          All crash events will appear here. Stay safe!
        </Text>
      </View>
    );
  };

  const config = selectedEvent
    ? OUTCOME_CONFIG[selectedEvent.outcome] ?? OUTCOME_CONFIG.normal
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={Colors.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.header}>
        <Text style={styles.title}>Event History</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{events.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => setSelectedEvent(item)} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedEvent && config && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={[styles.modalBadge, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon} size={16} color={config.color} />
                    <Text style={[styles.modalBadgeText, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedEvent(null)}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>Event Details</Text>
                <Text style={styles.modalDate}>
                  {new Date(selectedEvent.timestamp).toLocaleString('en-IN')}
                </Text>

                {/* Stats */}
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="flash" size={18} color={Colors.warning} />
                    <Text style={styles.detailLabel}>G-Force</Text>
                    <Text style={styles.detailValue}>
                      {selectedEvent.gforce.toFixed(2)}g
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={18} color={Colors.safe} />
                    <Text style={styles.detailLabel}>Latitude</Text>
                    <Text style={styles.detailValue}>
                      {selectedEvent.lat.toFixed(6)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="navigate" size={18} color={Colors.safe} />
                    <Text style={styles.detailLabel}>Longitude</Text>
                    <Text style={styles.detailValue}>
                      {selectedEvent.lon.toFixed(6)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="radio-button-on" size={18} color={config.color} />
                    <Text style={styles.detailLabel}>Outcome</Text>
                    <Text style={[styles.detailValue, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                </View>

                {/* Open in Maps */}
                <TouchableOpacity
                  style={styles.mapsBtn}
                  onPress={() =>
                    openInMaps(selectedEvent.lat, selectedEvent.lon)
                  }
                >
                  <Ionicons name="map" size={18} color="#fff" />
                  <Text style={styles.mapsBtnText}>Open in Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => setSelectedEvent(null)}
                >
                  <Text style={styles.dismissBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: Colors.primary + '25',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  modalBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    padding: 14,
    width: '47%',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  mapsBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mapsBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  dismissBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dismissBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
