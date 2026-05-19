package com.timetopark.data.remote

import com.timetopark.data.repository.IAuthRepository
import com.timetopark.data.repository.IParkingRepository
import com.timetopark.data.repository.IReservationRepository
import com.timetopark.domain.enums.*
import com.timetopark.domain.models.*
import kotlinx.coroutines.delay
import java.math.BigDecimal
import java.time.Duration
import java.time.LocalDateTime

class FakeRepository : IAuthRepository, IParkingRepository, IReservationRepository {

    // ─── Estado mutable ────────────────────────────────────────────────────────

    private var currentUser: User? = null
    private var nextId = 100L

    private val users = mutableListOf(
        User(
            id = 1L,
            fullName = "Usuario Test",
            phone = "3001234567",
            email = "test@parknow.com",
            passwordHash = "test1234",
            status = UserStatus.ACTIVE,
            createdAt = LocalDateTime.now().minusDays(30)
        )
    )

    private val parkingLots = listOf(
        ParkingLot(id = 1L, tenantId = 10L, name = "Los Molinos", totalCapacity = 50, pricePerBlock = BigDecimal("3500"), address = "Cra. 43A #5 Sur-100, Medellín"),
        ParkingLot(id = 2L, tenantId = 10L, name = "El Tesoro", totalCapacity = 80, pricePerBlock = BigDecimal("4000"), address = "Cra. 25A #1 Sur-45, Medellín"),
        ParkingLot(id = 3L, tenantId = 10L, name = "Unicentro", totalCapacity = 120, pricePerBlock = BigDecimal("3000"), address = "Cra. 66 #3-250, Medellín")
    )

