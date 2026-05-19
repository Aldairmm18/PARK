package com.timetopark.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.timetopark.ui.components.PrimaryButtonCarretera
import com.timetopark.ui.components.TopBarCarretera
import com.timetopark.ui.components.TimeSlotGrid
import com.timetopark.ui.viewmodels.AvailabilityViewModel
import com.timetopark.ui.viewmodels.AvailabilityUiState
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun AvailabilityScreen(
    parkingLotId: Long,
    onBack: () -> Unit,
    onProceedToPayment: (Long, Long, Long) -> Unit,
    viewModel: AvailabilityViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(parkingLotId) {
        viewModel.load(parkingLotId)
    }

    Scaffold(
        topBar = { 
            TopBarCarretera(
                title = "Disponibilidad", 
                navigationIcon = Icons.AutoMirrored.Filled.ArrowBack,
                onNavigationClick = onBack
            ) 
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (val s = uiState) {
                is AvailabilityUiState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
                is AvailabilityUiState.Error -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = s.message, color = MaterialTheme.colorScheme.error)
                    }
                }
                is AvailabilityUiState.Success -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "Selecciona tu horario",
                            style = MaterialTheme.typography.headlineSmall,
                            color = MaterialTheme.colorScheme.onBackground,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Desde: ${s.selectedStart?.startsAt?.toLocalTime() ?: "--:--"}", color = MaterialTheme.colorScheme.onBackground)
                                Text("Hasta: ${s.selectedEnd?.endsAt?.toLocalTime() ?: "--:--"}", color = MaterialTheme.colorScheme.onBackground)
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
                            PrimaryButtonCarretera(
                                text = "Continuar al pago",
                                onClick = {
                                    val ids = viewModel.getSelectionIds()
                                    if (ids != null) {
                                        onProceedToPayment(
                                            parkingLotId,
                                            ids.first,
                                            ids.second
                                        )
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
