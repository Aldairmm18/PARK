package com.timetopark.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val CarreteraColorScheme = darkColorScheme(
    primary = TrafficYellow,
    onPrimary = AsphaltBlack,
    background = AsphaltBlack,
    onBackground = SoftWhite,
    surface = RoadGray,
    onSurface = SoftWhite,
    secondary = LightGrayText,
    onSecondary = SoftWhite
)

@Composable
fun TimetoparkTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = CarreteraColorScheme,
        typography = Typography,
        content = content
    )
}
