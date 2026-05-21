import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { ReservationStatusBadge } from '@/components/ReservationStatusBadge';
import { reservationRepository } from '@/repositories/reservationRepository';
import { Reservation, ScreenState } from '@/domain/models';
import { ReservationStatus } from '@/domain/enums';

export default function ConfirmationScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const router = useRouter();
  const [state, setState] = useState<ScreenState<{ reservation: Reservation; qrValue: string }>>({ status: 'loading' });

  useEffect(() => {
    if (!reservationId) return;
    (async () => {
      try {
        const reservation = await reservationRepository.getById(reservationId);
        if (!reservation) throw new Error('Reserva no encontrada');
        let qrValue = '';
        if (reservation.status === ReservationStatus.RESERVED) {
          const entryQr = await reservationRepository.getEntryQRForReservation(reservationId);
          qrValue = entryQr?.tokenHash ?? '';
        }
        setState({ status: 'success', data: { reservation, qrValue } });
      } catch (e: any) {
        setState({ status: 'error', error: e.message ?? 'Error al cargar reserva' });
      }
    })();
  }, [reservationId]);

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)' as any)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Detalle de reserva</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { reservation, qrValue } = state.data!;
  const isActive = reservation.status === ReservationStatus.RESERVED;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/reservas' as any)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Detalle de reserva</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isActive && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <Text style={styles.successText}>¡Reserva confirmada!</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Estado</Text>
            <ReservationStatusBadge status={reservation.status} />
          </View>

          <InfoRow icon="time-outline" label="Inicio" value={format(new Date(reservation.startsAt), "EEE d MMM · HH:mm", { locale: es })} />
          <InfoRow icon="flag-outline" label="Fin" value={format(new Date(reservation.endsAt), "HH:mm · EEE d MMM", { locale: es })} />
          {reservation.arrivalDeadlineAt && (
            <InfoRow
              icon="alert-circle-outline"
              label="Debes llegar antes de"
              value={format(new Date(reservation.arrivalDeadlineAt), "HH:mm")}
              valueColor={Colors.warning}
            />
          )}
          {reservation.vehiclePlate && (
            <InfoRow icon="car-outline" label="Placa" value={reservation.vehiclePlate} />
          )}
          {reservation.vehicleType && (
            <InfoRow
              icon={reservation.vehicleType === 'MOTORCYCLE' ? 'bicycle-outline' : 'car-outline'}
              label="Tipo de vehículo"
              value={reservation.vehicleType === 'MOTORCYCLE' ? 'Motocicleta' : 'Carro'}
            />
          )}
          {reservation.assignedFloor != null && reservation.assignedSpot != null && (
            <InfoRow
              icon="business-outline"
              label="Tu espacio asignado"
              value={`Piso ${reservation.assignedFloor} · Espacio ${reservation.assignedSpot}`}
              valueColor={Colors.accent}
            />
          )}
        </View>

        {isActive && qrValue ? (
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Código QR de entrada</Text>
            <Text style={styles.qrSubtitle}>Muéstralo al llegar al parqueadero</Text>
            <View style={styles.qrWrapper}>
              <QRCodeDisplay value={qrValue} size={200} />
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)' as any)}
        >
          <Text style={styles.homeBtnText}>Ir al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, valueColor }: {
  icon: any; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={Colors.textMuted} style={styles.infoIcon} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:       { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle:      { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content:       { padding: 16, gap: 16 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  successText:   { fontSize: 15, fontWeight: '700', color: Colors.success },
  card:          { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle:     { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  infoIcon:      { marginTop: 2 },
  infoText:      { flex: 1 },
  infoLabel:     { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  infoValue:     { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  qrCard:        { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 6 },
  qrTitle:       { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  qrSubtitle:    { fontSize: 13, color: Colors.textSecondary },
  qrWrapper:     { marginTop: 12, padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  homeBtn:       { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  homeBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText:     { color: Colors.error, textAlign: 'center' },
});
