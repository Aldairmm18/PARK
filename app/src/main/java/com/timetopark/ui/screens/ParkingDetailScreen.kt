package com.timetopark.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.timetopark.ui.components.ErrorMessageCard
import com.timetopark.ui.components.PrimaryButtonCarretera
import com.timetopark.ui.viewmodels.ParkingDetailUiState
import com.timetopark.ui.viewmodels.ParkingDetailViewModel

@Composable
fun ParkingDetailScreen(
    parkingLotId: Long,
    onReserve: (Long) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ParkingDetailViewModel = viewModel()
) {
    LaunchedEffect(parkingLotId) { viewModel.load(parkingLotId) }
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        when (val s = uiState) {
            is ParkingDetailUiState.Loading -> CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            is ParkingDetailUiState.Error -> ErrorMessageCard(s.message)
            is ParkingDetailUiState.Success -> {
                val lot = s.lot
                Text(lot.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Text(lot.address, color = MaterialTheme.colorScheme.secondary)
                HorizontalDivider(color = MaterialTheme.colorScheme.surface)
                InfoRow("Capacidad total", "${lot.totalCapacity} cupos")
                InfoRow("Precio por bloque (30 min)", "$ ${lot.pricePerBlock}")
                Spacer(Modifier.weight(1f))
                PrimaryButtonCarretera(
                    text = "Ver disponibilidad",
                    onClick = { onReserve(lot.id) }
                )
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = MaterialTheme.colorScheme.secondary)
        Text(value, color = MaterialTheme.colorScheme.onBackground, fontWeight = FontWeight.SemiBold)
    }
}
