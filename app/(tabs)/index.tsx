import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ParkingCard } from '@/components/ParkingCard';
import { parkingService } from '@/services/parkingService';
import { authService } from '@/services/authService';
import { ParkingLot, ScreenState } from '@/domain/models';

type ParkingWithAvailability = ParkingLot & { availableSlots: number };

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [userName, setUserName] = useState('');
  const [state, setState] = useState<ScreenState<ParkingWithAvailability[]>>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [lots, user] = await Promise.all([
        parkingService.getAllWithAvailability(),
        authService.currentUser(),
      ]);
      setState({ status: 'success', data: lots as ParkingWithAvailability[] });
      setUserName(user?.fullName?.split(' ')[0] ?? '');
    } catch (e: any) {
      setState({ status: 'error', error: e.message ?? 'Error al cargar parqueaderos' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = state.status === 'success'
    ? state.data!.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.address ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const availableCount = state.status === 'success'
    ? state.data!.filter(p => p.availableSlots > 0).length
    : 0;

  const ListHeader = (
    <>
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>Hola{userName ? `, ${userName}` : ''} 👋</Text>
            <Text style={styles.heroTitle}>¿Dónde vas a{'\n'}estacionar hoy?</Text>
          </View>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/parking/scanner' as any)}
          >
            <Ionicons name="qr-code-outline" size={22} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o dirección..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats strip */}
      {state.status === 'success' && (
        <View style={styles.statsStrip}>
          <StatChip icon="business-outline" label="Parqueaderos" value={String(state.data!.length)} />
          <View style={styles.statsDivider} />
          <StatChip icon="checkmark-circle-outline" label="Disponibles" value={String(availableCount)} color={Colors.success} />
          <View style={styles.statsDivider} />
          <StatChip icon="car-outline" label="Tipo" value="Car & Moto" />
        </View>
      )}

      <Text style={styles.sectionLabel}>
        {query ? `Resultados para "${query}"` : 'Cerca de ti'}
      </Text>
    </>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.header} />

      {state.status === 'loading' && !refreshing ? (
        <>
          {ListHeader}
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        </>
      ) : state.status === 'error' ? (
        <>
          {ListHeader}
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.errorText}>{state.error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ParkingCard
              parking={item}
              availableSlots={item.availableSlots}
              onPress={() => router.push(`/parking/${item.id}` as any)}
            />
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No se encontraron parqueaderos</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function StatChip({ icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={16} color={color ?? Colors.textSecondary} />
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.background },

  // Hero
  hero:          { backgroundColor: Colors.header, paddingHorizontal: 24, paddingBottom: 28 },
  heroTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting:      { fontSize: 14, color: '#9CA3AF', marginBottom: 4 },
  heroTitle:     { fontSize: 26, fontWeight: '800', color: '#FFFFFF', lineHeight: 32 },
  scanBtn:       { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)' },

  // Search
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  searchIcon:    { marginRight: 2 },
  searchInput:   { flex: 1, fontSize: 15, color: '#FFFFFF', padding: 0 },

  // Stats
  statsStrip:    { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: -1, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statsDivider:  { width: 1, height: 32, backgroundColor: Colors.border },
  statChip:      { alignItems: 'center', gap: 2, flex: 1 },
  statValue:     { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  statLabel:     { fontSize: 11, color: Colors.textMuted },

  // Section
  sectionLabel:  { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginHorizontal: 16, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },

  // List
  list:          { paddingHorizontal: 16, paddingTop: 0 },

  // States
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText:     { color: Colors.error, textAlign: 'center', fontSize: 15 },
  emptyText:     { color: Colors.textMuted, textAlign: 'center', fontSize: 15 },
  retryBtn:      { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
});
