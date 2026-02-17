package com.timetopark.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.timetopark.data.models.ParkingSpot
import com.timetopark.ui.components.PrimaryButtonCarretera

@Composable
fun ParkingDetailScreen(
    modifier: Modifier = Modifier,
    parkingSpot: ParkingSpot = ParkingSpot(
        name = "Parking Centro 24H",
        isAvailable = true,
        slots = 12,
        ratePerHour = "$5.000/h"
    )
) {
    val context = LocalContext.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(text = "Nombre: ${parkingSpot.name}", color = MaterialTheme.colorScheme.onBackground)
        Text(
            text = "Estado: ${if (parkingSpot.isAvailable) "Disponible" else "Lleno"}",
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(text = "Cupos: ${parkingSpot.slots}", color = MaterialTheme.colorScheme.onBackground)
        Text(text = "Tarifa: ${parkingSpot.ratePerHour}", color = MaterialTheme.colorScheme.onBackground)
        PrimaryButtonCarretera(text = "IR", onClick = {
            Toast.makeText(context, "Abrir navegación", Toast.LENGTH_SHORT).show()
        })
    }
}
