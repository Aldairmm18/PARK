import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { parkingService } from '@/services/parkingService';
import { ParkingLot, ScreenState } from '@/domain/models';

export default function ParkingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<ScreenState<ParkingLot & { availableSlots: number }>>({ status: 'loading' });

  useEffect(() => {
    parkingService.getAllWithAvailability().then(lots => {
      const lot = lots.find(l => l.id === id);
      if (!lot) {
        setState({ status: 'error', error: 'Parqueadero no encontrado' });
      } else {
        setState({ status: 'success', data: lot as any });
      }
    }).catch(e => setState({ status: 'error', error: e.message }));
  }, [id]);

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
        <View style={styles.center}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const parking = state.data!;
  const available = parking.availableSlots > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{parking.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="car" size={40} color={Colors.accent} />
          </View>
          <Text style={styles.heroName}>{parking.name}</Text>
          {parking.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.address}>{parking.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="car-outline"
            label="Capacidad total"
            value={`${parking.totalCapacity} espacios`}
          />
          <StatCard
            icon={available ? 'checkmark-circle-outline' : 'close-circle-outline'}
            label="Disponibles"
            value={`${parking.availableSlots}`}
            valueColor={available ? Colors.success : Colors.error}
          />
        </View>

        <View style={styles.priceCard}>
          <Ionicons name="pricetag-outline" size={20} color={Colors.accent} />
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Precio por bloque (30 min)</Text>
            <Text style={styles.priceValue}>
              ${parking.pricePerBlock.toLocaleString('es-CO')} COP
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.reserveBtn, !available && styles.reserveBtnDisabled]}
          onPress={() => router.push(`/parking/availability?parkingId=${id}` as any)}
          disabled={!available}
        >
          <Text style={styles.reserveBtnText}>
            {available ? 'Reservar espacio' : 'Sin disponibilidad'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, valueColor }: {
  icon: any; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={Colors.accent} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.header },
  topBar:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  backBtn:           { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle:          { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff' },
  content:           { padding: 16, gap: 16 },
  heroCard:          { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  heroIcon:          { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  heroName:          { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  addressRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address:           { fontSize: 13, color: Colors.textMuted },
  statsRow:          { flexDirection: 'row', gap: 12 },
  statCard:          { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6 },
  statLabel:         { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  statValue:         { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  priceCard:         { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceInfo:         { flex: 1 },
  priceLabel:        { fontSize: 12, color: Colors.textSecondary },
  priceValue:        { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  reserveBtn:        { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  reserveBtnDisabled:{ backgroundColor: Colors.textMuted },
  reserveBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText:         { color: Colors.error, textAlign: 'center' },
});
