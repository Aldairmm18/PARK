package com.timetopark.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timetopark.AppContainer
import com.timetopark.domain.models.Reservation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ScanUiState {
    object Idle : ScanUiState()
    object Scanning : ScanUiState()
    data class CheckInSuccess(val reservation: Reservation) : ScanUiState()
    data class CheckOutSuccess(val reservation: Reservation) : ScanUiState()
    data class AccessDenied(val reason: String) : ScanUiState()
}

class QRScannerViewModel : ViewModel() {
    private val repo = AppContainer.repository

    private val _uiState = MutableStateFlow<ScanUiState>(ScanUiState.Idle)
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    fun processQRCode(hash: String) {
        if (hash.isBlank()) {
            _uiState.value = ScanUiState.AccessDenied("Código QR vacío")
            return
        }
        viewModelScope.launch {
            _uiState.value = ScanUiState.Scanning
            if (hash.startsWith("QR-ENTRY-")) {
                val result = repo.checkIn(hash)
                _uiState.value = result.fold(
                    onSuccess = { ScanUiState.CheckInSuccess(it) },
                    onFailure = { ScanUiState.AccessDenied(it.message ?: "Acceso denegado") }
                )
            } else if (hash.startsWith("QR-EXIT-")) {
                val result = repo.checkOut(hash)
                _uiState.value = result.fold(
                    onSuccess = { ScanUiState.CheckOutSuccess(it) },
                    onFailure = { ScanUiState.AccessDenied(it.message ?: "Acceso denegado") }
                )
            } else {
                _uiState.value = ScanUiState.AccessDenied("Formato de QR no reconocido")
            }
        }
    }

    fun reset() { _uiState.value = ScanUiState.Idle }
}
