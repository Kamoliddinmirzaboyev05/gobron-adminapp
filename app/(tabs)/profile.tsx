import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/src/hooks/useColors';
import { useThemeStore } from '@/src/store/themeStore';
import { radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/src/store/authStore';
import { useBookingStore } from '@/src/store/bookingStore';
import { Toast } from '@/components/ui/Toast';
import { formatPrice } from '@/src/utils/format';

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  basic:    { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' },
  standard: { bg: '#EFF6FF', text: '#3B82F6', border: '#93C5FD' },
  premium:  { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
};

export default function ProfileScreen() {
  const c = useColors();
  const { isDark, toggle: toggleDark } = useThemeStore();
  const { owner, logout } = useAuthStore();
  const { bookings } = useBookingStore();
  const [notifications, setNotifications] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [showAnalytics, setShowAnalytics] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + b.totalPrice, 0);
  const confirmRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;

  const planKey = (owner?.subscription?.plan || 'basic').toLowerCase();
  const planCfg = PLAN_COLORS[planKey] || PLAN_COLORS.basic;
  const planUsage = planKey === 'premium' ? 100 : planKey === 'standard' ? 66 : 33;

  const WEEKLY_DATA = [
    { day: 'Du', val: 4 },
    { day: 'Se', val: 7 },
    { day: 'Ch', val: 3 },
    { day: 'Pa', val: 9 },
    { day: 'Ju', val: 12 },
    { day: 'Sh', val: 8 },
    { day: 'Ya', val: 6 },
  ];
  const maxBar = Math.max(...WEEKLY_DATA.map(d => d.val));

  const STATS_GRID = [
    { label: 'Jami', value: String(totalBookings), icon: 'calendar-outline', color: c.telegram },
    { label: 'Tasdiqlangan', value: String(confirmedBookings), icon: 'checkmark-circle-outline', color: c.primary },
    { label: 'Bugungi', value: String(owner?.stats?.todayBookings ?? 0), icon: 'today-outline', color: '#8B5CF6' },
    { label: 'Tushum', value: (totalRevenue / 1_000_000).toFixed(1) + 'mln', icon: 'wallet-outline', color: '#F59E0B' },
    { label: "Ko'rsatkich", value: confirmRate + '%', icon: 'trending-up-outline', color: c.primary },
    { label: 'Maydonlar', value: String(owner?.stats?.totalFields ?? 2), icon: 'football-outline', color: c.rejected },
  ];

  const handleLogout = () => {
    const performLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Hisobdan chiqmoqchimisiz?')) {
        performLogout();
      }
    } else {
      Alert.alert('Chiqish', "Hisobdan chiqmoqchimisiz?", [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish', style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  const initials = owner?.name
    ? owner.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'GA';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: c.card, borderBottomColor: c.border }]}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: c.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={[styles.telegramBadge, { backgroundColor: c.telegram }]}>
              <Ionicons name="paper-plane-outline" size={12} color="#fff" />
            </View>
          </View>
          <Text style={[styles.ownerName, { color: c.text }]}>{owner?.name || 'Foydalanuvchi'}</Text>
          <Text style={[styles.ownerSub, { color: c.textSecondary }]}>
            {owner?.telegramHandle || '@gobron_user'}  ·  {owner?.location || 'Toshkent'}
          </Text>
          <View style={[styles.planCard, { backgroundColor: planCfg.bg, borderColor: planCfg.border }]}>
            <View style={styles.planTop}>
              <View style={styles.planLeft}>
                <Ionicons name="star" size={16} color={planCfg.text} />
                <Text style={[styles.planName, { color: planCfg.text }]}>
                  {planKey === 'premium' ? 'Premium' : planKey === 'standard' ? 'Standart' : 'Bepul'} tarif
                </Text>
              </View>
              <Text style={[styles.planExpiry, { color: planCfg.text }]}>
                {owner?.subscription?.expiresAt ? `Tugaydi: ${owner.subscription.expiresAt}` : 'Cheklanmagan'}
              </Text>
            </View>
            <View style={[styles.planBar, { backgroundColor: planCfg.border }]}>
              <View style={[styles.planBarFill, { backgroundColor: planCfg.text, width: `${planUsage}%` }]} />
            </View>
            <Text style={[styles.planBarLabel, { color: planCfg.text }]}>
              {planKey === 'premium' ? 'Cheklovsiz imkoniyatlar' : `${planUsage}% foydalanildi`}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STATS_GRID.map((s, i) => (
            <View key={i} style={[styles.statItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly chart */}
        <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: c.text }]}>Haftalik bandliklar</Text>
            <Pressable onPress={() => setShowAnalytics(true)}>
              <Text style={[styles.chartLink, { color: c.primary }]}>Batafsil →</Text>
            </Pressable>
          </View>
          <View style={styles.bars}>
            {WEEKLY_DATA.map((d, i) => {
              const height = (d.val / maxBar) * 80;
              const isToday = i === (new Date().getDay() + 6) % 7;
              return (
                <View key={d.day} style={styles.barWrap}>
                  <Text style={[styles.barVal, { color: c.primary }]}>{d.val}</Text>
                  <View style={[styles.barBg, { backgroundColor: c.cardAlt }]}>
                    <View style={[styles.barFill, {
                      height,
                      backgroundColor: isToday ? c.primary : c.primaryLight,
                    }]} />
                  </View>
                  <Text style={[styles.barDay, { color: isToday ? c.primary : c.textSecondary }]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.menuCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <MenuRow icon="notifications-outline" label="Bildirishnomalar" c={c}>
            <Switch
              value={notifications}
              onValueChange={v => { setNotifications(v); Haptics.selectionAsync(); showToast(v ? 'Bildirishnomalar yoqildi' : "O'chirildi"); }}
              trackColor={{ false: c.border, true: c.primaryLight }}
              thumbColor={notifications ? c.primary : c.textTertiary}
            />
          </MenuRow>
          <MenuRow icon="moon-outline" label="Tungi rejim" c={c} isLast>
            <Switch
              value={isDark}
              onValueChange={() => { toggleDark(); Haptics.selectionAsync(); }}
              trackColor={{ false: c.border, true: c.primaryLight }}
              thumbColor={isDark ? c.primary : c.textTertiary}
            />
          </MenuRow>
        </View>

        {/* Account */}
        <View style={[styles.menuCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <MenuRow icon="person-circle-outline" label="Profilni tahrirlash" c={c} onPress={() => showToast('Tez orada...')} arrow />
          <MenuRow icon="shield-checkmark-outline" label="Xavfsizlik" c={c} onPress={() => showToast('Tez orada...')} arrow />
          <MenuRow icon="card-outline" label="To'lovlar va tarif" c={c} onPress={() => showToast('Tez orada...')} arrow />
          <MenuRow icon="bar-chart-outline" label="Hisobot va tahlil" c={c} onPress={() => setShowAnalytics(true)} arrow />
          <MenuRow icon="help-circle-outline" label="Yordam" c={c} onPress={() => showToast('Tez orada...')} arrow isLast />
        </View>

        {/* App info */}
        <View style={[styles.menuCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <MenuRow icon="information-circle-outline" label="Ilova haqida" c={c} onPress={() => showToast('GoBron Admin v1.0.0')} arrow />
          <MenuRow icon="document-text-outline" label="Foydalanish shartlari" c={c} onPress={() => showToast('Tez orada...')} arrow isLast />
        </View>

        <Pressable
          style={[styles.logoutBtn, { backgroundColor: c.rejectedLight, borderColor: c.rejected }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={c.rejected} />
          <Text style={[styles.logoutText, { color: c.rejected }]}>Chiqish</Text>
        </Pressable>
        <Text style={[styles.version, { color: c.textTertiary }]}>GoBron Admin v1.0.0  ·  © 2025</Text>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Analytics Modal */}
      <Modal visible={showAnalytics} transparent animationType="slide">
        <View style={[styles.analyticsOverlay, { backgroundColor: c.overlay }]}>
          <View style={[styles.analyticsSheet, { backgroundColor: c.card }]}>
            <View style={[styles.analyticsHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.analyticsTitle, { color: c.text }]}>Tahlil va hisobot</Text>
              <Pressable onPress={() => setShowAnalytics(false)}>
                <Ionicons name="close" size={22} color={c.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ padding: spacing.xl }}>
              <AnalyticRow label="Jami bandliklar" value={String(totalBookings)} color={c.telegram} c={c} />
              <AnalyticRow label="Tasdiqlangan" value={String(confirmedBookings)} color={c.primary} c={c} />
              <AnalyticRow label="Bekor qilingan" value={String(bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length)} color={c.rejected} c={c} />
              <AnalyticRow label="Jami tushum" value={formatPrice(totalRevenue)} color="#D97706" c={c} />
              <AnalyticRow label="Tasdiqlash ko'r." value={confirmRate + '%'} color={c.primary} c={c} />
              <AnalyticRow label="O'rtacha narx" value={totalBookings > 0 ? formatPrice(Math.round(totalRevenue / totalBookings)) : '—'} color={c.telegram} c={c} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </SafeAreaView>
  );
}

function MenuRow({ icon, label, c, children, onPress, arrow, isLast }: any) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        { borderBottomColor: c.border },
        !isLast && styles.menuRowBorder,
        pressed && onPress && { backgroundColor: c.cardAlt },
      ]}
      onPress={onPress}
    >
      <View style={styles.menuRowLeft}>
        <View style={[styles.menuIcon, { backgroundColor: c.bg }]}>
          <Ionicons name={icon} size={18} color={c.textSecondary} />
        </View>
        <Text style={[styles.menuLabel, { color: c.text }]}>{label}</Text>
      </View>
      <View style={styles.menuRowRight}>
        {children}
        {arrow && <Ionicons name="chevron-forward" size={16} color={c.textTertiary} />}
      </View>
    </Pressable>
  );
}

function AnalyticRow({ label, value, color, c }: any) {
  return (
    <View style={[styles.analyticRow, { borderBottomColor: c.border }]}>
      <Text style={[styles.analyticLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.analyticValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    alignItems: 'center', paddingTop: spacing.xl,
    paddingBottom: spacing.xl, paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  telegramBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  ownerName: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 4 },
  ownerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: spacing.lg },
  planCard: { width: '100%', borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1.5 },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  planName: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  planExpiry: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  planBar: { height: 6, borderRadius: 3, marginBottom: spacing.xs },
  planBarFill: { height: 6, borderRadius: 3 },
  planBarLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.sm },
  statItem: { width: '30.5%', borderRadius: radius.xl, padding: spacing.md, alignItems: 'center', borderWidth: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statValue: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 2 },
  chartCard: { marginHorizontal: spacing.xl, marginTop: spacing.xl, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  chartTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  chartLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barWrap: { flex: 1, alignItems: 'center' },
  barVal: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  barBg: { width: '100%', height: 88, borderRadius: 6, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barDay: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 4 },
  menuCard: { marginHorizontal: spacing.xl, marginTop: spacing.xl, borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, minHeight: 56,
  },
  menuRowBorder: { borderBottomWidth: 1 },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  menuRowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.xl, height: 52,
    marginHorizontal: spacing.xl, marginTop: spacing.xl, borderWidth: 1.5,
  },
  logoutText: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  version: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: spacing.xl },
  analyticsOverlay: { flex: 1, justifyContent: 'flex-end' },
  analyticsSheet: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: '70%', paddingBottom: 34 },
  analyticsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.xl, borderBottomWidth: 1,
  },
  analyticsTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  analyticRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  analyticLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  analyticValue: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});
