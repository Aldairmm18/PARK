package com.timetopark.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.timetopark.domain.enums.ReservationStatus
import com.timetopark.ui.viewmodels.QRScannerViewModel
import com.timetopark.ui.viewmodels.ScanUiState

@Composable
fun QRScannerScreen(
    modifier: Modifier = Modifier,
    viewModel: QRScannerViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var manualInput by remember { mutableStateOf("") }

    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Escáner QR", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)

        // Marco de cámara simulado
        Box(
            modifier = Modifier
                .size(250.dp)
                .background(Color(0xFF1A1A1A), RoundedCornerShape(16.dp))
                .border(2.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center
        ) {
            when (val s = uiState) {
                is ScanUiState.Idle, is ScanUiState.Scanning -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Filled.QrCodeScanner, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(64.dp))
                        if (s is ScanUiState.Scanning) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
                        } else {
                            Text("Ingresa el código QR", color = MaterialTheme.colorScheme.secondary, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center)
                        }
                    }
                }
                is ScanUiState.CheckInSuccess -> ResultBox(
                    icon = Icons.Filled.CheckCircle,
                    iconColor = Color(0xFF4CAF50),
                    title = "Acceso permitido",
                    subtitle = "Check-in registrado\nPlaca: ${s.reservation.vehiclePlate}"
                )
                is ScanUiState.CheckOutSuccess -> ResultBox(
                    icon = Icons.Filled.CheckCircle,
                    iconColor = Color(0xFF2196F3),
                    title = if (s.reservation.status == ReservationStatus.OVERSTAY) "Salida con tiempo extra" else "Salida registrada",
                    subtitle = "Hasta pronto"
                )
                is ScanUiState.AccessDenied -> ResultBox(
                    icon = Icons.Filled.Close,
                    iconColor = Color(0xFFF44336),
                    title = "Acceso denegado",
                    subtitle = s.reason
                )
            }
        }

        // Entrada manual (modo desarrollo/demo)
        OutlinedTextField(
            value = manualInput,
            onValueChange = { manualInput = it },
            label = { Text("Hash del QR (prueba)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = MaterialTheme.colorScheme.primary),
            placeholder = { Text("ej. QR-ENTRY-2", color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.5f)) }
        )

        Button(
            onClick = { viewModel.processQRCode(manualInput.trim()) },
            enabled = manualInput.isNotBlank() && uiState !is ScanUiState.Scanning,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
        ) { Text("Validar QR", color = MaterialTheme.colorScheme.onPrimary, fontWeight = FontWeight.Bold) }

        // Botones de QR de prueba rápida
        Text("— QRs de prueba —", color = MaterialTheme.colorScheme.secondary, style = MaterialTheme.typography.labelSmall)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(
                onClick = { manualInput = "QR-ENTRY-2"; viewModel.processQRCode("QR-ENTRY-2") },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
            ) { Text("Entrada #2", style = MaterialTheme.typography.labelSmall) }
            OutlinedButton(
                onClick = { manualInput = "QR-EXIT-2"; viewModel.processQRCode("QR-EXIT-2") },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
            ) { Text("Salida #2", style = MaterialTheme.typography.labelSmall) }
        }

        if (uiState !is ScanUiState.Idle && uiState !is ScanUiState.Scanning) {
            TextButton(onClick = { viewModel.reset(); manualInput = "" }) {
                Text("Escanear otro", color = MaterialTheme.colorScheme.secondary)
            }
        }
    }
}

@Composable
private fun ResultBox(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(56.dp))
        Text(title, fontWeight = FontWeight.Bold, color = Color.White, textAlign = TextAlign.Center)
        Text(subtitle, color = Color.White.copy(alpha = 0.7f), style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center)
    }
}
