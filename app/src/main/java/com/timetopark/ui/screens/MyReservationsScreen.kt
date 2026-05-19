package com.timetopark.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.timetopark.domain.enums.ReservationStatus
import com.timetopark.domain.models.Reservation
import com.timetopark.ui.components.ErrorMessageCard
import com.timetopark.ui.components.ReservationStatusBadge
import com.timetopark.ui.viewmodels.MyReservationsUiState
import com.timetopark.ui.viewmodels.MyReservationsViewModel
import java.time.format.DateTimeFormatter

@Composable
fun MyReservationsScreen(
    modifier: Modifier = Modifier,
    viewModel: MyReservationsViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val fmt = DateTimeFormatter.ofPattern("dd/MM HH:mm")
    var snackMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) { viewModel.load() }

    LaunchedEffect(uiState) {
        if (uiState is MyReservationsUiState.Success) {
            val msg = (uiState as MyReservationsUiState.Success).actionMessage
            if (msg != null) snackMessage = msg
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Mis reservas", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)

            when (val s = uiState) {
                is MyReservationsUiState.Loading -> Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
                is MyReservationsUiState.Error -> ErrorMessageCard(s.message)
                is MyReservationsUiState.Success -> {
                    if (s.reservations.isEmpty()) {
                        Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                            Text("No tienes reservas aún", color = MaterialTheme.colorScheme.secondary)
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(s.reservations) { res ->
                                ReservationCard(res, fmt, onCancel = { viewModel.cancel(res.id) })
                            }
                        }
                    }
                }
            }
        }

        if (snackMessage != null) {
            Snackbar(
                modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp),
                action = { TextButton(onClick = { snackMessage = null }) { Text("OK") } }
            ) { Text(snackMessage!!) }
        }
    }
}

@Composable
private fun ReservationCard(
    res: Reservation,
    fmt: DateTimeFormatter,
    onCancel: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Reserva #${res.id}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                ReservationStatusBadge(res.status)
            }
            Text("Placa: ${res.vehiclePlate}", color = MaterialTheme.colorScheme.secondary, style = MaterialTheme.typography.bodySmall)
            Text("${res.startsAt.format(fmt)} → ${res.endsAt.format(fmt)}", color = MaterialTheme.colorScheme.onSurface, style = MaterialTheme.typography.bodySmall)

            if (res.status == ReservationStatus.RESERVED) {
                TextButton(
                    onClick = onCancel,
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text("Cancelar reserva") }
            }
        }
    }
}
