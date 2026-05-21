import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ReservationStatusBadge } from '@/components/ReservationStatusBadge';
import { reservationService } from '@/services/reservationService';
import { authService } from '@/services/authService';
import { Reservation, ScreenState } from '@/domain/models';
import { ReservationStatus } from '@/domain/enums';

export default function ReservasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ScreenState<Reservation[]>>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const user = await authService.currentUser();
      if (!user) throw new Error('No autenticado');
      const reservations = await reservationService.getByOwner(user.id);
      setState({ status: 'success', data: reservations });
    } catch (e: any) {
      setState({ status: 'error', error: e.message ?? 'Error al cargar reservas' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCancel = (reservation: Reservation) => {
    Alert.alert(
      'Cancelar reserva',
      '¿Deseas cancelar esta reserva? Se emitirá un reembolso completo.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar', style: 'destructive',
          onPress: async () => {
            setCancelling(reservation.id);
            try {
              await reservationService.cancelReservation(reservation.id);
              await load();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'No se pudo cancelar');
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  const canCancel = (r: Reservation) =>
    r.status === ReservationStatus.RESERVED &&
    new Date(r.startsAt).getTime() - Date.now() > 30 * 60 * 1000;

  const activeCount = state.status === 'success'
    ? state.data!.filter(r => r.status === ReservationStatus.RESERVED || r.status === ReservationStatus.CHECKED_IN).length
    : 0;

  const renderItem = ({ item }: { item: Reservation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/parking/confirmation?reservationId=${item.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons
            name={item.vehicleType === 'MOTORCYCLE' ? 'bicycle' : 'car'}
            size={18} color={Colors.accent}
          />
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDate}>
            {format(new Date(item.startsAt), "EEE d MMM", { locale: es })}
          </Text>
          <Text style={styles.cardTime}>
            {format(new Date(item.startsAt), "HH:mm")} — {format(new Date(item.endsAt), "HH:mm")}
          </Text>
        </View>
        <ReservationStatusBadge status={item.status} />
      </View>

      {(item.assignedFloor != null && item.assignedSpot != null) && (
        <View style={styles.spotRow}>
          <Ionicons name="business-outline" size={13} color={Colors.accent} />
          <Text style={styles.spotText}>Piso {item.assignedFloor} · Espacio {item.assignedSpot}</Text>
          {item.vehiclePlate && (
            <>
              <View style={styles.spotDot} />
              <Text style={styles.spotText}>{item.vehiclePlate}</Text>
            </>
          )}
        </View>
      )}

      {canCancel(item) && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => handleCancel(item)}
          disabled={cancelling === item.id}
        >
          {cancelling === item.id
            ? <ActivityIndicator color={Colors.error} size="small" />
            : <>
                <Ionicons name="close-circle-outline" size={15} color={Colors.error} />
                <Text style={styles.cancelText}>Cancelar reserva</Text>
              </>
          }
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.header} />

      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.heroLabel}>Mis reservas</Text>
        <Text style={styles.heroTitle}>Historial de{'\n'}estacionamientos</Text>
        {state.status === 'success' && activeCount > 0 && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>{activeCount} reserva{activeCount > 1 ? 's' : ''} activa{activeCount > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {state.status === 'loading' && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : state.status === 'error' ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>{state.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={state.data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin reservas aún</Text>
              <Text style={styles.emptyText}>Tus reservas aparecerán aquí</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.background },
  hero:            { backgroundColor: Colors.header, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroLabel:       { fontSize: 12, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  heroTitle:       { fontSize: 26, fontWeight: '800', color: '#FFFFFF', lineHeight: 32 },
  activeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(34,197,94,0.15)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  activeDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  activeBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.success },

  list:        { padding: 16, gap: 12 },
  card:        { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon:    { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  cardMeta:    { flex: 1 },
  cardDate:    { fontSize: 13, color: Colors.textSecondary, textTransform: 'capitalize' },
  cardTime:    { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  spotRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  spotDot:     { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textMuted },
  spotText:    { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  cancelBtn:   { marginTop: 12, paddingVertical: 9, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: Colors.error, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  cancelText:  { color: Colors.error, fontWeight: '600', fontSize: 14 },

  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8, marginTop: 40 },
  errorText:   { color: Colors.error, textAlign: 'center', fontSize: 15 },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  emptyText:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  retryBtn:    { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  retryText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
