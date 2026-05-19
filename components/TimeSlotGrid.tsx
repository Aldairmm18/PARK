import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { TimeSlot } from '@/domain/models';

interface Props {
  slots: TimeSlot[];
  selectedSlots: TimeSlot[];
  onSlotPress: (slot: TimeSlot) => void;
}

export function TimeSlotGrid({ slots, selectedSlots, onSlotPress }: Props) {
  const selectedIds = new Set(selectedSlots.map(s => s.id));

  const getSlotStyle = (slot: TimeSlot) => {
    if (slot.availableCapacity === 0) return styles.slotEmpty;
    if (selectedIds.has(slot.id)) return styles.slotSelected;
    return styles.slotAvailable;
  };

  const getTextStyle = (slot: TimeSlot) => {
    if (slot.availableCapacity === 0) return styles.textEmpty;
    if (selectedIds.has(slot.id)) return styles.textSelected;
    return styles.textAvailable;
  };

  return (
    <FlatList
      data={slots}
      keyExtractor={item => item.id}
      numColumns={3}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.slot, getSlotStyle(item)]}
          onPress={() => onSlotPress(item)}
          disabled={item.availableCapacity === 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.time, getTextStyle(item)]}>
            {format(parseISO(item.startsAt), 'HH:mm')}
          </Text>
          <Text style={[styles.capacity, getTextStyle(item)]}>
            {item.availableCapacity === 0 ? 'Lleno' : `${item.availableCapacity}`}
          </Text>
        </TouchableOpacity>
      )}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row:           { justifyContent: 'space-between', marginBottom: 8 },
  slot:          { flex: 1, marginHorizontal: 3, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1 },
  slotAvailable: { backgroundColor: Colors.surface, borderColor: Colors.border },
  slotSelected:  { backgroundColor: Colors.accent, borderColor: Colors.accent },
  slotEmpty:     { backgroundColor: '#F3F4F6', borderColor: Colors.border, opacity: 0.5 },
  time:          { fontSize: 13, fontWeight: '700' },
  capacity:      { fontSize: 10, marginTop: 2 },
  textAvailable: { color: Colors.textPrimary },
  textSelected:  { color: '#fff' },
  textEmpty:     { color: Colors.textMuted },
});
