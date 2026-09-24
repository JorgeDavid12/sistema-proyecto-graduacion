from datetime import date

from sqlmodel import Session, select

from .auth import hash_password
from .models import (
    Alert,
    AlertLevel,
    AttendanceRecord,
    Driver,
    GpsPoint,
    MaintenanceEvent,
    QuotaPayment,
    RouteStop,
    UserAccount,
    UserRole,
    Vehicle,
    VehicleStatus,
)


def seed_if_empty(session: Session) -> None:
    has_vehicles = session.exec(select(Vehicle)).first()
    if has_vehicles:
        seed_auth_users(session)
        return

    drivers = [
        Driver(id=1, name="Carlos Mendez", phone="5550-1001", compliance_rate=96, absences_month=0),
        Driver(id=2, name="Luis Garcia", phone="5550-1002", compliance_rate=78, absences_month=2),
        Driver(id=3, name="Mario Lopez", phone="5550-1003", compliance_rate=93, absences_month=1),
        Driver(id=4, name="Edwin Perez", phone="5550-1004", compliance_rate=71, absences_month=3),
        Driver(id=5, name="Victor Santos", phone="5550-1005", compliance_rate=98, absences_month=0),
        Driver(id=6, name="Ruben Castillo", phone="5550-1006", compliance_rate=88, absences_month=1),
    ]
    session.add_all(drivers)
    seed_auth_users(session)

    vehicles = [
        Vehicle(
            id="MT-006",
            line="Linea 6",
            type="Mototaxi",
            driver_id=1,
            status=VehicleStatus.operative,
            km=68420,
            daily_quota=125,
            health=91,
            next_service="Cambio de aceite en 6 dias",
        ),
        Vehicle(
            id="MT-079",
            line="Linea 79",
            type="Mototaxi",
            driver_id=2,
            status=VehicleStatus.alert,
            km=72110,
            daily_quota=125,
            health=62,
            next_service="Frenos requieren revision",
        ),
        Vehicle(
            id="MT-094",
            line="Linea 94",
            type="Mototaxi",
            driver_id=3,
            status=VehicleStatus.operative,
            km=59180,
            daily_quota=125,
            health=86,
            next_service="Servicio general en 12 dias",
        ),
        Vehicle(
            id="MT-112",
            line="Linea 112",
            type="Mototaxi",
            driver_id=4,
            status=VehicleStatus.maintenance,
            km=80450,
            daily_quota=125,
            health=48,
            next_service="Tren delantero en taller",
        ),
        Vehicle(
            id="MT-117",
            line="Linea 117",
            type="Mototaxi",
            driver_id=5,
            status=VehicleStatus.operative,
            km=53670,
            daily_quota=125,
            health=94,
            next_service="Sin alertas criticas",
        ),
        Vehicle(
            id="MB-001",
            line="Cuilapa-Oratorio",
            type="Microbus",
            driver_id=6,
            status=VehicleStatus.on_route,
            km=143890,
            daily_quota=0,
            health=78,
            next_service="Llantas y aceite en 9 dias",
        ),
    ]
    session.add_all(vehicles)

    today = date.today()
    payments = [
        QuotaPayment(vehicle_id="MT-006", driver_id=1, payment_date=today, expected_amount=125, received_amount=125, status="Registrada"),
        QuotaPayment(vehicle_id="MT-079", driver_id=2, payment_date=today, expected_amount=125, received_amount=0, status="Pendiente"),
        QuotaPayment(vehicle_id="MT-094", driver_id=3, payment_date=today, expected_amount=125, received_amount=125, status="Registrada"),
        QuotaPayment(vehicle_id="MT-112", driver_id=4, payment_date=today, expected_amount=125, received_amount=0, status="Pendiente"),
        QuotaPayment(vehicle_id="MT-117", driver_id=5, payment_date=today, expected_amount=125, received_amount=125, status="Registrada"),
    ]
    session.add_all(payments)

    maintenance = [
        MaintenanceEvent(vehicle_id="MT-079", task="Revision de frenos", due_label="Hoy", risk="Alta", cost_estimate=450),
        MaintenanceEvent(vehicle_id="MT-006", task="Cambio de aceite", due_label="6 dias", risk="Media", cost_estimate=180),
        MaintenanceEvent(vehicle_id="MB-001", task="Rotacion de llantas", due_label="9 dias", risk="Media", cost_estimate=300),
        MaintenanceEvent(vehicle_id="MT-094", task="Servicio general", due_label="12 dias", risk="Baja", cost_estimate=250),
    ]
    session.add_all(maintenance)

    attendance = [
        AttendanceRecord(driver_id=1, work_date=today, status="Presente"),
        AttendanceRecord(driver_id=2, work_date=today, status="Presente"),
        AttendanceRecord(driver_id=3, work_date=today, status="Presente"),
        AttendanceRecord(driver_id=4, work_date=today, status="Ausente", notes="Unidad en taller"),
        AttendanceRecord(driver_id=5, work_date=today, status="Presente"),
        AttendanceRecord(driver_id=6, work_date=today, status="En ruta"),
    ]
    session.add_all(attendance)

    stops = [
        RouteStop(route_code="cuilapa-oratorio", name="Cuilapa", scheduled_time="06:00", state="Completado", sequence=1),
        RouteStop(route_code="cuilapa-oratorio", name="Barberena", scheduled_time="06:32", state="Completado", sequence=2),
        RouteStop(route_code="cuilapa-oratorio", name="El Cerinal", scheduled_time="07:04", state="En curso", sequence=3),
        RouteStop(route_code="cuilapa-oratorio", name="Oratorio", scheduled_time="07:42", state="Pendiente", sequence=4),
    ]
    session.add_all(stops)

    session.add(
        GpsPoint(
            vehicle_id="MB-001",
            latitude=14.1914,
            longitude=-90.3746,
            speed_kmh=58,
            simulated=True,
        )
    )

    alerts = [
        Alert(
            title="Linea 79 sin cuota registrada",
            detail="El piloto asignado no ha completado la cuota diaria.",
            level=AlertLevel.finance,
        ),
        Alert(
            title="Linea 112 fuera de servicio",
            detail="Unidad en mantenimiento por tren delantero.",
            level=AlertLevel.maintenance,
        ),
        Alert(
            title="Microbus con demora de 8 min",
            detail="La ruta demo registra atraso en punto Barberena.",
            level=AlertLevel.logistics,
        ),
    ]
    session.add_all(alerts)
    session.commit()


def seed_auth_users(session: Session) -> None:
    defaults = [
        UserAccount(
            username="admin",
            display_name="Administrador local",
            role=UserRole.admin,
            password_hash=hash_password("admin123"),
        ),
        UserAccount(
            username="piloto",
            display_name="Ruben Castillo",
            role=UserRole.pilot,
            password_hash=hash_password("piloto123"),
            driver_id=6,
        ),
    ]

    created = False
    for user in defaults:
        exists = session.exec(select(UserAccount).where(UserAccount.username == user.username)).first()
        if not exists:
            session.add(user)
            created = True

    if created:
        session.commit()