    private val timeSlots: MutableList<TimeSlot> = mutableListOf<TimeSlot>().apply {
        val base = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0)
        var slotId = 1L
        parkingLots.forEach { lot ->
            for (dayOffset in 0..2) {
                for (blockIndex in 0..47) {
                    val start = base.plusDays(dayOffset.toLong()).plusMinutes(blockIndex * 30L)
                    add(TimeSlot(
                        id = slotId++,
                        parkingLotId = lot.id,
                        startsAt = start,
                        endsAt = start.plusMinutes(30),
                        availableCapacity = (5..20).random()
                    ))
                }
            }
        }
    }

    private val reservations = mutableListOf(
        Reservation(
            id = 1L, ownerId = 1L, ownerType = OwnerType.USER, parkingLotId = 1L,
            vehiclePlate = "ABC123",
            startsAt = LocalDateTime.now().minusHours(2),
            endsAt = LocalDateTime.now().minusHours(1),
            status = ReservationStatus.COMPLETED,
            arrivalDeadlineAt = LocalDateTime.now().minusHours(2).plusMinutes(25),
            checkedInAt = LocalDateTime.now().minusHours(2).plusMinutes(10),
            checkedOutAt = LocalDateTime.now().minusHours(1).plusMinutes(5),
            createdAt = LocalDateTime.now().minusHours(3)
        ),
        Reservation(
            id = 2L, ownerId = 1L, ownerType = OwnerType.USER, parkingLotId = 2L,
            vehiclePlate = "ABC123",
            startsAt = LocalDateTime.now().plusHours(1),
            endsAt = LocalDateTime.now().plusHours(2),
            status = ReservationStatus.RESERVED,
            arrivalDeadlineAt = LocalDateTime.now().plusHours(1).plusMinutes(25),
            checkedInAt = null, checkedOutAt = null,
            createdAt = LocalDateTime.now().minusMinutes(30)
        )
    )

    private val qrTokens = mutableListOf(
        QRToken(
            id = 1L, reservationId = 2L,
            tokenHash = "QR-ENTRY-2",
            purpose = QRPurpose.ENTRY,
            expiresAt = LocalDateTime.now().plusHours(1).plusMinutes(25),
            usedAt = null
        )
    )

    private val payments = mutableListOf(
        Payment(id = 1L, reservationId = 1L, type = PaymentType.RESERVATION, amount = BigDecimal("7000"), status = PaymentStatus.SUCCESS, createdAt = LocalDateTime.now().minusHours(3)),
        Payment(id = 2L, reservationId = 2L, type = PaymentType.RESERVATION, amount = BigDecimal("8000"), status = PaymentStatus.SUCCESS, createdAt = LocalDateTime.now().minusMinutes(30))
    )

    // ─── IAuthRepository ───────────────────────────────────────────────────────

    override suspend fun login(email: String, password: String): Result<User> {
        delay(500)
        val user = users.find { it.email.equals(email, ignoreCase = true) && it.passwordHash == password }
            ?: return Result.failure(Exception("Credenciales incorrectas"))
        if (user.status == UserStatus.INACTIVE)
            return Result.failure(Exception("Cuenta inactiva"))
        currentUser = user
        return Result.success(user)
    }

    override suspend fun register(fullName: String, phone: String, email: String, password: String): Result<User> {
        delay(600)
        if (users.any { it.email.equals(email, ignoreCase = true) })
            return Result.failure(Exception("El correo ya está registrado"))
        val newUser = User(
            id = nextId++, fullName = fullName, phone = phone, email = email,
            passwordHash = password, status = UserStatus.ACTIVE,
            createdAt = LocalDateTime.now()
        )
        users.add(newUser)
        currentUser = newUser
        return Result.success(newUser)
    }

    override fun logout() { currentUser = null }

    override fun currentUser(): User? = currentUser

    // ─── IParkingRepository ────────────────────────────────────────────────────

    override suspend fun getAllParkingLots(): List<ParkingLot> {
        delay(300)
        return parkingLots
    }

    override suspend fun getParkingLotById(id: Long): ParkingLot? =
        parkingLots.find { it.id == id }

    override suspend fun getTimeSlotsForLot(parkingLotId: Long): List<TimeSlot> {
        delay(200)
        expireOverdueReservations()
        val now = LocalDateTime.now()
        return timeSlots.filter { it.parkingLotId == parkingLotId && it.startsAt.isAfter(now) }
    }

    override suspend fun decrementCapacity(timeSlotId: Long): Boolean {
        val idx = timeSlots.indexOfFirst { it.id == timeSlotId }
        if (idx == -1) return false
        val slot = timeSlots[idx]
        if (slot.availableCapacity <= 0) return false
        timeSlots[idx] = slot.copy(availableCapacity = slot.availableCapacity - 1)
        return true
    }

    override suspend fun incrementCapacity(timeSlotId: Long) {
        val idx = timeSlots.indexOfFirst { it.id == timeSlotId }
        if (idx != -1) {
            val slot = timeSlots[idx]
            timeSlots[idx] = slot.copy(availableCapacity = slot.availableCapacity + 1)
        }
    }

    // ─── IReservationRepository ────────────────────────────────────────────────

    override suspend fun createReservation(
        ownerId: Long,
        parkingLotId: Long,
        vehiclePlate: String,
        startSlotId: Long,
        endSlotId: Long
    ): Result<Reservation> {
        delay(700)
        val startSlot = timeSlots.find { it.id == startSlotId }
            ?: return Result.failure(Exception("Bloque de inicio no encontrado"))
        val endSlot = timeSlots.find { it.id == endSlotId }
            ?: return Result.failure(Exception("Bloque de fin no encontrado"))

        val affectedSlots = timeSlots.filter {
            it.parkingLotId == parkingLotId &&
            !it.startsAt.isBefore(startSlot.startsAt) &&
            !it.endsAt.isAfter(endSlot.endsAt)
        }

        if (affectedSlots.isEmpty())
            return Result.failure(Exception("No se encontraron bloques en el rango seleccionado"))
        if (affectedSlots.any { it.availableCapacity <= 0 })
            return Result.failure(Exception("Sin cupos disponibles en alguno de los bloques seleccionados"))

        affectedSlots.forEach { decrementCapacity(it.id) }

        val reservation = Reservation(
            id = nextId++, ownerId = ownerId, ownerType = OwnerType.USER,
            parkingLotId = parkingLotId, vehiclePlate = vehiclePlate,
            startsAt = startSlot.startsAt, endsAt = endSlot.endsAt,
            status = ReservationStatus.RESERVED,
            arrivalDeadlineAt = startSlot.startsAt.plusMinutes(25),
            checkedInAt = null, checkedOutAt = null,
            createdAt = LocalDateTime.now()
        )
        reservations.add(reservation)

        val qrToken = QRToken(
            id = nextId++, reservationId = reservation.id,
            tokenHash = "QR-ENTRY-${reservation.id}",
            purpose = QRPurpose.ENTRY,
            expiresAt = reservation.arrivalDeadlineAt,
            usedAt = null
        )
        qrTokens.add(qrToken)

        val lot = parkingLots.find { it.id == parkingLotId }
        val amount = (lot?.pricePerBlock ?: BigDecimal("3500")) * BigDecimal(affectedSlots.size.coerceAtLeast(1))
        payments.add(Payment(
            id = nextId++, reservationId = reservation.id,
            type = PaymentType.RESERVATION, amount = amount,
            status = PaymentStatus.SUCCESS, createdAt = LocalDateTime.now()
        ))

        return Result.success(reservation)
    }

    override suspend fun getReservationsByOwner(ownerId: Long): List<Reservation> {
        delay(300)
        expireOverdueReservations()
        return reservations.filter { it.ownerId == ownerId }.sortedByDescending { it.createdAt }
    }

    override suspend fun getReservationById(id: Long): Reservation? =
        reservations.find { it.id == id }

    override suspend fun cancelReservation(id: Long): Result<Unit> {
        delay(400)
        val idx = reservations.indexOfFirst { it.id == id }
        if (idx == -1) return Result.failure(Exception("Reserva no encontrada"))
        val reservation = reservations[idx]
        if (reservation.status != ReservationStatus.RESERVED)
            return Result.failure(Exception("Solo se pueden cancelar reservas en estado RESERVED"))
        val minutesUntilStart = Duration.between(LocalDateTime.now(), reservation.startsAt).toMinutes()
        if (minutesUntilStart < 30)
            return Result.failure(Exception("Solo se puede cancelar con 30 min de anticipación"))
        reservations[idx] = reservation.copy(status = ReservationStatus.CANCELLED)
        val originalPayment = payments.find { it.reservationId == id && it.type == PaymentType.RESERVATION }
        payments.add(Payment(
            id = nextId++, reservationId = id, type = PaymentType.REFUND,
            amount = originalPayment?.amount ?: BigDecimal.ZERO,
            status = PaymentStatus.SUCCESS, createdAt = LocalDateTime.now()
        ))
        return Result.success(Unit)
    }

    override suspend fun checkIn(qrTokenHash: String): Result<Reservation> {
        delay(400)
        val qrIdx = qrTokens.indexOfFirst { it.tokenHash == qrTokenHash }
        if (qrIdx == -1) return Result.failure(Exception("QR no válido"))
        val qr = qrTokens[qrIdx]
        if (qr.usedAt != null) return Result.failure(Exception("QR ya utilizado"))
        if (qr.purpose != QRPurpose.ENTRY) return Result.failure(Exception("QR no es de entrada"))
        if (LocalDateTime.now().isAfter(qr.expiresAt)) return Result.failure(Exception("QR expirado"))

        val resIdx = reservations.indexOfFirst { it.id == qr.reservationId }
        if (resIdx == -1) return Result.failure(Exception("Reserva no encontrada"))
        val reservation = reservations[resIdx]
        if (reservation.status != ReservationStatus.RESERVED)
            return Result.failure(Exception("La reserva no está en estado RESERVED"))

        val now = LocalDateTime.now()
        qrTokens[qrIdx] = qr.copy(usedAt = now)
        val updated = reservation.copy(status = ReservationStatus.CHECKED_IN, checkedInAt = now)
        reservations[resIdx] = updated

        // Generar QR de salida automáticamente al hacer check-in
        qrTokens.add(QRToken(
            id = nextId++, reservationId = reservation.id,
            tokenHash = "QR-EXIT-${reservation.id}",
            purpose = QRPurpose.EXIT,
            expiresAt = reservation.endsAt.plusMinutes(70),
            usedAt = null
        ))
        return Result.success(updated)
    }

    override suspend fun checkOut(qrTokenHash: String): Result<Reservation> {
        delay(400)
        val qrIdx = qrTokens.indexOfFirst { it.tokenHash == qrTokenHash }
        if (qrIdx == -1) return Result.failure(Exception("QR no válido"))
        val qr = qrTokens[qrIdx]
        if (qr.usedAt != null) return Result.failure(Exception("QR ya utilizado"))
        if (qr.purpose != QRPurpose.EXIT) return Result.failure(Exception("QR no es de salida"))

        val resIdx = reservations.indexOfFirst { it.id == qr.reservationId }
        if (resIdx == -1) return Result.failure(Exception("Reserva no encontrada"))
        val reservation = reservations[resIdx]
        if (reservation.status != ReservationStatus.CHECKED_IN)
            return Result.failure(Exception("La reserva no está en estado CHECKED_IN"))

        val now = LocalDateTime.now()
        val reservedMinutes = Duration.between(reservation.startsAt, reservation.endsAt).toMinutes()
        val actualMinutes = Duration.between(reservation.checkedInAt ?: reservation.startsAt, now).toMinutes()
        val isOverstay = actualMinutes > reservedMinutes + 10

        qrTokens[qrIdx] = qr.copy(usedAt = now)
        val updated = reservation.copy(
            status = if (isOverstay) ReservationStatus.OVERSTAY else ReservationStatus.COMPLETED,
            checkedOutAt = now
        )
        reservations[resIdx] = updated

        if (isOverstay) {
            val extraBlocks = ((actualMinutes - reservedMinutes) / 30 + 1).coerceAtLeast(1)
            payments.add(Payment(
                id = nextId++, reservationId = reservation.id,
                type = PaymentType.PENALTY,
                amount = BigDecimal("5000") * BigDecimal(extraBlocks),
                status = PaymentStatus.SUCCESS, createdAt = now
            ))
        }
        return Result.success(updated)
    }

    override suspend fun getEntryQRForReservation(reservationId: Long): QRToken? =
        qrTokens.find { it.reservationId == reservationId && it.purpose == QRPurpose.ENTRY }

    override suspend fun getPaymentForReservation(reservationId: Long): Payment? =
        payments.find { it.reservationId == reservationId && it.type == PaymentType.RESERVATION }

    override suspend fun expireOverdueReservations() {
        val now = LocalDateTime.now()
        reservations.forEachIndexed { idx, res ->
            if (res.status == ReservationStatus.RESERVED && now.isAfter(res.arrivalDeadlineAt)) {
                reservations[idx] = res.copy(status = ReservationStatus.EXPIRED)
            }
        }
    }
}
