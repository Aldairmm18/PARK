import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ParkingLot } from '@/domain/models';

interface Props {
  parking: ParkingLot;
  availableSlots: number;
  onPress: () => void;
}

export function ParkingCard({ parking, availableSlots, onPress }: Props) {
  const hasSlots = availableSlots > 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{parking.name}</Text>
          <Text style={styles.address} numberOfLines={1}>{parking.address}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: hasSlots ? Colors.success : Colors.error }]}>
          <Text style={styles.badgeText}>{hasSlots ? `${availableSlots} cupos` : 'Sin cupos'}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="car-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.footerText}>{parking.carCapacity} carros</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="bicycle-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.footerText}>{parking.motoCapacity} motos</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.footerText}>$ {parking.pricePerBlock.toLocaleString()} / 30 min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info:      { flex: 1, marginRight: 12 },
  name:      { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  address:   { fontSize: 13, color: Colors.textSecondary },
  badge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  footer:    { flexDirection: 'row', marginTop: 12, gap: 16 },
  footerItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText:{ fontSize: 12, color: Colors.textSecondary },
});
