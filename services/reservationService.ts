import { addMinutes, differenceInMinutes, parseISO } from 'date-fns';
import { reservationRepository } from '@/repositories/reservationRepository';
import { parkingRepository } from '@/repositories/parkingRepository';
import { Reservation, QRToken } from '@/domain/models';
import { ReservationStatus, QRPurpose, PaymentType, PaymentStatus, VehicleType } from '@/domain/enums';

export const reservationService = {
  async createReservation(params: {
    ownerId: string;
    parkingLotId: string;
    vehiclePlate: string;
    vehicleType: VehicleType;
    selectedSlots: { id: string; startsAt: string; endsAt: string }[];
  }): Promise<{ reservation: Reservation; qrToken: QRToken }> {
    if (params.selectedSlots.length === 0) throw new Error('Selecciona al menos un bloque horario');

    // Verificar capacidad en todos los slots seleccionados
    for (const slot of params.selectedSlots) {
      const full = await parkingRepository.getTimeSlots(params.parkingLotId, slot.startsAt.split('T')[0]);
      const target = full.find(s => s.id === slot.id);
      if (!target || target.availableCapacity <= 0) {
        throw new Error('Sin cupos disponibles en alguno de los bloques seleccionados');
      }
    }

    const sorted      = [...params.selectedSlots].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const startsAt    = sorted[0].startsAt;
    const endsAt      = sorted[sorted.length - 1].endsAt;
    const arrivalDeadlineAt = addMinutes(parseISO(startsAt), 25).toISOString();

    // Decrementar capacidad
    for (const slot of sorted) {
      await parkingRepository.decrementCapacity(slot.id);
    }

    const lot = await parkingRepository.getById(params.parkingLotId);
    const typeCapacity = params.vehicleType === VehicleType.MOTORCYCLE
      ? (lot?.motoCapacity ?? 30)
      : (lot?.carCapacity ?? 70);

    const { floor, spot } = await reservationRepository.assignSpot(
      params.parkingLotId,
      params.vehicleType,
      typeCapacity,
      startsAt,
      endsAt,
    );

    const reservation = await reservationRepository.create({
      ownerId: params.ownerId,
      parkingLotId: params.parkingLotId,
      vehiclePlate: params.vehiclePlate.toUpperCase().trim(),
      vehicleType: params.vehicleType,
      startsAt,
      endsAt,
      arrivalDeadlineAt,
      assignedFloor: floor,
      assignedSpot: spot,
    });

    const tokenHash = `QR-ENTRY-${reservation.id}-${Date.now()}`;
    const qrToken = await reservationRepository.createQRToken({
      reservationId: reservation.id,
      tokenHash,
      purpose: QRPurpose.ENTRY,
      expiresAt: arrivalDeadlineAt,
    });

    const amount = (lot?.pricePerBlock ?? 0) * sorted.length;
    await reservationRepository.createPayment({
      reservationId: reservation.id,
      type: PaymentType.RESERVATION,
      amount,
      status: PaymentStatus.SUCCESS,
    });

    return { reservation, qrToken };
  },

  async cancelReservation(reservationId: string): Promise<void> {
    const reservation = await reservationRepository.getById(reservationId);
    if (!reservation) throw new Error('Reserva no encontrada');
    if (reservation.status !== ReservationStatus.RESERVED) throw new Error('Solo se pueden cancelar reservas en estado RESERVED');

    const minutesUntilStart = differenceInMinutes(parseISO(reservation.startsAt), new Date());
    if (minutesUntilStart < 30) throw new Error('Solo se puede cancelar con 30 minutos de anticipación');

    await reservationRepository.updateStatus(reservationId, ReservationStatus.CANCELLED);

    const payment = await reservationRepository.getPaymentByReservation(reservationId);
    await reservationRepository.createPayment({
      reservationId,
      type: PaymentType.REFUND,
      amount: payment?.amount ?? 0,
      status: PaymentStatus.SUCCESS,
    });
  },

  async extendReservation(reservationId: string, extraSlots: { id: string; endsAt: string }[]): Promise<void> {
    const reservation = await reservationRepository.getById(reservationId);
    if (!reservation) throw new Error('Reserva no encontrada');
    if (reservation.status !== ReservationStatus.CHECKED_IN) throw new Error('Solo se puede extender una reserva activa');

    for (const slot of extraSlots) {
      await parkingRepository.decrementCapacity(slot.id);
    }

    const newEndsAt = extraSlots[extraSlots.length - 1].endsAt;
    await reservationRepository.updateStatus(reservationId, ReservationStatus.CHECKED_IN, { endsAt: newEndsAt });

    const lot = await parkingRepository.getById(reservation.parkingLotId);
    await reservationRepository.createPayment({
      reservationId,
      type: PaymentType.EXTENSION,
      amount: (lot?.pricePerBlock ?? 0) * extraSlots.length,
      status: PaymentStatus.SUCCESS,
    });
  },

  async getByOwner(ownerId: string): Promise<Reservation[]> {
    await this.runExpirationJob(ownerId);
    return reservationRepository.getByOwner(ownerId);
  },

  async runExpirationJob(ownerId: string): Promise<void> {
    const reservations = await reservationRepository.getByOwner(ownerId);
    const now = new Date();
    for (const res of reservations) {
      if (res.status === ReservationStatus.RESERVED && parseISO(res.arrivalDeadlineAt) < now) {
        await reservationRepository.updateStatus(res.id, ReservationStatus.EXPIRED);
      }
    }
  },
};

