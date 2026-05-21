import { OwnerType, ReservationStatus, QRPurpose, PaymentType, PaymentStatus, UserStatus } from './enums';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: UserStatus;
  createdAt: string;
}

export interface ParkingLot {
  id: string;
  tenantId: string;
  name: string;
  totalCapacity: number;
  pricePerBlock: number;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface TimeSlot {
  id: string;
  parkingLotId: string;
  startsAt: string;
  endsAt: string;
  availableCapacity: number;
  pricePerBlock?: number;
}

export interface Reservation {
  id: string;
  ownerId: string;
  ownerType: OwnerType;
  parkingLotId: string;
  vehiclePlate: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  arrivalDeadlineAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt: string;
}

export interface QRToken {
  id: string;
  reservationId: string;
  tokenHash: string;
  purpose: QRPurpose;
  expiresAt: string;
  usedAt?: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface CheckEvent {
  id: string;
  reservationId: string;
  edgeDeviceId?: string;
  type: QRPurpose;
  result: string;
  reason?: string;
  eventAt: string;
}

export type ScreenState<T> = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: T;
  error?: string;
};
