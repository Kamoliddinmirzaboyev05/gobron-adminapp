import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/src/hooks/useColors';
import { radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/src/store/authStore';
import { useBookingStore } from '@/src/store/bookingStore';
import { useFieldStore } from '@/src/store/fieldStore';
import { ApprovalCard } from '@/components/ApprovalCard';
import { ManualBookingModal } from '@/components/ManualBookingModal';
import { Toast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPriceShort } from '@/src/utils/format';

const today = new Date();
const MONTHS = ['Yan','Feb','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const todayLabel = `Bugun, ${today.getDate()} ${MONTHS[today.getMonth()]}`;

export default function DashboardScreen() {
  const c = useColors();
  const { owner, accessToken } = useAuthStore();
  const { getPending, getUpcoming, addIncoming, loadFromBackend } = useBookingStore();
  const { loadMyField } = useFieldStore();
  const [refreshing, setRefreshing] = useState(false);
  const [manualModal, setManualModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const incomingIdx = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const pending = getPending();
  const upcoming = getUpcoming().filter(b => b.status === 'confirmed');
  const stats = owner?.stats;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    loadMyField();
    loadFromBackend();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <View>
          <View style={styles.logoRow}>
            <View style={[styles.logoMini, { backgroundColor: c.primary }]}>
              <Text style={styles.logoMiniText}>G</Text>
            </View>
            <Text style={[styles.headerTitle, { color: c.text }]}>GoBron Admin</Text>
          </View>
          <Text style={[styles.headerSub, { color: c.textSecondary }]}>
            {owner?.name}  ·  {todayLabel}
          </Text>
        </View>
        <Pressable style={[styles.bellBtn, { backgroundColor: c.cardAlt }]}>
          <Ionicons name="notifications-outline" size={20} color={c.text} />
          {pending.length > 0 && (
            <View style={[styles.bellBadge, { backgroundColor: c.rejected }]}>
              <Text style={styles.bellBadgeText}>{pending.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Stats Row — ALWAYS AT TOP */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: c.card }]}>
              <View style={[styles.statIconWrap, { backgroundColor: c.primaryLight }]}>
                <Ionicons name="calendar-outline" size={18} color={c.primary} />
              </View>
              <Text style={[styles.statValue, { color: c.text }]}>{stats?.todayBookings ?? 0}</Text>
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>Bugungi bandliklar</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up-outline" size={12} color={c.primary} />
                <Text style={[styles.statTrendText, { color: c.primary }]}>+2 kecha</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: c.card }]}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="wallet-outline" size={18} color="#D97706" />
              </View>
              <Text style={[styles.statValue, { color: c.text }]}>{formatPriceShort(stats?.monthRevenue ?? 0)}</Text>
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>Oylik tushum (so'm)</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up-outline" size={12} color={c.primary} />
                <Text style={[styles.statTrendText, { color: c.primary }]}>Bu oy</Text>
              </View>
            </View>
          </View>

          {/* Quick stats row */}
          <View style={[styles.quickStats, { backgroundColor: c.card, borderColor: c.border }]}>
            <QuickStat icon="checkmark-circle-outline" label="Tasdiqlash" value={`${stats?.confirmRate ?? 0}%`} color={c.primary} c={c} />
            <View style={[styles.qsDivider, { backgroundColor: c.border }]} />
            <QuickStat icon="close-circle-outline" label="Bekor" value={`${stats?.cancelRate ?? 0}%`} color={c.rejected} c={c} />
            <View style={[styles.qsDivider, { backgroundColor: c.border }]} />
            <QuickStat icon="bar-chart-outline" label="Bu oy" value={String(stats?.monthBookings ?? 0)} color={c.telegram} c={c} />
          </View>

          {/* Pending Approvals */}
          {pending.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.pendingIndicator, { backgroundColor: c.pending }]} />
                  <Text style={[styles.sectionTitle, { color: c.text }]}>Tasdiqlash kutilmoqda</Text>
                </View>
                <View style={[styles.pendingCountBadge, { backgroundColor: c.pendingLight }]}>
                  <Text style={[styles.pendingCountText, { color: c.pending }]}>{pending.length}</Text>
                </View>
              </View>
              {pending.map(b => (
                <ApprovalCard
                  key={b.id}
                  booking={b}
                  onConfirm={(name) => showToast(`${name} tasdiqlandi`)}
                  onReject={() => showToast('Rad etildi', 'error')}
                />
              ))}
            </View>
          )}

          {/* Upcoming bookings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Yaqin bandliklar</Text>
              <Text style={[styles.sectionLink, { color: c.primary }]}>Hammasi →</Text>
            </View>
            {upcoming.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Ionicons name="calendar-clear-outline" size={32} color={c.textTertiary} />
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>Yaqin bandliklar yo'q</Text>
              </View>
            ) : (
              upcoming.map(b => (
                <View key={b.id} style={[styles.upcomingCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <View style={[styles.upcomingAccent, { backgroundColor: c.primaryLight }]}>
                    <Ionicons name="time-outline" size={16} color={c.primary} />
                  </View>
                  <View style={styles.upcomingLeft}>
                    <Text style={[styles.upcomingName, { color: c.text }]}>{b.userName}</Text>
                    <Text style={[styles.upcomingDetail, { color: c.textSecondary }]}>
                      {b.fieldName}  ·  {b.dateLabel}, {b.startTime}–{b.endTime}
                    </Text>
                  </View>
                  <StatusBadge status={b.status} small />
                </View>
              ))
            )}
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: c.primary, shadowColor: c.primary }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setManualModal(true); }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <ManualBookingModal
        visible={manualModal}
        onClose={() => setManualModal(false)}
        onSuccess={() => showToast("Bandlik qo'shildi")}
      />
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </SafeAreaView>
  );
}

function QuickStat({ icon, label, value, color, c }: any) {
  return (
    <View style={styles.qsItem}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.qsValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.qsLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  logoMini: {
    width: 24, height: 24, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMiniText: { color: '#fff', fontSize: 13, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  headerTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  scroll: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: 26, fontWeight: '800', fontFamily: 'Inter_700Bold', lineHeight: 30 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 15 },
  statTrend: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.xs },
  statTrendText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: spacing.md,
    overflow: 'hidden',
  },
  qsItem: { flex: 1, alignItems: 'center', gap: 3 },
  qsDivider: { width: 1, marginVertical: 4 },
  qsValue: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  qsLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  sectionLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  pendingIndicator: { width: 8, height: 8, borderRadius: 4 },
  pendingCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pendingCountText: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  upcomingCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.md,
  },
  upcomingAccent: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  upcomingLeft: { flex: 1 },
  upcomingName: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  upcomingDetail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  emptyCard: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.xl,
    width: 56, height: 56,
    borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
});
