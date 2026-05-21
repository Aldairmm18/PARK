import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ErrorMessage } from '@/components/ErrorMessage';
import { reservationService } from '@/services/reservationService';
import { authService } from '@/services/authService';
import { ScreenState } from '@/domain/models';
import { VehicleType } from '@/domain/enums';

const PLATE_CAR  = /^[A-Z]{3}[0-9]{3}$/i;
const PLATE_MOTO = /^[A-Z]{3}[0-9]{2}$/i;

export default function PaymentScreen() {
  const { parkingId, slotIds, startsAt, endsAt, totalPrice } = useLocalSearchParams<{
    parkingId: string; slotIds: string; startsAt: string; endsAt: string; totalPrice: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [plate, setPlate] = useState('');
  const [state, setState] = useState<ScreenState<string>>({ status: 'idle' });

  const slots = (slotIds ?? '').split(',').filter(Boolean);
  const price = Number(totalPrice ?? 0);
  const start = startsAt ? new Date(startsAt) : new Date();
  const end   = endsAt   ? new Date(endsAt)   : new Date();

  const isCar      = vehicleType === VehicleType.CAR;
  const plateRegex = isCar ? PLATE_CAR : PLATE_MOTO;
  const plateHint  = isCar ? 'Ej: ABC123 (3 letras + 3 números)' : 'Ej: ABC12 (3 letras + 2 números)';
  const maxLength  = isCar ? 6 : 5;

  const handleConfirm = async () => {
    if (!plate.trim()) {
      setState({ status: 'error', error: 'Ingresa la placa del vehículo' });
      return;
    }
    if (!plateRegex.test(plate.trim())) {
      setState({ status: 'error', error: `Formato inválido — ${plateHint}` });
      return;
    }
    setState({ status: 'loading' });
    try {
      const user = await authService.currentUser();
      if (!user) throw new Error('No autenticado');
      const { reservation } = await reservationService.createReservation({
        ownerId: user.id,
        parkingLotId: parkingId!,
        vehicleType,
        selectedSlots: slots.map(id => ({ id, startsAt: startsAt!, endsAt: endsAt! })),
        vehiclePlate: plate.trim().toUpperCase(),
      });
      router.replace(`/parking/confirmation?reservationId=${reservation.id}` as any);
    } catch (e: any) {
      setState({ status: 'error', error: e.message ?? 'Error al confirmar reserva' });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.header} />

      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Reserva</Text>
          <Text style={styles.heroTitle}>Confirmar reserva</Text>
        </View>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>${price.toLocaleString('es-CO')}</Text>
          <Text style={styles.priceBadgeSub}>COP</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Vehicle type */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tipo de vehículo</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, isCar && styles.typeBtnActive]}
              onPress={() => { setVehicleType(VehicleType.CAR); setPlate(''); }}
            >
              <View style={[styles.typeBtnIcon, isCar && styles.typeBtnIconActive]}>
                <Ionicons name="car-outline" size={22} color={isCar ? '#fff' : Colors.textSecondary} />
              </View>
              <Text style={[styles.typeBtnLabel, isCar && styles.typeBtnLabelActive]}>Carro</Text>
              <Text style={[styles.typeBtnSub, isCar && { color: 'rgba(255,255,255,0.7)' }]}>ABC123</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, !isCar && styles.typeBtnActive]}
              onPress={() => { setVehicleType(VehicleType.MOTORCYCLE); setPlate(''); }}
            >
              <View style={[styles.typeBtnIcon, !isCar && styles.typeBtnIconActive]}>
                <Ionicons name="bicycle-outline" size={22} color={!isCar ? '#fff' : Colors.textSecondary} />
              </View>
              <Text style={[styles.typeBtnLabel, !isCar && styles.typeBtnLabelActive]}>Moto</Text>
              <Text style={[styles.typeBtnSub, !isCar && { color: 'rgba(255,255,255,0.7)' }]}>ABC12</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen</Text>
          <SummaryRow icon="time-outline"   label="Inicio"   value={format(start, "EEE d MMM · HH:mm", { locale: es })} />
          <SummaryRow icon="flag-outline"   label="Fin"      value={format(end,   "EEE d MMM · HH:mm", { locale: es })} />
          <SummaryRow icon="layers-outline" label="Bloques"  value={`${slots.length} × 30 min`} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalValue}>${price.toLocaleString('es-CO')} COP</Text>
          </View>
        </View>

        {/* Plate */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Placa del vehículo</Text>
          <TextInput
            style={styles.plateInput}
            value={plate}
            onChangeText={t => setPlate(t.toUpperCase())}
            placeholder={isCar ? 'ABC123' : 'ABC12'}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            maxLength={maxLength}
          />
          <Text style={styles.plateHint}>{plateHint}</Text>
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
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>Pagar y reservar</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={16} color={Colors.accent} />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: Colors.background },
  hero:              { backgroundColor: Colors.header, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:           { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroContent:       { marginBottom: 16 },
  heroLabel:         { fontSize: 12, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroTitle:         { fontSize: 26, fontWeight: '800', color: '#fff' },
  priceBadge:        { flexDirection: 'row', alignItems: 'baseline', gap: 4, backgroundColor: 'rgba(255,107,53,0.2)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  priceBadgeText:    { fontSize: 22, fontWeight: '800', color: Colors.accent },
  priceBadgeSub:     { fontSize: 12, fontWeight: '600', color: Colors.accent },

  content:           { padding: 16, gap: 12 },
  card:              { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle:         { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },

  typeRow:           { flexDirection: 'row', gap: 10 },
  typeBtn:           { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, gap: 4 },
  typeBtnActive:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  typeBtnIcon:       { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  typeBtnIconActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  typeBtnLabel:      { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  typeBtnLabelActive:{ color: '#fff' },
  typeBtnSub:        { fontSize: 11, color: Colors.textMuted },

  summaryRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  summaryIcon:       { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  summaryText:       { flex: 1 },
  summaryLabel:      { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  summaryValue:      { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  totalRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel:        { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  totalValue:        { fontSize: 20, fontWeight: '800', color: Colors.accent },

  plateInput:        { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 6, textAlign: 'center', marginBottom: 8 },
  plateHint:         { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  confirmBtn:        { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  confirmBtnDisabled:{ opacity: 0.6 },
  confirmBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
