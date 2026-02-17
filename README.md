# Timetopark - Ticket 1

Proyecto Android base en Kotlin + Jetpack Compose con navegación y tema visual **Carretera** (negro/amarillo).

## Estructura principal

- `app/src/main/java/com/timetopark/ui/`
  - `screens/`
  - `components/`
  - `theme/`
- `app/src/main/java/com/timetopark/data/models/`
- `app/src/main/java/com/timetopark/navigation/`

## Cómo correr en Android Studio

1. Abre Android Studio (Hedgehog o superior recomendado).
2. Selecciona **Open** y elige la carpeta raíz del proyecto (`PARK`).
3. Espera a que Gradle sincronice dependencias.
4. Crea o selecciona un emulador con Android 7.0+ (API 24 o superior).
5. Ejecuta el módulo `app` con **Run ▶**.

## Checklist de aceptación (Ticket 1)

- [x] Compila (estructura y configuración listas para Compose + Navigation).
- [x] Navega entre pantallas (`Home`, `Saved`, `Settings`, `ParkingDetail`).
- [x] UI visible y coherente con tema carretera (negro/amarillo, textos claros).

## Alcance

- Incluye MVVM básico en `Home` (`HomeViewModel`).
- Incluye componentes reutilizables:
  - `TopBarCarretera`
  - `PrimaryButtonCarretera`
- No incluye Firebase aún.
