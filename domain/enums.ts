export enum VehicleType {
  CAR        = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
}

export enum OwnerType {
  USER   = 'USER',
  CLIENT = 'CLIENT',
}

export enum UserStatus {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ReservationStatus {
  RESERVED   = 'RESERVED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED  = 'COMPLETED',
  EXPIRED    = 'EXPIRED',
  OVERSTAY   = 'OVERSTAY',
  CANCELLED  = 'CANCELLED',
}

export enum QRPurpose {
  ENTRY = 'ENTRY',
  EXIT  = 'EXIT',
}

export enum PaymentType {
  RESERVATION = 'RESERVATION',
  REFUND      = 'REFUND',
  EXTENSION   = 'EXTENSION',
  PENALTY     = 'PENALTY',
}

export enum PaymentStatus {
  PENDING  = 'PENDING',
  SUCCESS  = 'SUCCESS',
  FAILED   = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum DeviceStatus {
  ONLINE  = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum EventResult {
  SUCCESS = 'SUCCESS',
  FAILED  = 'FAILED',
}
