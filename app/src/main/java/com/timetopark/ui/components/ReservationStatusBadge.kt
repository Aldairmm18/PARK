package com.timetopark.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.timetopark.domain.enums.ReservationStatus

@Composable
fun ReservationStatusBadge(status: ReservationStatus, modifier: Modifier = Modifier) {
    val (bgColor, label) = when (status) {
        ReservationStatus.RESERVED   -> Color(0xFF1565C0) to "RESERVADO"
        ReservationStatus.CHECKED_IN -> Color(0xFF2E7D32) to "EN USO"
        ReservationStatus.COMPLETED  -> Color(0xFF424242) to "COMPLETADO"
        ReservationStatus.EXPIRED    -> Color(0xFF6D4C41) to "EXPIRADO"
        ReservationStatus.OVERSTAY   -> Color(0xFFB71C1C) to "TIEMPO EXTRA"
        ReservationStatus.CANCELLED  -> Color(0xFF37474F) to "CANCELADO"
    }
    Text(
        text = label,
        color = Color.White,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        modifier = modifier
            .background(bgColor, RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}
