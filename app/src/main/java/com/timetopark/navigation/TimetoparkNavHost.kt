package com.timetopark.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.timetopark.ui.components.TopBarCarretera
import com.timetopark.ui.screens.*

private data class BottomItem(
    val route: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

private val bottomNavRoutes = setOf(
    Routes.Home.route,
    Routes.MyReservations.route,
    Routes.QRScanner.route,
    Routes.Settings.route
)

private val authRoutes = setOf(Routes.Login.route, Routes.Register.route)

@Composable
fun TimetoparkNavHost() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute in bottomNavRoutes
    val showTopBar = currentRoute !in authRoutes
    val isDetailLike = currentRoute !in bottomNavRoutes && currentRoute !in authRoutes

    val topBarTitle = when {
        currentRoute == Routes.ParkingDetail.route || currentRoute?.startsWith("parking_detail") == true -> "Detalle del parqueadero"
        currentRoute?.startsWith("availability") == true -> "Disponibilidad"
        currentRoute?.startsWith("payment") == true -> "Pago"
        currentRoute?.startsWith("confirmation") == true -> "Confirmación"
        currentRoute == Routes.MyReservations.route -> "Mis reservas"
        currentRoute == Routes.QRScanner.route -> "Escáner QR"
        currentRoute == Routes.Settings.route -> "Perfil"
        else -> "ParkNow"
    }

    val bottomItems = listOf(
        BottomItem(Routes.Home.route, "Inicio", Icons.Filled.Home),
        BottomItem(Routes.MyReservations.route, "Reservas", Icons.Filled.ListAlt),
        BottomItem(Routes.QRScanner.route, "QR", Icons.Filled.QrCodeScanner),
        BottomItem(Routes.Settings.route, "Perfil", Icons.Filled.Settings)
    )

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (showTopBar) {
                TopBarCarretera(
                    title = topBarTitle,
                    navigationIcon = if (isDetailLike) Icons.AutoMirrored.Filled.ArrowBack else null,
                    onNavigationClick = if (isDetailLike) ({ navController.popBackStack() }) else null
                )
            }
        },
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                    bottomItems.forEach { item ->
                        val selected = navBackStackEntry?.destination?.hierarchy?.any { it.route == item.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.Login.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            // ─── Autenticación ────────────────────────────────────────────────
            composable(Routes.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Login.route) { inclusive = true }
                        }
                    },
                    onGoToRegister = { navController.navigate(Routes.Register.route) }
                )
            }
            composable(Routes.Register.route) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Login.route) { inclusive = true }
                        }
                    },
                    onGoToLogin = { navController.popBackStack() }
                )
            }

            // ─── Navegación principal ─────────────────────────────────────────
            composable(Routes.Home.route) {
                HomeScreen(
                    onSeeDetail = { lotId -> navController.navigate(Routes.ParkingDetail.create(lotId)) }
                )
            }
            composable(Routes.MyReservations.route) { MyReservationsScreen() }
            composable(Routes.QRScanner.route) { QRScannerScreen() }
            composable(Routes.Settings.route) {
                SettingsScreen(
                    onLogout = {
                        navController.navigate(Routes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            // ─── Flujo de reserva ─────────────────────────────────────────────
            composable(
                route = Routes.ParkingDetail.route,
                arguments = listOf(navArgument("lotId") { type = NavType.LongType })
            ) { backStack ->
                val lotId = backStack.arguments?.getLong("lotId") ?: return@composable
                ParkingDetailScreen(
                    parkingLotId = lotId,
                    onReserve = { id -> navController.navigate(Routes.Availability.create(id)) }
                )
            }
            composable(
                route = Routes.Availability.route,
                arguments = listOf(navArgument("lotId") { type = NavType.LongType })
            ) { backStack ->
                val lotId = backStack.arguments?.getLong("lotId") ?: return@composable
                AvailabilityScreen(
                    parkingLotId = lotId,
                    onBack = { navController.popBackStack() },
                    onProceedToPayment = { l, s, e -> navController.navigate(Routes.Payment.create(l, s, e)) }
                )
            }
            composable(
                route = Routes.Payment.route,
                arguments = listOf(
                    navArgument("lotId")   { type = NavType.LongType },
                    navArgument("startId") { type = NavType.LongType },
                    navArgument("endId")   { type = NavType.LongType }
                )
            ) { backStack ->
                val lotId   = backStack.arguments?.getLong("lotId")   ?: return@composable
                val startId = backStack.arguments?.getLong("startId") ?: return@composable
                val endId   = backStack.arguments?.getLong("endId")   ?: return@composable
                PaymentScreen(
                    parkingLotId = lotId, startSlotId = startId, endSlotId = endId,
                    onPaymentSuccess = { resId -> navController.navigate(Routes.Confirmation.create(resId)) {
                        popUpTo(Routes.Home.route)
                    }}
                )
            }
            composable(
                route = Routes.Confirmation.route,
                arguments = listOf(navArgument("reservationId") { type = NavType.LongType })
            ) { backStack ->
                val resId = backStack.arguments?.getLong("reservationId") ?: return@composable
                ReservationConfirmationScreen(
                    reservationId = resId,
                    onGoHome = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Home.route) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
