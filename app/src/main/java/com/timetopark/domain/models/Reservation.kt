package com.timetopark.domain.models

import com.timetopark.domain.enums.OwnerType
import com.timetopark.domain.enums.ReservationStatus
import java.time.LocalDateTime

data class Reservation(
    val id: Long,
    val ownerId: Long,
    val ownerType: OwnerType,
    val parkingLotId: Long,
    val vehiclePlate: String,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val status: ReservationStatus,
    val arrivalDeadlineAt: LocalDateTime,
    val checkedInAt: LocalDateTime?,
    val checkedOutAt: LocalDateTime?,
    val createdAt: LocalDateTime
)
