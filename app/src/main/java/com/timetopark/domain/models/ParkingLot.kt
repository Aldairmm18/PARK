package com.timetopark.domain.models

import java.math.BigDecimal

data class ParkingLot(
    val id: Long,
    val tenantId: Long,
    val name: String,
    val totalCapacity: Int,
    val pricePerBlock: BigDecimal,
    val address: String
)
