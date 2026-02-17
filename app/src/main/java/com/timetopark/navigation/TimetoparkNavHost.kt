package com.timetopark.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.timetopark.ui.components.TopBarCarretera
import com.timetopark.ui.screens.HomeScreen
import com.timetopark.ui.screens.ParkingDetailScreen
import com.timetopark.ui.screens.SavedScreen
import com.timetopark.ui.screens.SettingsScreen

private data class BottomItem(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)

@Composable
fun TimetoparkNavHost() {
    val navController = rememberNavController()
    val bottomItems = listOf(
        BottomItem(Routes.Home.route, "Home", Icons.Filled.Home),
        BottomItem(Routes.Saved.route, "Saved", Icons.Filled.Favorite),
        BottomItem(Routes.Settings.route, "Settings", Icons.Filled.Settings)
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    val isDetailScreen = currentDestination?.route == Routes.ParkingDetail.route

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopBarCarretera(
                title = if (isDetailScreen) "Detalle del parqueadero" else "Timetopark",
                navigationIcon = if (isDetailScreen) Icons.Filled.ArrowBack else null,
                onNavigationClick = if (isDetailScreen) {
                    { navController.popBackStack() }
                } else {
                    null
                }
            )
        },
        bottomBar = {
            if (!isDetailScreen) {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                    bottomItems.forEach { item ->
                        val selected = currentDestination?.hierarchy?.any { it.route == item.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
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
            startDestination = Routes.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Routes.Home.route) {
                HomeScreen(
                    onSearchParking = { navController.navigate(Routes.ParkingDetail.route) },
                    onSeeDetail = { navController.navigate(Routes.ParkingDetail.route) }
                )
            }
            composable(Routes.Saved.route) { SavedScreen() }
            composable(Routes.Settings.route) { SettingsScreen() }
            composable(Routes.ParkingDetail.route) { ParkingDetailScreen() }
        }
    }
}
