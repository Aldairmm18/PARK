import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ParkingCard } from '@/components/ParkingCard';
import { parkingService } from '@/services/parkingService';
import { ParkingLot } from '@/domain/models';
import { ScreenState } from '@/domain/models';

type ParkingWithAvailability = ParkingLot & { availableSlots: number };

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<ScreenState<ParkingWithAvailability[]>>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const lots = await parkingService.getAllWithAvailability();
      setState({ status: 'success', data: lots as ParkingWithAvailability[] });
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>ParkNow</Text>
        <TouchableOpacity onPress={() => router.push('/parking/scanner' as any)}>
          <Ionicons name="qr-code-outline" size={26} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar parqueadero..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
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
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ParkingCard
              parking={item}
              availableSlots={item.availableSlots}
              onPress={() => router.push(`/parking/${item.id}` as any)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No se encontraron parqueaderos</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.header },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logo:        { fontSize: 26, fontWeight: '800', color: Colors.accent, letterSpacing: -1 },
  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#FFF' },
  list:        { padding: 16, gap: 12 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText:   { color: Colors.error, textAlign: 'center', marginBottom: 16, fontSize: 15 },
  emptyText:   { color: Colors.textMuted, textAlign: 'center', fontSize: 15 },
  retryBtn:    { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
