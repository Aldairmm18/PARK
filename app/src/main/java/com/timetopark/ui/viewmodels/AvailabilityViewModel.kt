package com.timetopark.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timetopark.AppContainer
import com.timetopark.domain.models.ParkingLot
import com.timetopark.domain.models.TimeSlot
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.math.BigDecimal

sealed class AvailabilityUiState {
    object Loading : AvailabilityUiState()
    data class Success(
        val lot: ParkingLot,
        val slots: List<TimeSlot>,
        val selectedStart: TimeSlot?,
        val selectedEnd: TimeSlot?,
        val totalCost: BigDecimal
    ) : AvailabilityUiState()
    data class Error(val message: String) : AvailabilityUiState()
}

class AvailabilityViewModel : ViewModel() {
    private val repo = AppContainer.repository

    private val _uiState = MutableStateFlow<AvailabilityUiState>(AvailabilityUiState.Loading)
    val uiState: StateFlow<AvailabilityUiState> = _uiState.asStateFlow()

    private var selectedStart: TimeSlot? = null
    private var selectedEnd: TimeSlot? = null
    private var currentLot: ParkingLot? = null
    private var allSlots: List<TimeSlot> = emptyList()

    fun load(parkingLotId: Long) {
        viewModelScope.launch {
            _uiState.value = AvailabilityUiState.Loading
            try {
                val lot = repo.getParkingLotById(parkingLotId)
                    ?: throw Exception("Parqueadero no encontrado")
                val slots = repo.getTimeSlotsForLot(parkingLotId)
                currentLot = lot
                allSlots = slots
                updateState()
            } catch (e: Exception) {
                _uiState.value = AvailabilityUiState.Error(e.message ?: "Error cargando disponibilidad")
            }
        }
    }

    fun onSlotSelected(slot: TimeSlot) {
        when {
            selectedStart == null -> selectedStart = slot
            selectedEnd == null && slot.startsAt.isAfter(selectedStart!!.startsAt) -> selectedEnd = slot
            else -> { selectedStart = slot; selectedEnd = null }
        }
        updateState()
    }

    fun getSelectionIds(): Pair<Long, Long>? {
        val start = selectedStart ?: return null
        val end = selectedEnd ?: return null
        return Pair(start.id, end.id)
    }

    private fun updateState() {
        val lot = currentLot ?: return
        val blocks = if (selectedStart != null && selectedEnd != null) {
            allSlots.count {
                !it.startsAt.isBefore(selectedStart!!.startsAt) &&
                !it.endsAt.isAfter(selectedEnd!!.endsAt)
            }.coerceAtLeast(1)
        } else 1
        val cost = lot.pricePerBlock * BigDecimal(blocks)
        _uiState.value = AvailabilityUiState.Success(
            lot = lot,
            slots = allSlots.take(48),
            selectedStart = selectedStart,
            selectedEnd = selectedEnd,
            totalCost = cost
        )
    }
}
