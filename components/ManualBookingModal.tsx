import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/src/hooks/useColors';
import { radius, spacing } from '@/constants/theme';
import { useFieldStore } from '@/src/store/fieldStore';
import { useBookingStore } from '@/src/store/bookingStore';
import { formatPrice } from '@/src/utils/format';

const DAYS_UZ = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const MONTHS_UZ = ['Yan', 'Feb', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

function getNext7Days() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push({
      date: d,
      label: `${d.getDate()} ${MONTHS_UZ[d.getMonth()]}`,
      day: DAYS_UZ[d.getDay()],
      key: d.toISOString().split('T')[0],
    });
  }
  return days;
}

function buildSlots(openTime: string, closeTime: string): string[] {
  const slots: string[] = [];
  const [openH] = openTime.split(':').map(Number);
  let [closeH] = closeTime.split(':').map(Number);
  if (closeH <= openH) closeH += 24;
  for (let h = openH; h < closeH; h++) {
    const startH = h % 24;
    const endH = (h + 1) % 24;
    slots.push(`${String(startH).padStart(2, '0')}:00–${String(endH).padStart(2, '0')}:00`);
  }
  return slots;
}

interface ManualBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualBookingModal({ visible, onClose, onSuccess }: ManualBookingModalProps) {
  const c = useColors();
  const { fields } = useFieldStore();
  const { addManual, bookings } = useBookingStore();

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const days = useMemo(() => getNext7Days(), [visible]);
  const activeField = fields.find(f => f.id === selectedFieldId) || fields[0];
  const slots = useMemo(() => {
    if (!activeField) return [];
    return buildSlots(activeField.openTime || '08:00', activeField.closeTime || '22:00');
  }, [activeField]);

  const bookedSlotsOnDay = useMemo(() => {
    if (!selectedFieldId || !selectedDayKey) return new Set<string>();
    const dayBookings = bookings.filter(
      b => b.fieldId === selectedFieldId && b.dateKey === selectedDayKey && b.status !== 'rejected' && b.status !== 'cancelled'
    );
    const booked = new Set<string>();
    dayBookings.forEach(b => {
      const [sh] = b.startTime.split(':').map(Number);
      const [eh] = b.endTime.split(':').map(Number);
      let end = eh;
      if (end <= sh) end += 24;
      for (let h = sh; h < end; h++) {
        const s = `${String(h % 24).padStart(2, '0')}:00–${String((h + 1) % 24).padStart(2, '0')}:00`;
        booked.add(s);
      }
    });
    return booked;
  }, [bookings, selectedFieldId, selectedDayKey]);

