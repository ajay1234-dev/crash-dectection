import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { HistoryEvent } from '@/hooks/useFirebase';

interface EventCardProps {
  event: HistoryEvent;
  onPress: () => void;
}

const OUTCOME_CONFIG = {
  sos_sent: {
    color: Colors.primary,
    label: 'SOS Sent',
    icon: 'alert-circle' as const,
    bg: Colors.primary + '20',
  },
  cancelled: {
    color: Colors.warning,
    label: 'Cancelled',
    icon: 'checkmark-circle' as const,
    bg: Colors.warning + '20',
  },
  normal: {
    color: Colors.safe,
    label: 'Normal Trip',
    icon: 'shield-checkmark' as const,
    bg: Colors.safe + '20',
  },
};

export default function EventCard({ event, onPress }: EventCardProps) {
  const config = OUTCOME_CONFIG[event.outcome] ?? OUTCOME_CONFIG.normal;

  const formattedDate = new Date(event.timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(event.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={Colors.gradients.card}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: config.color }]} />

        <View style={styles.content}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <LinearGradient
              colors={
                event.outcome === 'sos_sent' ? Colors.gradients.primary :
                event.outcome === 'cancelled' ? Colors.gradients.warning :
                Colors.gradients.safe
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.outcomeBadge, { opacity: 0.9 }]}
            >
              <Ionicons name={config.icon} size={12} color="#fff" />
              <Text style={styles.outcomeText}>
                {config.label}
              </Text>
            </LinearGradient>
            <Text style={styles.timeText}>{formattedTime}</Text>
          </View>

        {/* Date */}
        <Text style={styles.dateText}>{formattedDate}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="flash" size={12} color={Colors.warning} />
            <Text style={styles.statLabel}>G-Force</Text>
            <Text style={styles.statValue}>{event.gforce.toFixed(1)}g</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="location" size={12} color={Colors.safe} />
            <Text style={styles.statLabel}>Location</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {event.lat.toFixed(4)}, {event.lon.toFixed(4)}
            </Text>
          </View>
        </View>
      </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.textMuted}
          style={styles.chevron}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
    margin: 8,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  outcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  outcomeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#fff',
  },
  timeText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.divider,
    marginHorizontal: 10,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: 12,
  },
});
