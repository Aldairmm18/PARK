package com.timetopark.data.repository

import com.timetopark.domain.models.User

interface IAuthRepository {
    suspend fun login(email: String, password: String): Result<User>
    suspend fun register(fullName: String, phone: String, email: String, password: String): Result<User>
    fun logout()
    fun currentUser(): User?
}
