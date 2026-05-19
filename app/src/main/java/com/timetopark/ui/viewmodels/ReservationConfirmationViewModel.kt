package com.timetopark.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timetopark.AppContainer
import com.timetopark.domain.models.ParkingLot
import com.timetopark.domain.models.QRToken
import com.timetopark.domain.models.Reservation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ConfirmationUiState {
    object Loading : ConfirmationUiState()
    data class Success(val reservation: Reservation, val lot: ParkingLot, val qrToken: QRToken) : ConfirmationUiState()
    data class Error(val message: String) : ConfirmationUiState()
}

class ReservationConfirmationViewModel : ViewModel() {
    private val repo = AppContainer.repository

    private val _uiState = MutableStateFlow<ConfirmationUiState>(ConfirmationUiState.Loading)
    val uiState: StateFlow<ConfirmationUiState> = _uiState.asStateFlow()

    fun load(reservationId: Long) {
        viewModelScope.launch {
            try {
                val res = repo.getReservationById(reservationId)
                    ?: throw Exception("Reserva no encontrada")
                val lot = repo.getParkingLotById(res.parkingLotId)
                    ?: throw Exception("Parqueadero no encontrado")
                val qr = repo.getEntryQRForReservation(reservationId)
                    ?: throw Exception("QR de entrada no disponible")
                _uiState.value = ConfirmationUiState.Success(res, lot, qr)
            } catch (e: Exception) {
                _uiState.value = ConfirmationUiState.Error(e.message ?: "Error")
            }
        }
    }
}
