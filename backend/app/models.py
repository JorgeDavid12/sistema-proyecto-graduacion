from datetime import date, datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    admin = "administrador"
    pilot = "piloto"


class VehicleStatus(str, Enum):
    operative = "Operativa"
    alert = "Alerta"
    maintenance = "Mantenimiento"
    on_route = "En ruta"


class AlertLevel(str, Enum):
    finance = "Finanzas"
    maintenance = "Mantenimiento"
    logistics = "Logistica"
    people = "Personal"


class Vehicle(SQLModel, table=True):
    id: str = Field(primary_key=True)
    line: str
    type: str
    status: VehicleStatus
    km: int
    health: int
    next_service: str
    daily_quota: float = 0
    driver_id: int | None = Field(default=None, foreign_key="driver.id")


class Driver(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    phone: str | None = None
    role: str = "Piloto"
    compliance_rate: float = 0
    absences_month: int = 0


class UserAccount(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    display_name: str
    role: UserRole = Field(default=UserRole.pilot, index=True)
    password_hash: str
    driver_id: int | None = Field(default=None, foreign_key="driver.id")
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserSession(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="useraccount.id", index=True)
    token_hash: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    revoked_at: datetime | None = None


class QuotaPayment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    vehicle_id: str = Field(foreign_key="vehicle.id")
    driver_id: int = Field(foreign_key="driver.id")
    payment_date: date
    expected_amount: float
    received_amount: float
    status: str


class MaintenanceEvent(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    vehicle_id: str = Field(foreign_key="vehicle.id")
    task: str
    due_label: str
    risk: str
    cost_estimate: float = 0
    completed: bool = False


class AttendanceRecord(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    driver_id: int = Field(foreign_key="driver.id")
    work_date: date
    status: str
    notes: str | None = None


class RouteStop(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    route_code: str
    name: str
    scheduled_time: str
    state: str
    sequence: int


class GpsPoint(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    vehicle_id: str = Field(foreign_key="vehicle.id")
    latitude: float
    longitude: float
    speed_kmh: float
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    simulated: bool = True


class TrackingSession(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True)
    vehicle_id: str = Field(foreign_key="vehicle.id", index=True)
    driver_id: int | None = Field(default=None, foreign_key="driver.id")
    session_date: date
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    consent_at: datetime | None = None
    consent_name: str | None = None
    revoked_at: datetime | None = None
    created_by_user_id: int | None = Field(default=None, foreign_key="useraccount.id")


class Alert(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    detail: str
    level: AlertLevel
    resolved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
