import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ErrorMessage } from '@/components/ErrorMessage';
import { reservationService } from '@/services/reservationService';
import { authService } from '@/services/authService';
import { ScreenState } from '@/domain/models';

const PLATE_REGEX = /^[A-Z]{3}[0-9]{3}$/i;

export default function PaymentScreen() {
  const { parkingId, slotIds, startsAt, endsAt, totalPrice } = useLocalSearchParams<{
    parkingId: string;
    slotIds: string;
    startsAt: string;
    endsAt: string;
    totalPrice: string;
  }>();
  const router = useRouter();
  const [plate, setPlate] = useState('');
  const [state, setState] = useState<ScreenState<string>>({ status: 'idle' });

  const slots = (slotIds ?? '').split(',').filter(Boolean);
  const price = Number(totalPrice ?? 0);
  const start = startsAt ? new Date(startsAt) : new Date();
  const end = endsAt ? new Date(endsAt) : new Date();

  const handleConfirm = async () => {
    if (!plate.trim()) {
      setState({ status: 'error', error: 'Ingresa la placa del vehículo' });
      return;
    }
    if (!PLATE_REGEX.test(plate.trim())) {
      setState({ status: 'error', error: 'Formato de placa inválido (ej: ABC123)' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const user = await authService.currentUser();
      if (!user) throw new Error('No autenticado');
      const { reservation } = await reservationService.createReservation({
        ownerId: user.id,
        parkingLotId: parkingId!,
        selectedSlots: slots.map(id => ({ id, startsAt: startsAt!, endsAt: endsAt! })),
        vehiclePlate: plate.trim().toUpperCase(),
      });
      router.replace(`/parking/confirmation?reservationId=${reservation.id}` as any);
    } catch (e: any) {
      setState({ status: 'error', error: e.message ?? 'Error al confirmar reserva' });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Confirmar reserva</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="time-outline" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Inicio</Text>
                <Text style={styles.summaryValue}>
                  {format(start, "EEE d MMM · HH:mm", { locale: es })}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="flag-outline" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Fin</Text>
                <Text style={styles.summaryValue}>
                  {format(end, "EEE d MMM · HH:mm", { locale: es })}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="layers-outline" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Bloques</Text>
                <Text style={styles.summaryValue}>{slots.length} × 30 min</Text>
              </View>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${price.toLocaleString('es-CO')} COP</Text>
            </View>
          </View>

          <View style={styles.plateSection}>
            <Text style={styles.plateLabel}>Placa del vehículo</Text>
            <TextInput
              style={styles.plateInput}
              value={plate}
              onChangeText={t => setPlate(t.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              maxLength={6}
            />
            <Text style={styles.plateHint}>Formato: 3 letras + 3 números</Text>
          </View>

          {state.status === 'error' && (
            <ErrorMessage message={state.error!} onDismiss={() => setState({ status: 'idle' })} />
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, state.status === 'loading' && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={state.status === 'loading'}
          >
            {state.status === 'loading'
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>Pagar y reservar</Text>
                </>
              )
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:              { flex: 1 },
  safe:              { flex: 1, backgroundColor: Colors.background },
  topBar:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:           { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle:          { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content:           { padding: 16, gap: 16 },
  summaryCard:       { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  summaryTitle:      { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  summaryRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  summaryIcon:       { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  summaryLabel:      { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  summaryValue:      { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  totalRow:          { borderBottomWidth: 0, justifyContent: 'space-between', paddingTop: 14, marginTop: 4 },
  totalLabel:        { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue:        { fontSize: 20, fontWeight: '800', color: Colors.accent },
  plateSection:      { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  plateLabel:        { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  plateInput:        { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 22, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 4, textAlign: 'center' },
  plateHint:         { fontSize: 12, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  confirmBtn:        { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmBtnDisabled:{ opacity: 0.6 },
  confirmBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
