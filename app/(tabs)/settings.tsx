import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/src/hooks/useColors';
import { radius, spacing } from '@/constants/theme';
import { Field } from '@/src/types';
import { useFieldStore } from '@/src/store/fieldStore';
import { Toast } from '@/components/ui/Toast';

const AMENITIES_ALL = [
  { key: 'Duş', icon: 'water-outline' },
  { key: 'Kiyinish xonasi', icon: 'shirt-outline' },
  { key: 'Tekin parking', icon: 'car-outline' },
  { key: 'Chiroqlar', icon: 'flashlight-outline' },
  { key: 'Kafe', icon: 'cafe-outline' },
  { key: 'Video monitoring', icon: 'videocam-outline' },
];

const HOUR_OPTIONS: string[] = [];
for (let h = 0; h <= 23; h++) {
  HOUR_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
}

export default function SettingsScreen() {
  const c = useColors();
  const { fields, activeFieldId, setActiveField, updateField, addField, saveMyField, loadMyField } = useFieldStore();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState<Partial<Field> & { landmark?: string; coordinates?: string; images?: string[] }>({});
  const [showFieldSelect, setShowFieldSelect] = useState(false);
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);

  const activeField = fields.find(f => f.id === activeFieldId) || fields[0];

  useEffect(() => {
    loadMyField();
  }, []);

  useEffect(() => {
    if (activeField) {
      setFormData({
        name: activeField.name,
        address: activeField.address,
        city: activeField.city,
        lat: activeField.lat,
        lng: activeField.lng,
        pricePerHour: activeField.pricePerHour,
        description: activeField.description,
        openTime: activeField.openTime,
        closeTime: activeField.closeTime,
        amenities: [...activeField.amenities],
        phone: activeField.phone,
        isActive: activeField.isActive,
        images: [...(activeField.images || [])],
        landmark: '',
        coordinates: activeField.lat && activeField.lng ? `${activeField.lat}, ${activeField.lng}` : '',
      });
    }
  }, [activeFieldId, activeField]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateField(activeFieldId, formData);
    try {
      await saveMyField(formData);
      showToast('Saqlandi ✓');
    } catch {
      showToast("Saqlashda xatolik", "error");
    }
  };

  const toggleAmenity = (am: string) => {
    const current = formData.amenities || [];
    const updated = current.includes(am)
      ? current.filter(a => a !== am)
      : [...current, am];
    setFormData(f => ({ ...f, amenities: updated }));
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Rasm yuklash uchun ruxsat kerak', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map(a => a.uri);
      setFormData(f => ({ ...f, images: [...(f.images || []), ...uris] }));
      showToast(`${uris.length} ta rasm qo'shildi`);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setFormData(f => ({
      ...f,
      images: (f.images || []).filter((_, i) => i !== idx),
    }));
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Joylashuv uchun ruxsat kerak', 'error');
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setFormData(f => ({ ...f, lat, lng, coordinates: coords }));
      showToast('Joylashuv aniqlandi ✓');
    } catch {
      showToast('Joylashuv aniqlanmadi', 'error');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    addField({
      name: newFieldName,
      address: '', 
      city: 'Toshkent',
      lat: null,
      lng: null,
      pricePerHour: 80000,
      openTime: '08:00', closeTime: '22:00',
      size: '7x7', surface: "Sun'iy o't",
      amenities: [], images: [], description: '',
      phone: '', isActive: true,
    });
    setNewFieldName('');
    setShowNewField(false);
    showToast("Yangi maydon qo'shildi");
  };

  const s = makeStyles(c);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Sozlamalar</Text>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: c.cardAlt, borderColor: c.border }]}
          onPress={() => setShowFieldSelect(true)}
        >
          <Text style={[styles.headerBtnText, { color: c.text }]} numberOfLines={1}>
            {activeField?.name.replace('GoBron ', '') || 'Maydon'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={c.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Basic info */}
          <SectionHeader label="Asosiy ma'lumotlar" c={c} />
          <View style={[s.card]}>
            <InputRow
              icon="create-outline" label="Nom" c={c}
              value={formData.name || ''}
              onChange={(v: string) => setFormData(f => ({ ...f, name: v }))}
            />
            <InputRow
              icon="location-outline" label="Manzil" c={c}
              value={formData.address || ''}
              onChange={(v: string) => setFormData(f => ({ ...f, address: v }))}
            />
            <InputRow
              icon="business-outline" label="Shahar" c={c}
              value={formData.city || ''}
              onChange={(v: string) => setFormData(f => ({ ...f, city: v }))}
            />
            <InputRow
              icon="flag-outline" label="Mo'ljal" c={c}
              value={formData.landmark || ''}
              onChange={(v: string) => setFormData(f => ({ ...f, landmark: v }))}
              placeholder="Masalan: Dorixona yonida..."
              isLast
            />
          </View>

          {/* Location */}
          <SectionHeader label="Joylashuv" c={c} />
          <View style={[s.card]}>
            <View style={[s.rowItem, { borderBottomWidth: 1, borderBottomColor: c.border }]}>
              <View style={styles.labelRow}>
                <Ionicons name="navigate-outline" size={15} color={c.textSecondary} />
                <Text style={[styles.rowLabel, { color: c.textSecondary }]}>Koordinatalar</Text>
              </View>
              <Text style={[styles.coordText, { color: formData.coordinates ? c.primary : c.textTertiary }]} numberOfLines={1}>
                {formData.coordinates || 'Aniqlanmagan'}
              </Text>
            </View>
            <Pressable
              style={[s.locationBtn, { opacity: locationLoading ? 0.7 : 1 }]}
              onPress={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Ionicons name="locate-outline" size={18} color={c.primary} />
              )}
              <Text style={[styles.locationBtnText, { color: c.primary }]}>
                {locationLoading ? 'Aniqlanmoqda...' : 'Joylashuvni aniqlash'}
              </Text>
            </Pressable>
          </View>

          {/* Pricing */}
          <SectionHeader label="Narx & Telefon" c={c} />
          <View style={[s.card]}>
            <InputRow
              icon="cash-outline" label="Narx (so'm)" c={c}
              value={formData.pricePerHour?.toString() || ''}
              onChange={(v: string) => setFormData(f => ({ ...f, pricePerHour: parseInt(v) || 0 }))}
              keyboardType="numeric"
            />
            <InputRow
              icon="call-outline" label="Telefon" c={c}
              value={formData.phone || ''}
              onChange={(v: string) => setFormData(f => ({ ...f, phone: v }))}
              keyboardType="phone-pad"
              isLast
            />
          </View>

          {/* Work hours */}
          <SectionHeader label="Ish vaqti" c={c} />
          <View style={[s.card]}>
            <Pressable
              style={[s.rowItem, { borderBottomWidth: 1, borderBottomColor: c.border }]}
              onPress={() => setShowOpenPicker(true)}
            >
              <View style={styles.labelRow}>
                <Ionicons name="sunny-outline" size={15} color={c.textSecondary} />
                <Text style={[styles.rowLabel, { color: c.textSecondary }]}>Ochilish</Text>
              </View>
              <View style={[styles.timeChip, { backgroundColor: c.primaryLight }]}>
                <Text style={[styles.timeChipText, { color: c.primary }]}>{formData.openTime || '08:00'}</Text>
                <Ionicons name="chevron-forward" size={12} color={c.primary} />
              </View>
            </Pressable>
            <Pressable style={[s.rowItem]} onPress={() => setShowClosePicker(true)}>
              <View style={styles.labelRow}>
                <Ionicons name="moon-outline" size={15} color={c.textSecondary} />
                <Text style={[styles.rowLabel, { color: c.textSecondary }]}>Yopilish</Text>
              </View>
              <View style={[styles.timeChip, { backgroundColor: c.rejectedLight }]}>
                <Text style={[styles.timeChipText, { color: c.rejected }]}>{formData.closeTime || '22:00'}</Text>
                <Ionicons name="chevron-forward" size={12} color={c.rejected} />
              </View>
            </Pressable>
          </View>

          {/* Amenities */}
          <SectionHeader label="Qulayliklar" c={c} />
          <View style={styles.amenitiesGrid}>
            {AMENITIES_ALL.map(am => {
              const isChecked = (formData.amenities || []).includes(am.key);
              return (
                <Pressable
                  key={am.key}
                  style={[
                    styles.amenityItem,
                    { backgroundColor: isChecked ? c.primaryLight : c.card, borderColor: isChecked ? c.primary : c.border },
                  ]}
                  onPress={() => { toggleAmenity(am.key); Haptics.selectionAsync(); }}
                >
                  <Ionicons name={am.icon as any} size={18} color={isChecked ? c.primary : c.textSecondary} />
                  <Text style={[styles.amenityText, { color: isChecked ? c.primary : c.textSecondary }]}>{am.key}</Text>
                  {isChecked && <Ionicons name="checkmark-circle" size={14} color={c.primary} />}
                </Pressable>
              );
            })}
          </View>

          {/* Description */}
          <SectionHeader label="Tavsif" c={c} />
          <View style={{ paddingHorizontal: spacing.xl }}>
            <TextInput
              style={[styles.descInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
              value={formData.description || ''}
              onChangeText={v => setFormData(f => ({ ...f, description: v }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Maydon haqida batafsil..."
              placeholderTextColor={c.textTertiary}
            />
          </View>

          {/* Images */}
          <SectionHeader label="Rasmlar" c={c} />
          <View style={{ paddingHorizontal: spacing.xl }}>
            <View style={styles.imagesGrid}>
              {(formData.images || []).map((uri, idx) => (
                <View key={idx} style={styles.imageWrap}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <Pressable
                    style={[styles.removeImg, { backgroundColor: c.rejected }]}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}
              <Pressable
                style={[styles.addImageBtn, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={handlePickImage}
              >
                <Ionicons name="camera-outline" size={24} color={c.textTertiary} />
                <Text style={[styles.addImageText, { color: c.textTertiary }]}>Qo'shish</Text>
              </Pressable>
            </View>
          </View>

          {/* Field status */}
          <SectionHeader label="Maydon holati" c={c} />
          <View style={{ paddingHorizontal: spacing.xl }}>
            <View style={[s.card]}>
              <View style={[s.rowItem]}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name={formData.isActive ? 'checkmark-circle-outline' : 'close-circle-outline'}
                    size={15}
                    color={formData.isActive ? c.primary : c.rejected}
                  />
                  <Text style={[styles.rowLabel, { color: c.text }]}>
                    {formData.isActive ? 'Faol' : 'Nofaol'}
                  </Text>
                </View>
                <Switch
                  value={formData.isActive || false}
                  onValueChange={v => { setFormData(f => ({ ...f, isActive: v })); Haptics.selectionAsync(); }}
                  trackColor={{ false: c.border, true: c.primaryLight }}
                  thumbColor={formData.isActive ? c.primary : c.textTertiary}
                />
              </View>
            </View>
            {!formData.isActive && (
              <View style={[styles.warningBox, { backgroundColor: c.pendingLight }]}>
                <Ionicons name="warning-outline" size={15} color={c.pending} />
                <Text style={[styles.warningText, { color: c.pending }]}>Foydalanuvchilar bu maydonni ko'ra olmaydi</Text>
              </View>
            )}
          </View>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: c.primary, shadowColor: c.primary }]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Saqlash</Text>
          </Pressable>
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Field Select Modal */}
      <Modal visible={showFieldSelect} transparent animationType="slide">
        <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={() => setShowFieldSelect(false)}>
          <View style={[styles.selectModal, { backgroundColor: c.card }]}>
            <View style={[styles.selectHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.selectTitle, { color: c.text }]}>Maydon tanlash</Text>
              <Pressable onPress={() => setShowFieldSelect(false)}>
                <Ionicons name="close" size={22} color={c.textSecondary} />
              </Pressable>
            </View>
            {fields.map(f => (
              <Pressable
                key={f.id}
                style={[styles.selectItem, { borderBottomColor: c.border }, activeFieldId === f.id && { backgroundColor: c.primaryLight }]}
                onPress={() => { setActiveField(f.id); setShowFieldSelect(false); Haptics.selectionAsync(); }}
              >
                <View style={styles.selectItemLeft}>
                  <Ionicons name="football-outline" size={18} color={activeFieldId === f.id ? c.primary : c.textSecondary} />
                  <View>
                    <Text style={[styles.selectItemName, { color: activeFieldId === f.id ? c.primary : c.text }]}>{f.name}</Text>
                    <Text style={[styles.selectItemSub, { color: c.textSecondary }]}>{f.address || 'Manzil kiritilmagan'}</Text>
                  </View>
                </View>
                <View style={styles.selectItemRight}>
                  {!f.isActive && (
                    <View style={[styles.inactiveBadge, { backgroundColor: c.rejectedLight }]}>
                      <Text style={[styles.inactiveBadgeText, { color: c.rejected }]}>Nofaol</Text>
                    </View>
                  )}
                  {activeFieldId === f.id && <Ionicons name="checkmark-circle" size={20} color={c.primary} />}
                </View>
              </Pressable>
            ))}
            <Pressable
              style={[styles.addFieldBtn, { borderColor: c.primary }]}
              onPress={() => { setShowFieldSelect(false); setShowNewField(true); }}
            >
              <Ionicons name="add-circle-outline" size={18} color={c.primary} />
              <Text style={[styles.addFieldText, { color: c.primary }]}>Yangi maydon qo'shish</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Time Picker Modals */}
      <TimePickerModal
        visible={showOpenPicker}
        title="Ochilish vaqti"
        current={formData.openTime || '08:00'}
        onSelect={(v: string) => { setFormData(f => ({ ...f, openTime: v })); setShowOpenPicker(false); }}
        onClose={() => setShowOpenPicker(false)}
        c={c}
      />
      <TimePickerModal
        visible={showClosePicker}
        title="Yopilish vaqti"
        current={formData.closeTime || '22:00'}
        onSelect={(v: string) => { setFormData(f => ({ ...f, closeTime: v })); setShowClosePicker(false); }}
        onClose={() => setShowClosePicker(false)}
        c={c}
      />

      {/* New Field Modal */}
      <Modal visible={showNewField} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
          <View style={[styles.newFieldModal, { backgroundColor: c.card }]}>
            <Text style={[styles.newFieldTitle, { color: c.text }]}>Yangi maydon</Text>
            <TextInput
              style={[styles.newFieldInput, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
              placeholder="Maydon nomi..."
              placeholderTextColor={c.textTertiary}
              value={newFieldName}
              onChangeText={setNewFieldName}
              autoFocus
            />
            <View style={styles.newFieldActions}>
              <Pressable style={[styles.nfBtn, { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1 }]} onPress={() => { setShowNewField(false); setNewFieldName(''); }}>
                <Text style={[styles.nfBtnText, { color: c.textSecondary }]}>Bekor</Text>
              </Pressable>
              <Pressable style={[styles.nfBtn, { backgroundColor: c.primary }]} onPress={handleAddField}>
                <Text style={[styles.nfBtnText, { color: '#fff' }]}>Qo'shish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </SafeAreaView>
  );
}

function TimePickerModal({ visible, title, current, onSelect, onClose, c }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={onClose}>
        <View style={[styles.timePickerModal, { backgroundColor: c.card }]}>
          <View style={[styles.selectHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.selectTitle, { color: c.text }]}>{title}</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={22} color={c.textSecondary} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {HOUR_OPTIONS.map(h => (
              <Pressable
                key={h}
                style={[styles.timeOption, { borderBottomColor: c.border }, current === h && { backgroundColor: c.primaryLight }]}
                onPress={() => { Haptics.selectionAsync(); onSelect(h); }}
              >
                <Text style={[styles.timeOptionText, { color: current === h ? c.primary : c.text }]}>{h}</Text>
                {current === h && <Ionicons name="checkmark-circle" size={18} color={c.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

function SectionHeader({ label, c }: { label: string; c: any }) {
  return (
    <Text style={[secStyle.title, { color: c.textSecondary }]}>{label}</Text>
  );
}

function InputRow({ icon, label, value, onChange, c, keyboardType, isLast, placeholder }: any) {
  return (
    <View style={[rowStyle.row, !isLast && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      <View style={rowStyle.labelWrap}>
        <Ionicons name={icon} size={15} color={c.textSecondary} />
        <Text style={[rowStyle.label, { color: c.textSecondary }]}>{label}</Text>
      </View>
      <TextInput
        style={[rowStyle.input, { color: c.text }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        textAlign="right"
        placeholder={placeholder || ''}
        placeholderTextColor={c.textTertiary}
      />
    </View>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: radius.xl,
      overflow: 'hidden',
      marginHorizontal: spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
    },
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      minHeight: 52,
    },
    locationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
  });
}

const secStyle = StyleSheet.create({
  title: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});

const rowStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
    gap: spacing.md,
  },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  label: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  input: { flex: 2, fontSize: 14, fontFamily: 'Inter_500Medium' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, maxWidth: 180,
  },
  headerBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  coordText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },
  locationBtnText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  timeChipText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  amenitiesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.xl, gap: spacing.sm,
  },
  amenityItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg, borderWidth: 1,
  },
  amenityText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  descInput: {
    borderRadius: radius.xl, padding: spacing.lg,
    fontSize: 14, fontFamily: 'Inter_400Regular',
    borderWidth: 1, minHeight: 100,
  },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  imageWrap: { position: 'relative', width: 90, height: 90 },
  imageThumb: { width: 90, height: 90, borderRadius: radius.lg },
  removeImg: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  addImageBtn: {
    width: 90, height: 90, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderStyle: 'dashed', gap: 4,
  },
  addImageText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  warningBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, borderRadius: radius.lg,
    padding: spacing.md, marginTop: spacing.sm,
  },
  warningText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.xl, height: 54,
    marginHorizontal: spacing.xl, marginTop: spacing.xl,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  selectModal: {
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    paddingBottom: 34, maxHeight: '75%',
  },
  selectHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.xl, borderBottomWidth: 1,
  },
  selectTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  selectItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1,
  },
  selectItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  selectItemName: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  selectItemSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  selectItemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inactiveBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  inactiveBadgeText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  addFieldBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.xl, borderTopWidth: 1.5,
    borderStyle: 'dashed', borderColor: '#16A34A', margin: spacing.lg,
    borderRadius: radius.lg,
  },
  addFieldText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  timePickerModal: {
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    maxHeight: '60%',
  },
  timeOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1,
  },
  timeOptionText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  newFieldModal: {
    borderRadius: radius.xxl, padding: spacing.xl,
    marginHorizontal: spacing.xl, alignSelf: 'center', width: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, elevation: 10,
  },
  newFieldTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: spacing.md },
  newFieldInput: {
    borderRadius: radius.lg, padding: spacing.md,
    fontSize: 14, fontFamily: 'Inter_400Regular',
    borderWidth: 1, marginBottom: spacing.md,
  },
  newFieldActions: { flexDirection: 'row', gap: spacing.sm },
  nfBtn: { flex: 1, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  nfBtnText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
