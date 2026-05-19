package com.timetopark.domain.models

import java.time.LocalDateTime

data class TimeSlot(
    val id: Long,
    val parkingLotId: Long,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val availableCapacity: Int
)
