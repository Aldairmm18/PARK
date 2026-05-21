import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [slotsState, setSlotsState] = useState<ScreenState<TimeSlot[]>>({ status: 'loading' });

  const loadSlots = useCallback(async () => {
    setSlotsState({ status: 'loading' });
    try {
      const slots = await parkingService.getTimeSlots(parkingId!, format(selectedDate, 'yyyy-MM-dd'));
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
      if (prev.length === 0) return [slot];
      const sorted = [...prev, slot].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        if (new Date(sorted[i].endsAt).getTime() !== new Date(sorted[i + 1].startsAt).getTime()) {
          return [slot];
        }
      }
      return sorted;
    });
  };

  const totalPrice = selectedSlots.reduce((sum, s) => sum + (s.pricePerBlock ?? 0), 0);
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(startOfDay(new Date()), i));

  const handleContinue = () => {
    if (selectedSlots.length === 0) return;
    const sorted = [...selectedSlots].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    const params = new URLSearchParams({
      parkingId: parkingId!,
      slotIds: sorted.map(s => s.id).join(','),
      startsAt: sorted[0].startsAt,
      endsAt: sorted[sorted.length - 1].endsAt,
      totalPrice: String(totalPrice),
    });
    router.push(`/parking/payment?${params.toString()}` as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.header} />

      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Disponibilidad</Text>
          <Text style={styles.heroTitle}>Selecciona horario</Text>
        </View>

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysContent}
        >
          {days.map(day => {
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[styles.dayWeekday, isSelected && styles.dayTextSelected]}>
                  {isToday ? 'Hoy' : format(day, 'EEE', { locale: es })}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayTextSelected]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Slots */}
      {slotsState.status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : slotsState.status === 'error' ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={Colors.textMuted} />
          <Text style={styles.errorText}>{slotsState.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadSlots}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + (selectedSlots.length > 0 ? 100 : 24) }]}>
          <TimeSlotGrid
            slots={slotsState.data!}
            selectedSlots={selectedSlots}
            onSlotPress={handleSlotPress}
          />
        </ScrollView>
      )}

      {/* Footer */}
      {selectedSlots.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View>
            <Text style={styles.footerSlots}>
              {selectedSlots.length} bloque{selectedSlots.length > 1 ? 's' : ''} · {selectedSlots.length * 30} min
            </Text>
            <Text style={styles.footerPrice}>${totalPrice.toLocaleString('es-CO')} COP</Text>
          </View>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.background },
  hero:             { backgroundColor: Colors.header, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:          { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroContent:      { marginBottom: 18 },
  heroLabel:        { fontSize: 12, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroTitle:        { fontSize: 26, fontWeight: '800', color: '#fff' },

  daysContent:      { paddingRight: 4, gap: 8 },
  dayBtn:           { width: 54, height: 62, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', gap: 2 },
  dayBtnSelected:   { backgroundColor: Colors.accent },
  dayWeekday:       { fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize', fontWeight: '500' },
  dayNum:           { fontSize: 20, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  dayTextSelected:  { color: '#fff', opacity: 1 },

  body:             { padding: 16 },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText:        { color: Colors.error, textAlign: 'center', fontSize: 15 },
  retryBtn:         { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:        { color: '#fff', fontWeight: '700' },

  footer:           { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  footerSlots:      { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  footerPrice:      { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  continueBtn:      { backgroundColor: Colors.accent, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  continueBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
