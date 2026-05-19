package com.timetopark.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timetopark.AppContainer
import com.timetopark.domain.models.ParkingLot
import com.timetopark.domain.models.Reservation
import com.timetopark.domain.models.TimeSlot
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.math.BigDecimal

sealed class PaymentUiState {
    object Loading : PaymentUiState()
    data class ReadyToPay(
        val lot: ParkingLot,
        val startSlot: TimeSlot,
        val endSlot: TimeSlot,
        val totalCost: BigDecimal,
        val error: String? = null
    ) : PaymentUiState()
    data class Success(val reservation: Reservation) : PaymentUiState()
    data class Error(val message: String) : PaymentUiState()
}

class PaymentViewModel : ViewModel() {
    private val repo = AppContainer.repository

    private val _uiState = MutableStateFlow<PaymentUiState>(PaymentUiState.Loading)
    val uiState: StateFlow<PaymentUiState> = _uiState.asStateFlow()

    private var parkingLotId = 0L
    private var startSlotId = 0L
    private var endSlotId = 0L

    fun load(lotId: Long, startId: Long, endId: Long) {
        parkingLotId = lotId; startSlotId = startId; endSlotId = endId
        viewModelScope.launch {
            try {
                val lot = repo.getParkingLotById(lotId) ?: throw Exception("Parqueadero no encontrado")
                val slots = repo.getTimeSlotsForLot(lotId)
                val start = slots.find { it.id == startId } ?: throw Exception("Bloque de inicio no encontrado")
                val end = slots.find { it.id == endId } ?: throw Exception("Bloque de fin no encontrado")
                val blocks = slots.count {
                    !it.startsAt.isBefore(start.startsAt) && !it.endsAt.isAfter(end.endsAt)
                }.coerceAtLeast(1)
                _uiState.value = PaymentUiState.ReadyToPay(lot, start, end, lot.pricePerBlock * BigDecimal(blocks))
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Error")
            }
        }
    }

    fun confirmPayment(vehiclePlate: String) {
        if (vehiclePlate.isBlank()) {
            val current = _uiState.value
            _uiState.value = (current as? PaymentUiState.ReadyToPay)
                ?.copy(error = "Ingresa la placa del vehículo")
                ?: PaymentUiState.Error("Ingresa la placa del vehículo")
            return
        }
        val user = repo.currentUser() ?: run {
            _uiState.value = PaymentUiState.Error("Sesión expirada, vuelve a iniciar sesión")
            return
        }
        viewModelScope.launch {
            _uiState.value = PaymentUiState.Loading
            val result = repo.createReservation(user.id, parkingLotId, vehiclePlate.uppercase().trim(), startSlotId, endSlotId)
            _uiState.value = result.fold(
                onSuccess = { PaymentUiState.Success(it) },
                onFailure = { err ->
                    // Recargar el estado ReadyToPay con el error en lugar de reemplazarlo
                    val lot = repo.getParkingLotById(parkingLotId)
                    val slots = repo.getTimeSlotsForLot(parkingLotId)
                    val start = slots.find { it.id == startSlotId }
                    val end = slots.find { it.id == endSlotId }
                    if (lot != null && start != null && end != null) {
                        val blocks = slots.count { !it.startsAt.isBefore(start.startsAt) && !it.endsAt.isAfter(end.endsAt) }.coerceAtLeast(1)
                        PaymentUiState.ReadyToPay(lot, start, end, lot.pricePerBlock * BigDecimal(blocks), error = err.message)
                    } else {
                        PaymentUiState.Error(err.message ?: "Error al crear reserva")
                    }
                }
            )
        }
    }
}
