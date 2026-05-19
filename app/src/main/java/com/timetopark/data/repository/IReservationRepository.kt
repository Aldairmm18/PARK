package com.timetopark.data.repository

import com.timetopark.domain.models.Payment
import com.timetopark.domain.models.QRToken
import com.timetopark.domain.models.Reservation

interface IReservationRepository {
    suspend fun createReservation(
        ownerId: Long,
        parkingLotId: Long,
        vehiclePlate: String,
        startSlotId: Long,
        endSlotId: Long
    ): Result<Reservation>

    suspend fun getReservationsByOwner(ownerId: Long): List<Reservation>
    suspend fun getReservationById(id: Long): Reservation?
    suspend fun cancelReservation(id: Long): Result<Unit>
    suspend fun checkIn(qrTokenHash: String): Result<Reservation>
    suspend fun checkOut(qrTokenHash: String): Result<Reservation>
    suspend fun getEntryQRForReservation(reservationId: Long): QRToken?
    suspend fun getPaymentForReservation(reservationId: Long): Payment?
    suspend fun expireOverdueReservations()
}
