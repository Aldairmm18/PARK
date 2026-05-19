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
import com.timetopark.ui.components.TimeSlotGrid
import com.timetopark.ui.viewmodels.AvailabilityUiState
import com.timetopark.ui.viewmodels.AvailabilityViewModel
import java.time.format.DateTimeFormatter

@Composable
fun AvailabilityScreen(
    parkingLotId: Long,
    onProceedToPayment: (lotId: Long, startId: Long, endId: Long) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: AvailabilityViewModel = viewModel()
) {
    LaunchedEffect(parkingLotId) { viewModel.load(parkingLotId) }
    val uiState by viewModel.uiState.collectAsState()
    val fmt = DateTimeFormatter.ofPattern("HH:mm")

    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Seleccionar horario", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
        Text("Toca el bloque de inicio y luego el de fin", color = MaterialTheme.colorScheme.secondary, style = MaterialTheme.typography.bodySmall)

        when (val s = uiState) {
            is AvailabilityUiState.Loading -> CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            is AvailabilityUiState.Error -> ErrorMessageCard(s.message)
            is AvailabilityUiState.Success -> {
                if (s.selectedStart != null || s.selectedEnd != null) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(
                            text = if (s.selectedStart != null) "Inicio: ${s.selectedStart.startsAt.format(fmt)}" else "Selecciona inicio",
                            color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = if (s.selectedEnd != null) "Fin: ${s.selectedEnd.endsAt.format(fmt)}" else "Selecciona fin",
                            color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold
                        )
                    }
                    if (s.selectedEnd != null) {
                        Text("Total: $ ${s.totalCost}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground, style = MaterialTheme.typography.titleMedium)
                    }
                }

                TimeSlotGrid(
                    slots = s.slots,
                    selectedStart = s.selectedStart,
                    selectedEnd = s.selectedEnd,
                    onSlotSelected = { viewModel.onSlotSelected(it) },
                    modifier = Modifier.weight(1f)
                )

                if (s.selectedStart != null && s.selectedEnd != null) {
                    PrimaryButtonCarretera("Continuar al pago") {
                        val ids = viewModel.getSelectionIds()
                        if (ids != null) onProceedToPayment(parkingLotId, ids.first, ids.second)
                    }
                }
            }
        }
    }
}
