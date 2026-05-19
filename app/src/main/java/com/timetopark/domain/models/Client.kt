package com.timetopark.domain.models

import java.time.LocalDateTime

data class Client(
    override val id: Long,
    override val fullName: String,
    override val phone: String,
    val vehiclePlate: String,
    val registeredAt: LocalDateTime,
    val registeredBy: Long
) : Person(id, fullName, phone)
