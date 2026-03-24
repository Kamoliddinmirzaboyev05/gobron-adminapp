import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/src/hooks/useColors';
import { radius, spacing } from '@/constants/theme';
import { Booking } from '@/src/types';
import { useBookingStore } from '@/src/store/bookingStore';
import { formatPrice } from '@/src/utils/format';
import { StatusBadge } from '@/components/ui/Badge';

interface BookingItemProps {
  booking: Booking;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export function BookingItem({ booking, onToast }: BookingItemProps) {
  const c = useColors();
  const { confirm, reject } = useBookingStore();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    setConfirmLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      confirm(booking.id);
      setConfirmLoading(false);
      onToast(`${booking.userName} tasdiqlandi`);
    }, 700);
  };

  const handleRejectSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reject(booking.id, reason);
    setRejectModal(false);
    setReason('');
    onToast('Rad etildi', 'error');
  };

  const handleCall = () => {
    Linking.openURL(`tel:${booking.userPhone.replace(/\s/g, '')}`);
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.top}>
          <View style={styles.topLeft}>
            <Text style={[styles.name, { color: c.text }]}>{booking.userName}</Text>
            <View style={styles.fieldRow}>
              <Ionicons name="location-outline" size={12} color={c.textTertiary} />
              <Text style={[styles.field, { color: c.textSecondary }]}>{booking.fieldName}</Text>
            </View>
          </View>
          <StatusBadge status={booking.status} />
        </View>
        <View style={[styles.detailRow, { borderTopColor: c.border }]}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={13} color={c.textTertiary} />
            <Text style={[styles.detailText, { color: c.textSecondary }]}>{booking.dateLabel}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={13} color={c.textTertiary} />
            <Text style={[styles.detailText, { color: c.textSecondary }]}>{booking.startTime}–{booking.endTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={13} color={c.textTertiary} />
            <Text style={[styles.detailText, { color: c.textSecondary }]}>{formatPrice(booking.totalPrice)}</Text>
          </View>
        </View>
        {booking.status === 'rejected' && booking.rejectReason && (
          <View style={[styles.reasonBox, { backgroundColor: c.rejectedLight }]}>
            <Ionicons name="information-circle-outline" size={13} color={c.rejected} />
            <Text style={[styles.reasonText, { color: c.rejected }]}>{booking.rejectReason}</Text>
          </View>
        )}
        {booking.status === 'pending' && (
          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, { backgroundColor: c.primary }]} onPress={handleConfirm} disabled={confirmLoading}>
              {confirmLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={styles.confirmText}>Tasdiqlash</Text>
                  </>}
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.rejectBtn, { borderColor: c.rejected }]} onPress={() => setRejectModal(true)}>
              <Ionicons name="close" size={14} color={c.rejected} />
              <Text style={[styles.rejectText, { color: c.rejected }]}>Rad</Text>
            </Pressable>
          </View>
        )}
        {booking.status === 'confirmed' && (
          <Pressable style={[styles.callBtn, { backgroundColor: c.primaryLight }]} onPress={handleCall}>
            <Ionicons name="call-outline" size={14} color={c.primary} />
            <Text style={[styles.callText, { color: c.primary }]}>Qo'ng'iroq qilish</Text>
          </Pressable>
        )}
      </View>

      <Modal visible={rejectModal} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
          <View style={[styles.modal, { backgroundColor: c.card }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Rad etish sababi</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
              placeholder="Sabab (ixtiyoriy)..."
              placeholderTextColor={c.textTertiary}
              multiline
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.mBtn, { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1 }]} onPress={() => { setRejectModal(false); setReason(''); }}>
                <Text style={[styles.mBtnText, { color: c.textSecondary }]}>Bekor</Text>
              </Pressable>
              <Pressable style={[styles.mBtn, { backgroundColor: c.rejected }]} onPress={handleRejectSubmit}>
                <Text style={[styles.mBtnText, { color: '#fff' }]}>Rad etish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  topLeft: { flex: 1, marginRight: spacing.sm },
  name: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  field: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  detailRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  reasonText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.sm },
  actionBtn: {
    flex: 1, height: 38, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 5,
  },
  rejectBtn: { borderWidth: 1.5, backgroundColor: 'transparent' },
  confirmText: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  rejectText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, margin: spacing.lg, marginTop: spacing.xs,
    paddingVertical: spacing.sm, borderRadius: radius.md,
  },
  callText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modal: {
    borderRadius: radius.xxl, padding: spacing.xl,
    width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: spacing.md },
  input: {
    borderRadius: radius.lg, padding: spacing.md,
    minHeight: 80, fontSize: 14, fontFamily: 'Inter_400Regular',
    borderWidth: 1, marginBottom: spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  mBtn: { flex: 1, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  mBtnText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
