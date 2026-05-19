package com.timetopark.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timetopark.AppContainer
import com.timetopark.domain.models.ParkingLot
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ParkingDetailUiState {
    object Loading : ParkingDetailUiState()
    data class Success(val lot: ParkingLot) : ParkingDetailUiState()
    data class Error(val message: String) : ParkingDetailUiState()
}

class ParkingDetailViewModel : ViewModel() {
    private val repo = AppContainer.repository

    private val _uiState = MutableStateFlow<ParkingDetailUiState>(ParkingDetailUiState.Loading)
    val uiState: StateFlow<ParkingDetailUiState> = _uiState.asStateFlow()

    fun load(parkingLotId: Long) {
        viewModelScope.launch {
            val lot = repo.getParkingLotById(parkingLotId)
            _uiState.value = if (lot != null)
                ParkingDetailUiState.Success(lot)
            else
                ParkingDetailUiState.Error("Parqueadero no encontrado")
        }
    }
}
