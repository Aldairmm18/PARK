import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { TimeSlotGrid } from '@/components/TimeSlotGrid';
import { parkingService } from '@/services/parkingService';
import { TimeSlot, ScreenState } from '@/domain/models';

const DAYS_AHEAD = 7;

export default function AvailabilityScreen() {
  const { parkingId } = useLocalSearchParams<{ parkingId: string }>();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [slotsState, setSlotsState] = useState<ScreenState<TimeSlot[]>>({ status: 'loading' });

  const loadSlots = useCallback(async () => {
    setSlotsState({ status: 'loading' });
    try {
      const slots = await parkingService.getTimeSlots(parkingId!, selectedDate.toISOString());
      setSlotsState({ status: 'success', data: slots });
    } catch (e: any) {
      setSlotsState({ status: 'error', error: e.message ?? 'Error al cargar horarios' });
    }
    setSelectedSlots([]);
  }, [parkingId, selectedDate]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleSlotPress = (slot: TimeSlot) => {
    if (slot.availableCapacity === 0) return;
    setSelectedSlots(prev => {
      const idx = prev.findIndex(s => s.id === slot.id);
      if (idx >= 0) return prev.filter(s => s.id !== slot.id);
      // Only allow contiguous slots
      if (prev.length === 0) return [slot];
      const allSlots = slotsState.status === 'success' ? slotsState.data! : [];
      const sorted = [...prev, slot].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
      // Check contiguity
      for (let i = 0; i < sorted.length - 1; i++) {
        if (new Date(sorted[i].endsAt).getTime() !== new Date(sorted[i + 1].startsAt).getTime()) {
          return [slot]; // Reset to just this slot if not contiguous
        }
      }
      return sorted;
    });
  };

  const totalPrice = selectedSlots.reduce((sum, s) => sum + (s.pricePerBlock ?? 0), 0);

  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(startOfDay(new Date()), i));

  const handleContinue = () => {
    if (selectedSlots.length === 0) return;
    const sortedSelected = [...selectedSlots].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    const params = new URLSearchParams({
      parkingId: parkingId!,
      slotIds: sortedSelected.map(s => s.id).join(','),
      startsAt: sortedSelected[0].startsAt,
      endsAt: sortedSelected[sortedSelected.length - 1].endsAt,
      totalPrice: String(totalPrice),
    });
    router.push(`/parking/payment?${params.toString()}` as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Selecciona horario</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView stickyHeaderIndices={[0]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll} contentContainerStyle={styles.daysContent}>
          {days.map(day => {
            const isSelected = day.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[styles.dayWeekday, isSelected && styles.dayTextSelected]}>
                  {format(day, 'EEE', { locale: es })}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayTextSelected]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.body}>
          {slotsState.status === 'loading' ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : slotsState.status === 'error' ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{slotsState.error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadSlots}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TimeSlotGrid
              slots={slotsState.data!}
              selectedSlots={selectedSlots}
              onSlotPress={handleSlotPress}
            />
          )}
        </View>
      </ScrollView>

      {selectedSlots.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerSlots}>{selectedSlots.length} bloque(s) seleccionado(s)</Text>
            <Text style={styles.footerPrice}>${totalPrice.toLocaleString('es-CO')} COP</Text>
          </View>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.background },
  topBar:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: Colors.background },
  backBtn:          { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle:         { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  daysScroll:       { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  daysContent:      { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  dayBtn:           { width: 52, height: 60, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', gap: 2 },
  dayBtnSelected:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dayWeekday:       { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' },
  dayNum:           { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  dayTextSelected:  { color: '#fff' },
  body:             { padding: 16 },
  center:           { paddingVertical: 48, justifyContent: 'center', alignItems: 'center' },
  errorText:        { color: Colors.error, textAlign: 'center', marginBottom: 12 },
  retryBtn:         { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 },
  retryText:        { color: '#fff', fontWeight: '700' },
  footer:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  footerSlots:      { fontSize: 13, color: Colors.textSecondary },
  footerPrice:      { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  continueBtn:      { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13 },
  continueBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
