package com.timetopark.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timetopark.AppContainer
import com.timetopark.domain.models.Reservation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class MyReservationsUiState {
    object Loading : MyReservationsUiState()
    data class Success(val reservations: List<Reservation>, val actionMessage: String? = null) : MyReservationsUiState()
    data class Error(val message: String) : MyReservationsUiState()
}

class MyReservationsViewModel : ViewModel() {
    private val repo = AppContainer.repository

    private val _uiState = MutableStateFlow<MyReservationsUiState>(MyReservationsUiState.Loading)
    val uiState: StateFlow<MyReservationsUiState> = _uiState.asStateFlow()

    fun load() {
        val user = repo.currentUser() ?: run {
            _uiState.value = MyReservationsUiState.Error("Sesión expirada")
            return
        }
        viewModelScope.launch {
            _uiState.value = MyReservationsUiState.Loading
            try {
                val list = repo.getReservationsByOwner(user.id)
                _uiState.value = MyReservationsUiState.Success(list)
            } catch (e: Exception) {
                _uiState.value = MyReservationsUiState.Error(e.message ?: "Error cargando reservas")
            }
        }
    }

    fun cancel(reservationId: Long) {
        val user = repo.currentUser() ?: return
        viewModelScope.launch {
            val result = repo.cancelReservation(reservationId)
            result.onSuccess {
                val list = repo.getReservationsByOwner(user.id)
                _uiState.value = MyReservationsUiState.Success(list, "Reserva cancelada. Se procesó tu reembolso.")
            }
            result.onFailure {
                val current = (_uiState.value as? MyReservationsUiState.Success)?.reservations ?: emptyList()
                _uiState.value = MyReservationsUiState.Success(current, "No se pudo cancelar: ${it.message}")
            }
        }
    }
}
