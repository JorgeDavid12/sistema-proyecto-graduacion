from datetime import date, datetime

from pydantic import BaseModel


class KpiOut(BaseModel):
    label: str
    value: str
    trend: str
    tone: str


class QuotaSummaryOut(BaseModel):
    expected_today: float
    received_today: float
    pending_today: float
    collection_rate: float


class DailyClosureOut(BaseModel):
    report_date: date
    expected_amount: float
    received_amount: float
    pending_amount: float
    collection_rate: float
    payments_registered: int
    payments_pending: int
    attendance_total: int
    attendance_absent: int
    maintenance_open: int
    alerts_open: int


class MonthlyClosureOut(BaseModel):
    year: int
    month: int
    expected_amount: float
    received_amount: float
    pending_amount: float
    collection_rate: float
    active_days: int
    payments_registered: int
    payments_pending: int


class MaintenanceReportItemOut(BaseModel):
    id: int | None
    vehicle_id: str
    task: str
    due_label: str
    risk: str
    cost_estimate: float
    completed: bool


class MaintenanceReportOut(BaseModel):
    total_events: int
    open_events: int
    completed_events: int
    high_risk_open: int
    estimated_open_cost: float
    items: list[MaintenanceReportItemOut]


class DelinquencyReportItemOut(BaseModel):
    vehicle_id: str
    driver_name: str
    payment_date: date
    expected_amount: float
    received_amount: float
    pending_amount: float
    days_overdue: int
    status: str


class DelinquencyReportOut(BaseModel):
    report_date: date
    pending_total: float
    pending_count: int
    items: list[DelinquencyReportItemOut]


class SystemStatusOut(BaseModel):
    status: str
    detail: str
    phase: str = "Fase 10"


class DatabaseStatusOut(BaseModel):
    status: str
    engine: str
    driver: str
    database: str
    host: str
    port: int | None = None
    is_postgresql: bool
    is_sqlite: bool
    detail: str


class ExternalAIStatusOut(BaseModel):
    status: str
    enabled: bool
    provider: str | None = None
    model: str | None = None
    has_api_key: bool
    cost_acknowledged: bool
    ready: bool
    detail: str


class AuthUserOut(BaseModel):
    username: str
    display_name: str
    role: str
    driver_id: int | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: str
    user: AuthUserOut


class LocalAssistantRequest(BaseModel):
    question: str


class LocalAssistantResponse(BaseModel):
    mode: str = "local_rules"
    matched_topic: str
    answer: str
    insights: list[str]
    suggested_actions: list[str]


class GpsPointCreate(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    speed_kmh: float = 0
    simulated: bool = True


class TrackingSessionCreate(BaseModel):
    vehicle_id: str
    driver_id: int | None = None
    session_date: date | None = None
    expires_hours: int = 12


class TrackingSessionOut(BaseModel):
    id: int | None
    token: str
    vehicle_id: str
    driver_id: int | None = None
    driver_name: str | None = None
    session_date: date
    expires_at: datetime
    consent_at: datetime | None = None
    revoked_at: datetime | None = None
    is_active: bool
    public_url: str


class TrackingPublicOut(BaseModel):
    token: str
    vehicle_id: str
    driver_name: str
    session_date: date
    expires_at: datetime
    consent_at: datetime | None = None
    is_active: bool
    can_send_gps: bool
    route_name: str


class TrackingConsentIn(BaseModel):
    accepted: bool
    consent_name: str


class TrackingPointCreate(BaseModel):
    latitude: float
    longitude: float
    speed_kmh: float = 0
    accuracy_m: float | None = None
    simulated: bool = False
    secure_context: bool = False


class QuotaPaymentCreate(BaseModel):
    vehicle_id: str
    driver_id: int
    payment_date: date | None = None
    expected_amount: float
    received_amount: float


class MaintenanceEventCreate(BaseModel):
    vehicle_id: str
    task: str
    due_label: str
    risk: str
    cost_estimate: float = 0


class AttendanceRecordCreate(BaseModel):
    driver_id: int
    work_date: date | None = None
    status: str
    notes: str | None = None


class VehicleUpdate(BaseModel):
    km: int | None = None
    health: int | None = None
    status: str | None = None
    next_service: str | None = None
    driver_id: int | None = None
