import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Colors } from '@/constants/colors';
import { ReservationStatusBadge } from '@/components/ReservationStatusBadge';
import { reservationService } from '@/services/reservationService';
import { authService } from '@/services/authService';
import { Reservation, ScreenState } from '@/domain/models';
import { ReservationStatus } from '@/domain/enums';

export default function ReservasScreen() {
  const router = useRouter();
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
          text: 'Sí, cancelar',
          style: 'destructive',
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

  const renderItem = ({ item }: { item: Reservation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/parking/confirmation?reservationId=${item.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.parkingName} numberOfLines={1}>{item.parkingLotId}</Text>
        <ReservationStatusBadge status={item.status} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.dateText}>
          {format(new Date(item.startsAt), "EEE d MMM · HH:mm", { locale: es })}
          {' — '}
          {format(new Date(item.endsAt), "HH:mm")}
        </Text>
        {item.assignedFloor != null && item.assignedSpot != null && (
          <Text style={styles.spotText}>
            📍 Piso {item.assignedFloor} · Espacio {item.assignedSpot}
          </Text>
        )}
      </View>
      {canCancel(item) && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => handleCancel(item)}
          disabled={cancelling === item.id}
        >
          {cancelling === item.id
            ? <ActivityIndicator color={Colors.error} size="small" />
            : <Text style={styles.cancelText}>Cancelar reserva</Text>
          }
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis reservas</Text>
      </View>

      {state.status === 'loading' && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : state.status === 'error' ? (
        <View style={styles.center}>
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
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No tienes reservas aún</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  header:      { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:       { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  list:        { padding: 16, gap: 12 },
  card:        { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  parkingName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  cardBody:    { marginBottom: 4 },
  dateText:    { fontSize: 13, color: Colors.textSecondary },
  spotText:    { fontSize: 13, color: Colors.accent, fontWeight: '600', marginTop: 4 },
  cancelBtn:   { marginTop: 12, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: Colors.error },
  cancelText:  { color: Colors.error, fontWeight: '600', fontSize: 14 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText:   { color: Colors.error, textAlign: 'center', marginBottom: 16, fontSize: 15 },
  emptyText:   { color: Colors.textMuted, textAlign: 'center', fontSize: 15 },
  retryBtn:    { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
