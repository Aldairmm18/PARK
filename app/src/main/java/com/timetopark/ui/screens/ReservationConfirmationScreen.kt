package com.timetopark.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.timetopark.ui.components.ErrorMessageCard
import com.timetopark.ui.components.PrimaryButtonCarretera
import com.timetopark.ui.components.QRCodeDisplay
import com.timetopark.ui.viewmodels.ConfirmationUiState
import com.timetopark.ui.viewmodels.ReservationConfirmationViewModel
import java.time.format.DateTimeFormatter

@Composable
fun ReservationConfirmationScreen(
    reservationId: Long,
    onGoHome: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ReservationConfirmationViewModel = viewModel()
) {
    LaunchedEffect(reservationId) { viewModel.load(reservationId) }
    val uiState by viewModel.uiState.collectAsState()
    val fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        when (val s = uiState) {
            is ConfirmationUiState.Loading -> CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            is ConfirmationUiState.Error -> {
                ErrorMessageCard(s.message)
                PrimaryButtonCarretera(
                    text = "Volver al inicio",
                    onClick = onGoHome
                )
            }
            is ConfirmationUiState.Success -> {
                Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = Color(0xFF4CAF50), modifier = Modifier.size(64.dp))
                Text("¡Reserva confirmada!", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground, textAlign = TextAlign.Center)
                Text(s.lot.name, color = MaterialTheme.colorScheme.secondary, textAlign = TextAlign.Center)
                Text("${s.reservation.startsAt.format(fmt)} → ${s.reservation.endsAt.format(fmt)}", color = MaterialTheme.colorScheme.secondary, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center)

                QRCodeDisplay(content = s.qrToken.tokenHash)

                Text("Presenta este QR al llegar al parqueadero", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary, textAlign = TextAlign.Center)
                Text("Tienes hasta las ${s.reservation.arrivalDeadlineAt.format(DateTimeFormatter.ofPattern("HH:mm"))} para ingresar", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary, textAlign = TextAlign.Center)

                Spacer(Modifier.weight(1f))
                PrimaryButtonCarretera(
                    text = "Ir al inicio",
                    onClick = onGoHome
                )
            }
        }
    }
}
