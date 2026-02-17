package com.timetopark.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(text = "Mi vehículo (placa)", color = MaterialTheme.colorScheme.onBackground)
        Text(text = "Notificaciones", color = MaterialTheme.colorScheme.onBackground)
        Text(text = "Tema carretera (on)", color = MaterialTheme.colorScheme.onBackground)
    }
}
