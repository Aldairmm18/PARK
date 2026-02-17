package com.timetopark.data.models

data class ParkingSpot(
    val name: String,
    val isAvailable: Boolean,
    val slots: Int,
    val ratePerHour: String
)
