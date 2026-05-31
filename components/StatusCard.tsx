import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface StatusCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  statusColor?: string;
  subtitle?: string;
  fullWidth?: boolean;
}

export default function StatusCard({
  label,
  value,
  icon,
  statusColor,
  subtitle,
  fullWidth = false,
}: StatusCardProps) {
  return (
    <View style={[styles.card, fullWidth && styles.fullWidth]}>
      <View style={styles.iconRow}>
        <View style={[styles.iconWrapper, statusColor ? { backgroundColor: statusColor + '22' } : {}]}>
          {icon}
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, statusColor ? { color: statusColor } : {}]}>
        {value}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    padding: 16,
    flex: 1,
    minWidth: 140,
    margin: 6,
  },
  fullWidth: {
    flex: 0,
    width: '100%',
    marginHorizontal: 0,
  },
  iconRow: {
    marginBottom: 10,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
});
