package com.timetopark.ui.screens

import androidx.lifecycle.ViewModel
import com.timetopark.data.models.ParkingSpot
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class HomeViewModel : ViewModel() {
    private val _featuredParking = MutableStateFlow(
        ParkingSpot(
            name = "Parking Centro 24H",
            isAvailable = true,
            slots = 12,
            ratePerHour = "$5.000/h"
        )
    )
    val featuredParking: StateFlow<ParkingSpot> = _featuredParking.asStateFlow()
}