  const toggleSlot = (slot: string) => {
    if (bookedSlotsOnDay.has(slot)) return;
    Haptics.selectionAsync();
    setSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const totalPrice = selectedSlots.length * (activeField?.pricePerHour || 0);

  const handleClose = () => {
    setStep(1);
    setSelectedSlots([]);
    setCustomerName('');
    setCustomerPhone('');
    setNote('');
    onClose();
  };

  const handleBook = () => {
    if (!customerName.trim() || selectedSlots.length === 0 || !activeField) return;
    const sortedSlots = [...selectedSlots].sort();
    const firstSlot = sortedSlots[0].split('–')[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1].split('–')[1];
    const dayObj = days.find(d => d.key === selectedDayKey);
    addManual({
      fieldId: activeField.id,
      fieldName: activeField.name,
      dateKey: selectedDayKey,
      dateLabel: dayObj?.label || selectedDayKey,
      startTime: firstSlot,
      endTime: lastSlot,
      slots: sortedSlots,
      userName: customerName,
      userPhone: customerPhone,
      totalPrice,
      status: 'confirmed',
      note,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
    onSuccess();
  };

  const canNext = selectedSlots.length > 0;
  const canBook = canNext && customerName.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={[styles.sheet, { backgroundColor: c.card }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: c.border }]}>
              <View style={styles.headerLeft}>
                {step === 2 ? (
                  <Pressable style={[styles.backBtn, { backgroundColor: c.bg }]} onPress={() => setStep(1)}>
                    <Ionicons name="chevron-back" size={18} color={c.text} />
                  </Pressable>
                ) : (
                  <View style={[styles.headerIcon, { backgroundColor: c.primaryLight }]}>
                    <Ionicons name="add-circle-outline" size={20} color={c.primary} />
                  </View>
                )}
                <View>
                  <Text style={[styles.headerTitle, { color: c.text }]}>Qo'lda band qilish</Text>
                  <Text style={[styles.headerSub, { color: c.textSecondary }]}>
                    {step === 1 ? 'Vaqtni tanlang' : 'Mijoz ma\'lumotlari'}
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleClose}>
                <Ionicons name="close-circle" size={26} color={c.textTertiary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {step === 1 ? (
                <>
                  {/* Field selector */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Maydon</Text>
                    <Pressable
                      style={[styles.fieldSelector, { backgroundColor: c.bg, borderColor: c.border }]}
                      onPress={() => setShowFieldPicker(true)}
                    >
                      <Ionicons name="football-outline" size={16} color={c.primary} />
                      <Text style={[styles.fieldSelectorText, { color: c.text }]}>{activeField?.name || 'Tanlang'}</Text>
                      <Ionicons name="chevron-down" size={14} color={c.textSecondary} />
                    </Pressable>
                    {showFieldPicker && (
                      <View style={[styles.fieldDropdown, { backgroundColor: c.card, borderColor: c.border }]}>
                        {fields.map(f => (
                          <Pressable
                            key={f.id}
                            style={[styles.fieldOption, { borderBottomColor: c.border }, selectedFieldId === f.id && { backgroundColor: c.primaryLight }]}
                            onPress={() => { setSelectedFieldId(f.id); setShowFieldPicker(false); setSelectedSlots([]); Haptics.selectionAsync(); }}
                          >
                            <Ionicons name="football-outline" size={15} color={selectedFieldId === f.id ? c.primary : c.textSecondary} />
                            <Text style={[styles.fieldOptionText, { color: selectedFieldId === f.id ? c.primary : c.text }]}>{f.name}</Text>
                            {selectedFieldId === f.id && <Ionicons name="checkmark-circle" size={16} color={c.primary} />}
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Day picker */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Sana</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
                      {days.map(d => (
                        <Pressable
                          key={d.key}
                          style={[
                            styles.dayChip,
                            { borderColor: c.border, backgroundColor: c.bg },
                            selectedDayKey === d.key && { backgroundColor: c.primary, borderColor: c.primary },
                          ]}
                          onPress={() => { setSelectedDayKey(d.key); setSelectedSlots([]); Haptics.selectionAsync(); }}
                        >
                          <Text style={[styles.dayChipDay, { color: selectedDayKey === d.key ? 'rgba(255,255,255,0.8)' : c.textTertiary }]}>{d.day}</Text>
                          <Text style={[styles.dayChipDate, { color: selectedDayKey === d.key ? '#fff' : c.text }]}>{d.label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Slots */}
                  <View style={styles.section}>
                    <View style={styles.slotHeader}>
                      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Vaqt slotlari</Text>
                      {selectedSlots.length > 0 && (
                        <Pressable onPress={() => setSelectedSlots([])}>
                          <Text style={[styles.clearSlots, { color: c.rejected }]}>Tozalash</Text>
                        </Pressable>
                      )}
                    </View>
                    <View style={styles.slotsGrid}>
                      {slots.map(slot => {
                        const isBooked = bookedSlotsOnDay.has(slot);
                        const isSelected = selectedSlots.includes(slot);
                        return (
                          <Pressable
                            key={slot}
                            style={[
                              styles.slotChip,
                              { backgroundColor: c.bg, borderColor: c.border },
                              isSelected && { backgroundColor: c.primary, borderColor: c.primary },
                              isBooked && { backgroundColor: c.rejectedLight, borderColor: c.rejected },
                            ]}
                            onPress={() => toggleSlot(slot)}
                            disabled={isBooked}
                          >
                            <Text style={[
                              styles.slotText,
                              { color: c.text },
                              isSelected && { color: '#fff', fontFamily: 'Inter_700Bold' },
                              isBooked && { color: c.rejected },
                            ]}>
                              {slot}
                            </Text>
                            {isBooked && <Ionicons name="close-circle" size={10} color={c.rejected} />}
                            {isSelected && <Ionicons name="checkmark-circle" size={10} color="rgba(255,255,255,0.9)" />}
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.slotLegend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: c.primary }]} />
                        <Text style={[styles.legendText, { color: c.textSecondary }]}>Tanlangan</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: c.rejected }]} />
                        <Text style={[styles.legendText, { color: c.textSecondary }]}>Band</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: c.border }]} />
                        <Text style={[styles.legendText, { color: c.textSecondary }]}>Bo'sh</Text>
                      </View>
                    </View>
                  </View>

                  {/* Summary */}
                  {selectedSlots.length > 0 && (
                    <View style={[styles.summary, { backgroundColor: c.primaryLight, borderColor: c.primary }]}>
                      <View style={styles.summaryRow}>
                        <Ionicons name="time-outline" size={14} color={c.primary} />
                        <Text style={[styles.summaryText, { color: c.primary }]}>
                          {selectedSlots.length} ta slot tanlandi
                        </Text>
                      </View>
                      <Text style={[styles.summaryPrice, { color: c.primary }]}>{formatPrice(totalPrice)}</Text>
                    </View>
                  )}
                </>
              ) : (
                /* Step 2: Customer info */
                <View style={styles.section}>
                  <View style={[styles.bookingSummary, { backgroundColor: c.bg, borderColor: c.border }]}>
                    <View style={styles.summaryInfoRow}>
                      <Ionicons name="football-outline" size={14} color={c.textSecondary} />
                      <Text style={[styles.summaryInfo, { color: c.textSecondary }]}>{activeField?.name}</Text>
                    </View>
                    <View style={styles.summaryInfoRow}>
                      <Ionicons name="time-outline" size={14} color={c.textSecondary} />
                      <Text style={[styles.summaryInfo, { color: c.textSecondary }]}>
                        {[...selectedSlots].sort().join(', ')}
                      </Text>
                    </View>
                    <View style={styles.summaryInfoRow}>
                      <Ionicons name="cash-outline" size={14} color={c.primary} />
                      <Text style={[styles.summaryInfo, { color: c.primary, fontFamily: 'Inter_700Bold' }]}>{formatPrice(totalPrice)}</Text>
                    </View>
                  </View>

                  <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: spacing.lg }]}>Mijoz ismi *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
                    placeholder="To'liq ism..."
                    placeholderTextColor={c.textTertiary}
                    value={customerName}
                    onChangeText={setCustomerName}
                    autoFocus
                  />

                  <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Telefon</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
                    placeholder="+998 90 000 00 00"
                    placeholderTextColor={c.textTertiary}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    keyboardType="phone-pad"
                  />

                  <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Izoh (ixtiyoriy)</Text>
                  <TextInput
                    style={[styles.input, styles.noteInput, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
                    placeholder="Qo'shimcha ma'lumot..."
                    placeholderTextColor={c.textTertiary}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: c.border }]}>
              {step === 1 ? (
                <Pressable
                  style={[styles.nextBtn, { backgroundColor: canNext ? c.primary : c.border }]}
                  onPress={() => { if (canNext) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(2); } }}
                  disabled={!canNext}
                >
                  <Text style={[styles.nextBtnText, { color: canNext ? '#fff' : c.textTertiary }]}>
                    Davom etish  ({selectedSlots.length} slot)
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={canNext ? '#fff' : c.textTertiary} />
                </Pressable>
              ) : (
                <View style={styles.footerRow}>
                  <View>
                    <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Jami summa</Text>
                    <Text style={[styles.totalPrice, { color: c.primary }]}>{formatPrice(totalPrice)}</Text>
                  </View>
                  <Pressable
                    style={[styles.bookBtn, { backgroundColor: canBook ? c.primary : c.border }]}
                    onPress={handleBook}
                    disabled={!canBook}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={canBook ? '#fff' : c.textTertiary} />
                    <Text style={[styles.bookBtnText, { color: canBook ? '#fff' : c.textTertiary }]}>Band qilish</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 12,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  section: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  fieldSelector: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md + 2,
  },
  fieldSelectorText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  fieldDropdown: {
    borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.xs,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    overflow: 'hidden',
  },
  fieldOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  fieldOptionText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  dayScroll: { marginBottom: spacing.xs },
  dayChip: {
    borderRadius: radius.lg, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginRight: spacing.sm, alignItems: 'center', minWidth: 70,
  },
  dayChipDay: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  dayChipDate: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearSlots: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  slotChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.lg, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  slotText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  slotLegend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  summary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, padding: spacing.md,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  summaryText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  summaryPrice: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  bookingSummary: {
    borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  summaryInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  summaryInfo: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1, flexWrap: 'wrap' },
  input: {
    borderRadius: radius.lg, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 14, fontFamily: 'Inter_400Regular',
    marginBottom: spacing.md,
  },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  footer: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    paddingBottom: 34, borderTopWidth: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  totalPrice: { fontSize: 20, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.xl, height: 52,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.xl, height: 50, paddingHorizontal: spacing.xl,
  },
  bookBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});
