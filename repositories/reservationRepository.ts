import { supabase } from '@/lib/supabase';
import { Reservation, QRToken, Payment } from '@/domain/models';
import { ReservationStatus, QRPurpose, PaymentType, PaymentStatus, OwnerType, VehicleType } from '@/domain/enums';

export const reservationRepository = {
  async assignSpot(
    parkingLotId: string,
    vehicleType: VehicleType,
    typeCapacity: number,
    startsAt: string,
    endsAt: string,
  ): Promise<{ floor: number; spot: number }> {
    const SPOTS_PER_FLOOR = 10;
    const { data } = await supabase
      .from('reservations')
      .select('assigned_spot')
      .eq('parking_lot_id', parkingLotId)
      .eq('vehicle_type', vehicleType)
      .in('status', [ReservationStatus.RESERVED, ReservationStatus.CHECKED_IN])
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt);
    const usedSpots = new Set((data ?? []).map((r: any) => r.assigned_spot).filter(Boolean));
    let spotNumber = 1;
    while (usedSpots.has(spotNumber) && spotNumber <= typeCapacity) spotNumber++;
    return {
      floor: Math.ceil(spotNumber / SPOTS_PER_FLOOR),
      spot: ((spotNumber - 1) % SPOTS_PER_FLOOR) + 1,
    };
  },

  async create(params: {
    ownerId: string;
    parkingLotId: string;
    vehiclePlate: string;
    vehicleType: VehicleType;
    startsAt: string;
    endsAt: string;
    arrivalDeadlineAt: string;
    assignedFloor: number;
    assignedSpot: number;
  }): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        owner_id: params.ownerId,
        owner_type: OwnerType.USER,
        parking_lot_id: params.parkingLotId,
        vehicle_plate: params.vehiclePlate,
        vehicle_type: params.vehicleType,
        starts_at: params.startsAt,
        ends_at: params.endsAt,
        status: ReservationStatus.RESERVED,
        arrival_deadline_at: params.arrivalDeadlineAt,
        assigned_floor: params.assignedFloor,
        assigned_spot: params.assignedSpot,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapReservation(data);
  },

  async getByOwner(ownerId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapReservation);
  },

  async getById(id: string): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data ? mapReservation(data) : null;
  },

  async updateStatus(id: string, status: ReservationStatus, extra?: {
    checkedInAt?: string;
    checkedOutAt?: string;
    endsAt?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('reservations')
      .update({ status, ...extra && {
        checked_in_at: extra.checkedInAt,
        checked_out_at: extra.checkedOutAt,
        ends_at: extra.endsAt,
      }})
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async createQRToken(params: {
    reservationId: string;
    tokenHash: string;
    purpose: QRPurpose;
    expiresAt: string;
  }): Promise<QRToken> {
    const { data, error } = await supabase
      .from('qr_tokens')
      .insert({
        reservation_id: params.reservationId,
        token_hash: params.tokenHash,
        purpose: params.purpose,
        expires_at: params.expiresAt,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapQRToken(data);
  },

  async getQRTokenByHash(hash: string): Promise<QRToken | null> {
    const { data, error } = await supabase
      .from('qr_tokens')
      .select('*')
      .eq('token_hash', hash)
      .single();
    if (error) return null;
    return data ? mapQRToken(data) : null;
  },

  async getEntryQRForReservation(reservationId: string): Promise<QRToken | null> {
    const { data, error } = await supabase
      .from('qr_tokens')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('purpose', QRPurpose.ENTRY)
      .single();
    if (error) return null;
    return data ? mapQRToken(data) : null;
  },

  async markQRUsed(id: string, usedAt: string): Promise<void> {
    const { error } = await supabase
      .from('qr_tokens')
      .update({ used_at: usedAt })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async createPayment(params: {
    reservationId: string;
    type: PaymentType;
    amount: number;
    status: PaymentStatus;
  }): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        reservation_id: params.reservationId,
        type: params.type,
        amount: params.amount,
        status: params.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapPayment(data);
  },

  async getPaymentByReservation(reservationId: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('type', PaymentType.RESERVATION)
      .single();
    if (error) return null;
    return data ? mapPayment(data) : null;
  },

  async logCheckEvent(params: {
    reservationId: string;
    type: QRPurpose;
    result: string;
    reason?: string;
  }): Promise<void> {
    await supabase.from('check_events').insert({
      reservation_id: params.reservationId,
      type: params.type,
      result: params.result,
      reason: params.reason,
    });
  },
};

function mapReservation(row: any): Reservation {
  return {
    id:               row.id,
    ownerId:          row.owner_id,
    ownerType:        row.owner_type as OwnerType,
    parkingLotId:     row.parking_lot_id,
    vehiclePlate:     row.vehicle_plate,
    startsAt:         row.starts_at,
    endsAt:           row.ends_at,
    status:           row.status as ReservationStatus,
    arrivalDeadlineAt: row.arrival_deadline_at,
    checkedInAt:      row.checked_in_at,
    checkedOutAt:     row.checked_out_at,
    createdAt:        row.created_at,
    assignedFloor:    row.assigned_floor ?? undefined,
    assignedSpot:     row.assigned_spot ?? undefined,
    vehicleType:      row.vehicle_type as VehicleType ?? undefined,
  };
}

function mapQRToken(row: any): QRToken {
  return {
    id:            row.id,
    reservationId: row.reservation_id,
    tokenHash:     row.token_hash,
    purpose:       row.purpose as QRPurpose,
    expiresAt:     row.expires_at,
    usedAt:        row.used_at,
  };
}

function mapPayment(row: any): Payment {
  return {
    id:            row.id,
    reservationId: row.reservation_id,
    type:          row.type as PaymentType,
    amount:        Number(row.amount),
    status:        row.status as PaymentStatus,
    createdAt:     row.created_at,
  };
}
