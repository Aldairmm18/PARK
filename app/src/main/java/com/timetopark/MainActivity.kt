package com.timetopark

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.timetopark.navigation.TimetoparkNavHost
import com.timetopark.ui.theme.TimetoparkTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TimetoparkTheme {
                TimetoparkNavHost()
            }
        }
    }
}
