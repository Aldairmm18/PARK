import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
      <View style={styles.root}>
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)' as any)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.root}>
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)' as any)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      </View>
    );
  }

  const { reservation, qrValue } = state.data!;
  const isActive = reservation.status === ReservationStatus.RESERVED;
  const isMoto   = reservation.vehicleType === 'MOTORCYCLE';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.header} />

      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/reservas' as any)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Reserva</Text>
          <Text style={styles.heroTitle}>Detalle de reserva</Text>
          <View style={styles.heroMeta}>
            <View style={[styles.heroIconBox, { backgroundColor: isMoto ? 'rgba(255,107,53,0.3)' : 'rgba(34,197,94,0.2)' }]}>
              <Ionicons name={isMoto ? 'bicycle' : 'car'} size={18} color={isMoto ? Colors.accent : Colors.success} />
            </View>
            <ReservationStatusBadge status={reservation.status} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Success banner */}
        {isActive && (
          <View style={styles.successBanner}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            </View>
            <View>
              <Text style={styles.successTitle}>¡Reserva confirmada!</Text>
              <Text style={styles.successSub}>Muestra tu QR al llegar al parqueadero</Text>
            </View>
          </View>
        )}

        {/* Details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de la reserva</Text>
          <DetailRow icon="time-outline"     label="Inicio"    value={format(new Date(reservation.startsAt), "EEE d MMM · HH:mm", { locale: es })} />
          <DetailRow icon="flag-outline"     label="Fin"       value={format(new Date(reservation.endsAt),   "HH:mm · EEE d MMM", { locale: es })} />
          {reservation.arrivalDeadlineAt && (
            <DetailRow
              icon="alert-circle-outline"
              label="Debes llegar antes de"
              value={format(new Date(reservation.arrivalDeadlineAt), "HH:mm")}
              valueColor={Colors.warning}
            />
          )}
          {reservation.vehicleType && (
            <DetailRow
              icon={isMoto ? 'bicycle-outline' : 'car-outline'}
              label="Tipo de vehículo"
              value={isMoto ? 'Motocicleta' : 'Carro'}
            />
          )}
          {reservation.vehiclePlate && (
            <DetailRow icon="document-text-outline" label="Placa" value={reservation.vehiclePlate} />
          )}
          {reservation.assignedFloor != null && reservation.assignedSpot != null && (
            <DetailRow
              icon="business-outline"
              label="Espacio asignado"
              value={`Piso ${reservation.assignedFloor} · Espacio ${reservation.assignedSpot}`}
              valueColor={Colors.accent}
              last
            />
          )}
        </View>

        {/* QR code */}
        {isActive && qrValue ? (
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <Ionicons name="qr-code-outline" size={20} color={Colors.accent} />
              <View>
                <Text style={styles.qrTitle}>Código QR de entrada</Text>
                <Text style={styles.qrSubtitle}>Muéstralo al llegar al parqueadero</Text>
              </View>
            </View>
            <View style={styles.qrWrapper}>
              <QRCodeDisplay value={qrValue} size={200} />
            </View>
          </View>
        ) : null}

        {/* Home button */}
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)' as any)}>
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.homeBtnText}>Ir al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, valueColor, last }: {
  icon: any; label: string; value: string; valueColor?: string; last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color={Colors.accent} />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.background },
  hero:            { backgroundColor: Colors.header, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:         { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroContent:     {},
  heroLabel:       { fontSize: 12, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroTitle:       { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 14 },
  heroMeta:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIconBox:     { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  content:         { padding: 16, gap: 12 },

  successBanner:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  successIconBox:  { width: 44, height: 44, borderRadius: 12, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  successTitle:    { fontSize: 15, fontWeight: '700', color: Colors.success },
  successSub:      { fontSize: 12, color: '#16A34A', marginTop: 2 },

  card:            { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle:       { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },

  detailRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  detailRowLast:   { paddingBottom: 0 },
  detailIcon:      { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  detailText:      { flex: 1 },
  detailLabel:     { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  detailValue:     { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  qrCard:          { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 16 },
  qrHeader:        { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' },
  qrTitle:         { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  qrSubtitle:      { fontSize: 12, color: Colors.textSecondary },
  qrWrapper:       { padding: 16, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },

  homeBtn:         { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  homeBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText:       { color: Colors.error, textAlign: 'center', fontSize: 15 },
});
