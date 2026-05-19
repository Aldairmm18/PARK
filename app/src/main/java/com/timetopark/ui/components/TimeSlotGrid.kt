package com.timetopark.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.timetopark.domain.models.TimeSlot
import java.time.format.DateTimeFormatter

@Composable
fun TimeSlotGrid(
    slots: List<TimeSlot>,
    selectedStart: TimeSlot?,
    selectedEnd: TimeSlot?,
    onSlotSelected: (TimeSlot) -> Unit,
    modifier: Modifier = Modifier
) {
    val fmt = DateTimeFormatter.ofPattern("HH:mm")

    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(slots) { slot ->
            val isStart = slot.id == selectedStart?.id
            val isEnd = slot.id == selectedEnd?.id
            val isInRange = selectedStart != null && selectedEnd != null &&
                    !slot.startsAt.isBefore(selectedStart.startsAt) &&
                    !slot.startsAt.isAfter(selectedEnd.startsAt)
            val isEmpty = slot.availableCapacity == 0

            val bgColor = when {
                isStart || isEnd -> MaterialTheme.colorScheme.primary
                isInRange        -> MaterialTheme.colorScheme.primary.copy(alpha = 0.35f)
                isEmpty          -> Color(0xFF2A2A2A)
                else             -> MaterialTheme.colorScheme.surface
            }
            val onBg = if (isStart || isEnd) MaterialTheme.colorScheme.onPrimary
                       else if (isEmpty) Color.Gray
                       else MaterialTheme.colorScheme.onSurface

            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .height(58.dp)
                    .background(bgColor, RoundedCornerShape(8.dp))
                    .border(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                    .clickable(enabled = !isEmpty) { onSlotSelected(slot) }
                    .padding(4.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(slot.startsAt.format(fmt), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = onBg)
                    Text(
                        if (isEmpty) "Sin cupos" else "${slot.availableCapacity} cupos",
                        fontSize = 10.sp, color = onBg.copy(alpha = 0.75f)
                    )
                }
            }
        }
    }
}
