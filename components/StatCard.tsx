import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/constants/theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
}

export function StatCard({ title, value, subtitle, trend }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {trend ? (
        <View style={styles.trendRow}>
          <Text style={styles.trend}>{trend}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  title: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  trendRow: {
    marginTop: spacing.xs,
  },
  trend: {
    fontSize: 11,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
