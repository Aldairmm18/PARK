import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { ReservationStatus } from '@/domain/enums';

interface Props {
  status: ReservationStatus;
}

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string }> = {
  [ReservationStatus.RESERVED]:   { label: 'Reservado',     color: '#3B82F6' },
  [ReservationStatus.CHECKED_IN]: { label: 'En uso',        color: Colors.accent },
  [ReservationStatus.COMPLETED]:  { label: 'Completado',    color: Colors.success },
  [ReservationStatus.EXPIRED]:    { label: 'Expirado',      color: Colors.textMuted },
  [ReservationStatus.CANCELLED]:  { label: 'Cancelado',     color: Colors.textMuted },
  [ReservationStatus.OVERSTAY]:   { label: 'Tiempo extra',  color: Colors.error },
};

export function ReservationStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20', borderColor: config.color }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 12, fontWeight: '600' },
});
