import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import { useColors } from '@/src/hooks/useColors';
import { radius, spacing } from '@/constants/theme';
import { BookingStatus } from '@/src/types';
import { useBookingStore } from '@/src/store/bookingStore';
import { useFieldStore } from '@/src/store/fieldStore';
import { BookingItem } from '@/components/BookingItem';
import { Toast } from '@/components/ui/Toast';

type StatusFilter = BookingStatus | 'all';

const STATUS_TABS: { key: StatusFilter; label: string; icon: string }[] = [
  { key: 'all',       label: 'Hammasi',      icon: 'apps-outline' },
  { key: 'pending',   label: 'Kutilmoqda',   icon: 'time-outline' },
  { key: 'confirmed', label: 'Tasdiqlangan', icon: 'checkmark-circle-outline' },
  { key: 'rejected',  label: 'Rad etilgan',  icon: 'close-circle-outline' },
  { key: 'completed', label: 'Yakunlangan',  icon: 'flag-outline' },
];

export default function BookingsScreen() {
  const c = useColors();
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [activeField, setActiveField] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const { getFiltered, getPendingCount, loadFromBackend } = useBookingStore();
  const { fields } = useFieldStore();
  const pendingCount = getPendingCount();

  const filtered = getFiltered(activeStatus, activeField);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFromBackend();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Bandliklar</Text>
        <View style={[styles.countBadge, { backgroundColor: c.primaryLight }]}>
          <Text style={[styles.countText, { color: c.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Status tabs */}
      <View style={[styles.tabsWrap, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {STATUS_TABS.map(tab => {
            const isActive = activeStatus === tab.key;
            const badgeCount = tab.key === 'pending' ? pendingCount : undefined;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tab,
                  { borderColor: c.border, backgroundColor: c.bg },
                  isActive && { backgroundColor: c.primary, borderColor: c.primary },
                ]}
                onPress={() => { setActiveStatus(tab.key); Haptics.selectionAsync(); }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={13}
                  color={isActive ? '#fff' : c.textSecondary}
                />
                <Text style={[styles.tabText, { color: isActive ? '#fff' : c.textSecondary }]}>
                  {tab.label}
                </Text>
                {badgeCount != null && badgeCount > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : c.pending }]}>
                    <Text style={[styles.tabBadgeText, { color: isActive ? '#fff' : '#fff' }]}>{badgeCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Field filter */}
      <View style={[styles.fieldFilterWrap, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          <Pressable
            style={[styles.fieldChip, { borderColor: c.border, backgroundColor: c.bg }, activeField === 'all' && { backgroundColor: c.primaryLight, borderColor: c.primary }]}
            onPress={() => { setActiveField('all'); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.fieldChipText, { color: activeField === 'all' ? c.primary : c.textSecondary }]}>Barcha maydonlar</Text>
          </Pressable>
          {fields.map(f => (
            <Pressable
              key={f.id}
              style={[styles.fieldChip, { borderColor: c.border, backgroundColor: c.bg }, activeField === f.id && { backgroundColor: c.primaryLight, borderColor: c.primary }]}
              onPress={() => { setActiveField(f.id); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.fieldChipText, { color: activeField === f.id ? c.primary : c.textSecondary }]}>
                {f.name.replace('GoBron ', '')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      >
        <View style={styles.listContent}>
          {filtered.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}>
              <Ionicons name="calendar-clear-outline" size={40} color={c.textTertiary} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>Bandlik yo'q</Text>
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>Bu toifada hech narsa topilmadi</Text>
            </View>
          ) : (
            filtered.map(b => (
              <BookingItem key={b.id} booking={b} onToast={showToast} />
            ))
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold', flex: 1 },
  countBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.full,
  },
  countText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  tabsWrap: { borderBottomWidth: 1 },
  tabsContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 1,
  },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  fieldFilterWrap: { borderBottomWidth: 1, maxHeight: 46 },
  fieldChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1,
  },
  fieldChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  list: { flex: 1 },
  listContent: { padding: spacing.xl },
  empty: {
    alignItems: 'center', paddingVertical: spacing.xxxl * 2,
    borderRadius: radius.xxl, borderWidth: 1, borderStyle: 'dashed',
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