export const checkEventService = {
  async validateEntry(qrHash: string): Promise<{ success: boolean; reason?: string; reservation?: Reservation }> {
    const qr = await reservationRepository.getQRTokenByHash(qrHash);
    if (!qr) return { success: false, reason: 'QR no válido' };
    if (qr.usedAt) return { success: false, reason: 'QR ya utilizado' };
    if (qr.purpose !== QRPurpose.ENTRY) return { success: false, reason: 'QR no es de entrada' };
    if (new Date() > parseISO(qr.expiresAt)) return { success: false, reason: 'QR expirado' };

    const reservation = await reservationRepository.getById(qr.reservationId);
    if (!reservation) return { success: false, reason: 'Reserva no encontrada' };
    if (reservation.status !== ReservationStatus.RESERVED) {
      return { success: false, reason: 'La reserva no está en estado RESERVED' };
    }

    const now = new Date().toISOString();
    await reservationRepository.markQRUsed(qr.id, now);
    await reservationRepository.updateStatus(reservation.id, ReservationStatus.CHECKED_IN, { checkedInAt: now });

    // Generar QR de salida
    await reservationRepository.createQRToken({
      reservationId: reservation.id,
      tokenHash: `QR-EXIT-${reservation.id}-${Date.now()}`,
      purpose: QRPurpose.EXIT,
      expiresAt: addMinutes(parseISO(reservation.endsAt), 70).toISOString(),
    });

    // Registrar evento FUERA de transacción
    reservationRepository.logCheckEvent({
      reservationId: reservation.id,
      type: QRPurpose.ENTRY,
      result: 'SUCCESS',
    }).catch(() => {});

    return { success: true, reservation };
  },

  async validateExit(qrHash: string): Promise<{ success: boolean; reason?: string; reservation?: Reservation }> {
    const qr = await reservationRepository.getQRTokenByHash(qrHash);
    if (!qr) return { success: false, reason: 'QR no válido' };
    if (qr.usedAt) return { success: false, reason: 'QR ya utilizado' };
    if (qr.purpose !== QRPurpose.EXIT) return { success: false, reason: 'QR no es de salida' };

    const reservation = await reservationRepository.getById(qr.reservationId);
    if (!reservation) return { success: false, reason: 'Reserva no encontrada' };
    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      return { success: false, reason: 'La reserva no está en estado CHECKED_IN' };
    }

    const now = new Date();
    const checkedIn = parseISO(reservation.checkedInAt ?? reservation.startsAt);
    const endsAt = parseISO(reservation.endsAt);
    const actualMinutes  = differenceInMinutes(now, checkedIn);
    const allowedMinutes = differenceInMinutes(endsAt, parseISO(reservation.startsAt)) + 10;
    const isOverstay = actualMinutes > allowedMinutes;

    const nowIso = now.toISOString();
    await reservationRepository.markQRUsed(qr.id, nowIso);
    await reservationRepository.updateStatus(
      reservation.id,
      isOverstay ? ReservationStatus.OVERSTAY : ReservationStatus.COMPLETED,
      { checkedOutAt: nowIso }
    );

    if (isOverstay) {
      const extraBlocks = Math.ceil((actualMinutes - allowedMinutes) / 30);
      const lot = await parkingRepository.getById(reservation.parkingLotId);
      await reservationRepository.createPayment({
        reservationId: reservation.id,
        type: PaymentType.PENALTY,
        amount: (lot?.pricePerBlock ?? 5000) * extraBlocks,
        status: PaymentStatus.SUCCESS,
      });
    }

    reservationRepository.logCheckEvent({
      reservationId: reservation.id,
      type: QRPurpose.EXIT,
      result: 'SUCCESS',
    }).catch(() => {});

    const updated = await reservationRepository.getById(reservation.id);
    return { success: true, reservation: updated ?? reservation };
  },
};
