package com.timetopark.domain.models

import com.timetopark.domain.enums.UserStatus
import java.time.LocalDateTime

data class User(
    override val id: Long,
    override val fullName: String,
    override val phone: String,
    val email: String,
    val passwordHash: String,
    val status: UserStatus,
    val createdAt: LocalDateTime
) : Person(id, fullName, phone)
