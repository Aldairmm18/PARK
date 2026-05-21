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
  const occupancy = parking.totalCapacity > 0
    ? Math.round(((parking.totalCapacity - availableSlots) / parking.totalCapacity) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="business" size={20} color={Colors.accent} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{parking.name}</Text>
          {parking.address ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.address} numberOfLines={1}>{parking.address}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: hasSlots ? '#DCFCE7' : '#FEE2E2' }]}>
          <View style={[styles.badgeDot, { backgroundColor: hasSlots ? Colors.success : Colors.error }]} />
          <Text style={[styles.badgeText, { color: hasSlots ? Colors.success : Colors.error }]}>
            {hasSlots ? `${availableSlots} libres` : 'Lleno'}
          </Text>
        </View>
      </View>

      {/* Occupancy bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, {
          width: `${occupancy}%` as any,
          backgroundColor: occupancy > 85 ? Colors.error : occupancy > 60 ? Colors.warning : Colors.success,
        }]} />
      </View>
      <Text style={styles.barLabel}>{occupancy}% ocupado</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <FooterChip icon="car-outline"     label={`${parking.carCapacity} carros`} />
        <FooterChip icon="bicycle-outline" label={`${parking.motoCapacity} motos`} />
        <FooterChip icon="time-outline"    label={`$${parking.pricePerBlock.toLocaleString('es-CO')} / 30 min`} accent />
      </View>
    </TouchableOpacity>
  );
}

function FooterChip({ icon, label, accent }: { icon: any; label: string; accent?: boolean }) {
  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <Ionicons name={icon} size={13} color={accent ? Colors.accent : Colors.textSecondary} />
      <Text style={[styles.chipText, accent && styles.chipTextAccent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:        { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },

  header:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  iconBox:     { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  titleBlock:  { flex: 1 },
  name:        { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  addressRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  address:     { fontSize: 12, color: Colors.textMuted, flex: 1 },
  badge:       { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
  badgeDot:    { width: 6, height: 6, borderRadius: 3 },
  badgeText:   { fontSize: 12, fontWeight: '700' },

  barTrack:    { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 5, overflow: 'hidden' },
  barFill:     { height: 4, borderRadius: 2 },
  barLabel:    { fontSize: 11, color: Colors.textMuted, marginBottom: 12 },

  footer:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  chipAccent:  { backgroundColor: Colors.accentLight, borderColor: 'rgba(255,107,53,0.2)' },
  chipText:    { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  chipTextAccent: { color: Colors.accent, fontWeight: '600' },
});
