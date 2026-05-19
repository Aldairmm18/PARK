package com.timetopark.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.timetopark.AppContainer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class HomeViewModel : ViewModel() {
    private val repo = AppContainer.repository

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init { loadLots() }

    fun loadLots() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            try {
                _uiState.value = HomeUiState.Success(repo.getAllParkingLots())
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(e.message ?: "Error cargando parqueaderos")
            }
        }
    }
}
