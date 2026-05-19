package com.timetopark.domain.models

import com.timetopark.domain.enums.EventResult
import com.timetopark.domain.enums.QRPurpose
import java.time.LocalDateTime

data class CheckEvent(
    val id: Long,
    val reservationId: Long,
    val edgeDeviceId: Long,
    val type: QRPurpose,
    val result: EventResult,
    val reason: String?,
    val eventAt: LocalDateTime
)
