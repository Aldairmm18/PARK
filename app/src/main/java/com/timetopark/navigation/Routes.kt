package com.timetopark.navigation

sealed class Routes(val route: String) {
    data object Home : Routes("home")
    data object Saved : Routes("saved")
    data object Settings : Routes("settings")
    data object ParkingDetail : Routes("parking_detail")
}
