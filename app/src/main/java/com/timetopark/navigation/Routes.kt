package com.timetopark.navigation

sealed class Routes(val route: String) {
    // Autenticación
    data object Login    : Routes("login")
    data object Register : Routes("register")

    // Navegación principal
    data object Home     : Routes("home")
    data object Settings : Routes("settings")
    data object MyReservations : Routes("my_reservations")
    data object QRScanner      : Routes("qr_scanner")

    // Flujo de reserva (con argumentos)
    data object ParkingDetail : Routes("parking_detail/{lotId}") {
        fun create(lotId: Long) = "parking_detail/$lotId"
    }
    data object Availability : Routes("availability/{lotId}") {
        fun create(lotId: Long) = "availability/$lotId"
    }
    data object Payment : Routes("payment/{lotId}/{startId}/{endId}") {
        fun create(lotId: Long, startId: Long, endId: Long) = "payment/$lotId/$startId/$endId"
    }
    data object Confirmation : Routes("confirmation/{reservationId}") {
        fun create(reservationId: Long) = "confirmation/$reservationId"
    }
}
