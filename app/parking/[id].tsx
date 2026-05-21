import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { parkingService } from '@/services/parkingService';
import { ParkingLot, ScreenState } from '@/domain/models';

type ParkingWithAvailability = ParkingLot & { availableSlots: number };

export default function ParkingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ScreenState<ParkingWithAvailability>>({ status: 'loading' });

  useEffect(() => {
    parkingService.getAllWithAvailability().then(lots => {
      const lot = lots.find(l => l.id === id);
      if (!lot) setState({ status: 'error', error: 'Parqueadero no encontrado' });
      else setState({ status: 'success', data: lot as ParkingWithAvailability });
    }).catch(e => setState({ status: 'error', error: e.message }));
  }, [id]);

  if (state.status === 'loading') {
    return (
      <View style={styles.root}>
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      </View>
    );
  }

  const parking = state.data!;
  const available = parking.availableSlots > 0;
  const occupancy = parking.totalCapacity > 0
    ? Math.round(((parking.totalCapacity - parking.availableSlots) / parking.totalCapacity) * 100)
    : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.header} />

      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Parqueadero</Text>
          <Text style={styles.heroTitle}>{parking.name}</Text>
          {parking.address ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color="#9CA3AF" />
              <Text style={styles.heroAddress}>{parking.address}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.heroBadge, { backgroundColor: available ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }]}>
          <View style={[styles.heroDot, { backgroundColor: available ? Colors.success : Colors.error }]} />
          <Text style={[styles.heroBadgeText, { color: available ? Colors.success : Colors.error }]}>
            {available ? `${parking.availableSlots} disponibles` : 'Sin cupos'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Occupancy */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Ocupación actual</Text>
            <Text style={[styles.cardValue, { color: occupancy > 85 ? Colors.error : occupancy > 60 ? Colors.warning : Colors.success }]}>
              {occupancy}%
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {
              width: `${occupancy}%` as any,
              backgroundColor: occupancy > 85 ? Colors.error : occupancy > 60 ? Colors.warning : Colors.success,
            }]} />
          </View>
        </View>

        {/* Capacity by type */}
        <View style={styles.statsRow}>
          <StatCard icon="car-outline"     label="Carros"       value={String(parking.carCapacity)}  sub={`de ${parking.totalCapacity} total`} />
          <StatCard icon="bicycle-outline" label="Motos"        value={String(parking.motoCapacity)} sub="espacios" />
          <StatCard icon="time-outline"    label="Por 30 min"   value={`$${(parking.pricePerBlock / 1000).toFixed(1)}k`} sub="COP" accent />
        </View>

        {/* Reserve button */}
        <TouchableOpacity
          style={[styles.reserveBtn, !available && styles.reserveBtnDisabled]}
          onPress={() => router.push(`/parking/availability?parkingId=${id}` as any)}
          disabled={!available}
        >
          <Ionicons name={available ? 'calendar-outline' : 'close-circle-outline'} size={20} color="#fff" />
          <Text style={styles.reserveBtnText}>
            {available ? 'Ver disponibilidad y reservar' : 'Sin disponibilidad'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Ionicons name={icon} size={20} color={accent ? Colors.accent : Colors.textSecondary} />
      <Text style={[styles.statValue, accent && { color: Colors.accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.background },
  hero:            { backgroundColor: Colors.header, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:         { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroContent:     { marginBottom: 14 },
  heroLabel:       { fontSize: 12, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroTitle:       { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  addressRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroAddress:     { fontSize: 13, color: '#9CA3AF' },
  heroBadge:       { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  heroDot:         { width: 7, height: 7, borderRadius: 4 },
  heroBadgeText:   { fontSize: 13, fontWeight: '700' },

  content:         { padding: 16, gap: 12 },
  card:            { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLabel:       { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  cardValue:       { fontSize: 18, fontWeight: '800' },
  barTrack:        { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill:         { height: 6, borderRadius: 3 },

  statsRow:        { flexDirection: 'row', gap: 10 },
  statCard:        { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: Colors.border },
  statCardAccent:  { backgroundColor: Colors.accentLight, borderColor: 'rgba(255,107,53,0.2)' },
  statValue:       { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statLabel:       { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  statSub:         { fontSize: 10, color: Colors.textMuted },

  reserveBtn:      { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  reserveBtnDisabled: { backgroundColor: Colors.textMuted },
  reserveBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },

  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText:       { color: Colors.error, textAlign: 'center' },
});
