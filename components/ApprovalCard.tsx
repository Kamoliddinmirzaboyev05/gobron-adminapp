import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { formatPrice, getTimeAgo } from '@/src/utils/format';

interface ApprovalCardProps {
  booking: Booking;
  onConfirm: (name: string) => void;
  onReject: () => void;
}

export function ApprovalCard({ booking, onConfirm, onReject }: ApprovalCardProps) {
  const c = useColors();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { confirm, reject } = useBookingStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleConfirm = async () => {
    setConfirmLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      confirm(booking.id);
      setConfirmLoading(false);
      onConfirm(booking.userName);
    }, 900);
  };

  const submitReject = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await reject(booking.id, rejectReason);
    setRejectModalVisible(false);
    setRejectReason('');
    onReject();
  };

  return (
    <>
      <Animated.View style={[styles.card, {
        backgroundColor: c.card,
        borderColor: c.border,
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
        shadowColor: c.pending,
      }]}>
        <View style={[styles.accentBar, { backgroundColor: c.pending }]} />
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.newBadge}>
              <Animated.View style={[styles.dot, { backgroundColor: c.pending, opacity: pulseAnim }]} />
              <Text style={[styles.newText, { color: c.pending }]}>Yangi so'rov</Text>
            </View>
            <Text style={[styles.time, { color: c.textTertiary }]}>{getTimeAgo(booking.createdAt)}</Text>
          </View>

          <View style={[styles.infoBlock, { backgroundColor: c.bg, borderColor: c.border }]}>
            <InfoRow icon="person-outline" label="Foydalanuvchi" value={booking.userName} c={c} />
            <InfoRow icon="call-outline" label="Telefon" value={booking.userPhone} c={c} />
            <InfoRow icon="location-outline" label="Maydon" value={booking.fieldName} c={c} />
            <InfoRow icon="time-outline" label="Vaqt" value={`${booking.dateLabel}, ${booking.startTime}–${booking.endTime}`} c={c} />
            <InfoRow icon="cash-outline" label="Narx" value={formatPrice(booking.totalPrice)} c={c} isLast />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.confirmBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleConfirm}
              disabled={confirmLoading}
            >
              {confirmLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.confirmText}>Tasdiqlash</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.rejectBtn, { borderColor: c.rejected, opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setRejectModalVisible(true)}
            >
              <Ionicons name="close-circle-outline" size={16} color={c.rejected} />
              <Text style={[styles.rejectText, { color: c.rejected }]}>Rad etish</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
          <View style={[styles.modal, { backgroundColor: c.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="close-circle" size={24} color={c.rejected} />
              </View>
              <View style={styles.modalTitles}>
                <Text style={[styles.modalTitle, { color: c.text }]}>Rad etish sababi</Text>
                <Text style={[styles.modalSubtitle, { color: c.textSecondary }]}>{booking.userName}</Text>
              </View>
            </View>
            <TextInput
              style={[styles.modalInput, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
              placeholder="Sabab (ixtiyoriy)..."
              placeholderTextColor={c.textTertiary}
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1 }]}
                onPress={() => { setRejectModalVisible(false); setRejectReason(''); }}
              >
                <Text style={[styles.modalBtnText, { color: c.textSecondary }]}>Bekor qilish</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: c.rejected }]}
                onPress={submitReject}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Rad etish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ icon, label, value, c, isLast }: any) {
  return (
    <View style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      <Ionicons name={icon} size={14} color={c.textTertiary} />
      <Text style={[styles.rowLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  accentBar: { height: 4 },
  inner: { padding: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  newBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  newText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  time: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  infoBlock: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  rowLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  rowValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'right', flex: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, height: 46, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: spacing.xs,
  },
  confirmBtn: {},
  confirmText: { color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  rejectBtn: { borderWidth: 1.5, backgroundColor: 'transparent' },
  rejectText: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl,
  },
  modal: {
    borderRadius: radius.xxl, padding: spacing.xl,
    width: '100%', maxWidth: 380,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  modalIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitles: {},
  modalTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  modalSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  modalInput: {
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 90,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalBtn: {
    flex: 1, height: 46, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: spacing.xs,
  },
  modalBtnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});
