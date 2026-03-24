import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/src/hooks/useColors';
import { BookingStatus } from '@/src/types';

interface BadgeProps {
  status: BookingStatus;
  small?: boolean;
}

export function StatusBadge({ status, small }: BadgeProps) {
  const c = useColors();

  const CONFIG: Record<BookingStatus, { label: string; bg: string; color: string }> = {
    pending:   { label: 'Kutilmoqda', bg: c.pendingLight,   color: c.pending },
    confirmed: { label: 'Tasdiqlangan', bg: c.confirmedLight, color: c.confirmed },
    rejected:  { label: 'Rad etilgan', bg: c.rejectedLight,  color: c.rejected },
    cancelled: { label: 'Bekor', bg: c.cancelledLight, color: c.cancelled },
    completed: { label: 'Yakunlangan', bg: c.completedLight, color: c.completed },
  };

  const cfg = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }, small && styles.smallText]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  smallText: { fontSize: 10 },
});
