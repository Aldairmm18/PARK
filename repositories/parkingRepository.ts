import { supabase } from '@/lib/supabase';
import { ParkingLot, TimeSlot } from '@/domain/models';

export const parkingRepository = {
  async getAll(): Promise<ParkingLot[]> {
    const { data, error } = await supabase
      .from('parking_lots')
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapLot);
  },

  async getById(id: string): Promise<ParkingLot | null> {
    const { data, error } = await supabase
      .from('parking_lots')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data ? mapLot(data) : null;
  },

  async getTimeSlots(parkingLotId: string, date: string): Promise<TimeSlot[]> {
    const dayStart = `${date}T00:00:00`;
    const dayEnd   = `${date}T23:59:59`;
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('parking_lot_id', parkingLotId)
      .gte('starts_at', dayStart)
      .lte('starts_at', dayEnd)
      .order('starts_at');
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapSlot);
  },

  async decrementCapacity(slotId: string): Promise<void> {
    const { error } = await supabase.rpc('decrement_slot_capacity', { slot_id: slotId });
    if (error) throw new Error(error.message);
  },

  async incrementCapacity(slotId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_slot_capacity', { slot_id: slotId });
    if (error) throw new Error(error.message);
  },

  async getAvailableSlots(parkingLotId: string): Promise<number> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('time_slots')
      .select('available_capacity')
      .eq('parking_lot_id', parkingLotId)
      .gte('starts_at', now)
      .limit(1)
      .single();
    if (error) return 0;
    return data?.available_capacity ?? 0;
  },
};

function mapLot(row: any): ParkingLot {
  return {
    id:            row.id,
    tenantId:      row.tenant_id,
    name:          row.name,
    totalCapacity: row.total_capacity,
    pricePerBlock: Number(row.price_per_block),
    address:       row.address ?? '',
    latitude:      row.latitude,
    longitude:     row.longitude,
  };
}

function mapSlot(row: any): TimeSlot {
  return {
    id:                row.id,
    parkingLotId:      row.parking_lot_id,
    startsAt:          row.starts_at,
    endsAt:            row.ends_at,
    availableCapacity: row.available_capacity,
  };
}
