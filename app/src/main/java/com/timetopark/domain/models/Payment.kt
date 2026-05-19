package com.timetopark.domain.models

import com.timetopark.domain.enums.PaymentStatus
import com.timetopark.domain.enums.PaymentType
import java.math.BigDecimal
import java.time.LocalDateTime

data class Payment(
    val id: Long,
    val reservationId: Long,
    val type: PaymentType,
    val amount: BigDecimal,
    val status: PaymentStatus,
    val createdAt: LocalDateTime
)
