package com.timetopark.domain.models

import com.timetopark.domain.enums.QRPurpose
import java.time.LocalDateTime

data class QRToken(
    val id: Long,
    val reservationId: Long,
    val tokenHash: String,
    val purpose: QRPurpose,
    val expiresAt: LocalDateTime,
    val usedAt: LocalDateTime?
)
