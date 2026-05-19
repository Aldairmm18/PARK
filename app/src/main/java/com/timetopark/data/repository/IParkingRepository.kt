package com.timetopark.data.repository

import com.timetopark.domain.models.ParkingLot
import com.timetopark.domain.models.TimeSlot

interface IParkingRepository {
    suspend fun getAllParkingLots(): List<ParkingLot>
    suspend fun getParkingLotById(id: Long): ParkingLot?
    suspend fun getTimeSlotsForLot(parkingLotId: Long): List<TimeSlot>
    suspend fun decrementCapacity(timeSlotId: Long): Boolean
    suspend fun incrementCapacity(timeSlotId: Long)
}
