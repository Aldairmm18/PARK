package com.timetopark.domain.models

import com.timetopark.domain.enums.DeviceStatus
import java.time.LocalDateTime

data class EdgeDevice(
    val id: Long,
    val parkingLotId: Long,
    val apiKeyHash: String,
    val lastSyncAt: LocalDateTime,
    val status: DeviceStatus
)
