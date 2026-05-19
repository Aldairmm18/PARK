package com.timetopark.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.timetopark.ui.components.ErrorMessageCard
import com.timetopark.ui.components.PrimaryButtonCarretera
import com.timetopark.ui.viewmodels.PaymentUiState
import com.timetopark.ui.viewmodels.PaymentViewModel
import java.time.format.DateTimeFormatter

@Composable
fun PaymentScreen(
    parkingLotId: Long,
    startSlotId: Long,
    endSlotId: Long,
    onPaymentSuccess: (reservationId: Long) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PaymentViewModel = viewModel()
) {
    LaunchedEffect(Unit) { viewModel.load(parkingLotId, startSlotId, endSlotId) }
    val uiState by viewModel.uiState.collectAsState()
    var vehiclePlate by remember { mutableStateOf("") }
    val fmt = DateTimeFormatter.ofPattern("dd/MM HH:mm")

    LaunchedEffect(uiState) {
        if (uiState is PaymentUiState.Success) {
            onPaymentSuccess((uiState as PaymentUiState.Success).reservation.id)
        }
    }

    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Confirmar pago", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)

        when (val s = uiState) {
            is PaymentUiState.Loading -> CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            is PaymentUiState.Error -> ErrorMessageCard(s.message)
            is PaymentUiState.ReadyToPay -> {
                Box(
                    Modifier.fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
                        .padding(16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(s.lot.name, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        SummaryRow("Entrada", s.startSlot.startsAt.format(fmt))
                        SummaryRow("Salida", s.endSlot.endsAt.format(fmt))
                        HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
                        SummaryRow("Total a pagar", "$ ${s.totalCost}", highlight = true)
                    }
                }

                OutlinedTextField(
                    value = vehiclePlate,
                    onValueChange = { vehiclePlate = it },
                    label = { Text("Placa del vehículo") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = MaterialTheme.colorScheme.primary)
                )

                if (s.error != null) ErrorMessageCard(s.error)

                Spacer(Modifier.weight(1f))
                PrimaryButtonCarretera(
                    text = "Pagar y reservar",
                    onClick = { viewModel.confirmPayment(vehiclePlate) }
                )
            }
            is PaymentUiState.Success -> {
                // Navegación manejada por LaunchedEffect
            }
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String, highlight: Boolean = false) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = MaterialTheme.colorScheme.secondary)
        Text(
            value,
            color = if (highlight) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
            fontWeight = if (highlight) FontWeight.Bold else FontWeight.Normal
        )
    }
}
