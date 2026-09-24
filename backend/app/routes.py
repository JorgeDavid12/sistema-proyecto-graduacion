import calendar
import csv
from datetime import date, datetime, timedelta
from io import StringIO
import secrets

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, func, select

from .analytics import answer_local_question
from .auth import (
    create_session_token,
    get_current_session,
    require_admin,
    require_pilot_or_admin,
    require_vehicle_access,
    verify_password,
)
from .database import get_database_status, get_session
from .models import (
    Alert,
    AttendanceRecord,
    Driver,
    GpsPoint,
    MaintenanceEvent,
    QuotaPayment,
    RouteStop,
    TrackingSession,
    UserAccount,
    UserRole,
    UserSession,
    Vehicle,
    VehicleStatus,
)
from .schemas import (
    AuthUserOut,
    AttendanceRecordCreate,
    DailyClosureOut,
    DatabaseStatusOut,
    DelinquencyReportItemOut,
    DelinquencyReportOut,
    ExternalAIStatusOut,
    GpsPointCreate,
    KpiOut,
    LocalAssistantRequest,
    LocalAssistantResponse,
    LoginRequest,
    LoginResponse,
    MaintenanceReportItemOut,
    MaintenanceReportOut,
    MaintenanceEventCreate,
    MonthlyClosureOut,
    QuotaPaymentCreate,
    QuotaSummaryOut,
    SystemStatusOut,
    TrackingConsentIn,
    TrackingPointCreate,
    TrackingPublicOut,
    TrackingSessionCreate,
    TrackingSessionOut,
    VehicleUpdate,
)

router = APIRouter(prefix="/api")


@router.get("/health", response_model=SystemStatusOut)
def health() -> SystemStatusOut:
    return SystemStatusOut(status="ok", detail="FastAPI backend activo con datos demo locales.")


@router.get("/system/database", response_model=DatabaseStatusOut)
def database_status(_: UserAccount = Depends(require_admin)) -> DatabaseStatusOut:
    return DatabaseStatusOut(**get_database_status())


@router.post("/auth/login", response_model=LoginResponse)
def auth_login(payload: LoginRequest, session: Session = Depends(get_session)) -> LoginResponse:
    username = payload.username.strip().lower()
    user = session.exec(select(UserAccount).where(UserAccount.username == username)).first()

    if not user or not user.active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o clave local incorrectos.")

    token, auth_session = create_session_token(session, user)
    return LoginResponse(
        access_token=token,
        expires_at=auth_session.expires_at.isoformat(),
        user=_auth_user_out(user),
    )


@router.get("/auth/me", response_model=AuthUserOut)
def auth_me(current_user: UserAccount = Depends(require_pilot_or_admin)) -> AuthUserOut:
    return _auth_user_out(current_user)


@router.post("/auth/logout", response_model=SystemStatusOut)
def auth_logout(
    auth_session: UserSession = Depends(get_current_session),
    session: Session = Depends(get_session),
) -> SystemStatusOut:
    auth_session.revoked_at = datetime.utcnow()
    session.add(auth_session)
    session.commit()
    return SystemStatusOut(status="logged_out", detail="Sesion local cerrada.")


@router.get("/dashboard/kpis", response_model=list[KpiOut])
def dashboard_kpis(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> list[KpiOut]:
    active_date = _active_payment_date(session)
    vehicles_total = session.exec(select(func.count()).select_from(Vehicle)).one()
    vehicles_active = session.exec(
        select(func.count()).select_from(Vehicle).where(Vehicle.status != "Mantenimiento")
    ).one()
    alerts_open = session.exec(
        select(func.count()).select_from(Alert).where(Alert.resolved == False)  # noqa: E712
    ).one()
    payments = session.exec(select(QuotaPayment).where(QuotaPayment.payment_date == active_date)).all()
    expected = sum(payment.expected_amount for payment in payments)
    received = sum(payment.received_amount for payment in payments)
    collection_rate = round((received / expected) * 100) if expected else 0

    return [
        KpiOut(label="Recaudacion hoy", value=f"Q {received:,.0f}", trend=f"{collection_rate}%", tone="green"),
        KpiOut(label="Unidades activas", value=f"{vehicles_active} / {vehicles_total}", trend="Operando", tone="cyan"),
        KpiOut(label="Alertas criticas", value=str(alerts_open), trend="Atender", tone="amber"),
        KpiOut(label="Cumplimiento laboral", value="91%", trend="+6%", tone="green"),
    ]


@router.get("/vehicles")
def vehicles(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> list[Vehicle]:
    return session.exec(select(Vehicle).order_by(Vehicle.id)).all()


@router.get("/drivers")
def drivers(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> list[Driver]:
    return session.exec(select(Driver).order_by(Driver.id)).all()


@router.get("/maintenance")
def maintenance(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> list[MaintenanceEvent]:
    return session.exec(select(MaintenanceEvent).order_by(MaintenanceEvent.id)).all()


@router.get("/alerts")
def alerts(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> list[Alert]:
    return session.exec(select(Alert).where(Alert.resolved == False).order_by(Alert.id)).all()  # noqa: E712


@router.get("/routes/demo")
def route_demo(
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_pilot_or_admin),
) -> dict[str, object]:
    require_vehicle_access(session, current_user, "MB-001")
    stops = session.exec(
        select(RouteStop).where(RouteStop.route_code == "cuilapa-oratorio").order_by(RouteStop.sequence)
    ).all()
    latest_point = session.exec(
        select(GpsPoint).where(GpsPoint.vehicle_id == "MB-001").order_by(GpsPoint.recorded_at.desc())
    ).first()
    return {
        "route_code": "cuilapa-oratorio",
        "name": "Cuilapa - Oratorio",
        "vehicle_id": "MB-001",
        "gps_mode": "simulated",
        "latest_point": latest_point,
        "stops": stops,
    }


@router.get("/quotas/summary", response_model=QuotaSummaryOut)
def quota_summary(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> QuotaSummaryOut:
    active_date = _active_payment_date(session)
    payments = session.exec(select(QuotaPayment).where(QuotaPayment.payment_date == active_date)).all()
    expected = sum(payment.expected_amount for payment in payments)
    received = sum(payment.received_amount for payment in payments)
    pending = expected - received
    rate = round((received / expected) * 100, 2) if expected else 0
    return QuotaSummaryOut(
        expected_today=expected,
        received_today=received,
        pending_today=pending,
        collection_rate=rate,
    )


@router.get("/reports/daily", response_model=DailyClosureOut)
def daily_report(
    report_date: date | None = None,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> DailyClosureOut:
    active_date = report_date or _active_payment_date(session)
    return _daily_report(session, active_date)


@router.get("/reports/daily/export")
def export_daily_report(
    report_date: date | None = None,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> Response:
    active_date = report_date or _active_payment_date(session)
    report = _daily_report(session, active_date)
    rows = [
        ["Fecha", report.report_date.isoformat()],
        ["Esperado", report.expected_amount],
        ["Recibido", report.received_amount],
        ["Pendiente", report.pending_amount],
        ["Cobranza %", report.collection_rate],
        ["Cuotas registradas", report.payments_registered],
        ["Cuotas pendientes", report.payments_pending],
        ["Asistencias", report.attendance_total],
        ["Ausencias", report.attendance_absent],
        ["Mantenimientos abiertos", report.maintenance_open],
        ["Alertas abiertas", report.alerts_open],
    ]
    return _csv_response(f"cierre-diario-{active_date.isoformat()}.csv", ["Concepto", "Valor"], rows)


@router.get("/reports/monthly", response_model=MonthlyClosureOut)
def monthly_report(
    year: int | None = None,
    month: int | None = None,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> MonthlyClosureOut:
    today = date.today()
    report_year = year or today.year
    report_month = month or today.month
    return _monthly_report(session, report_year, report_month)


@router.get("/reports/monthly/export")
def export_monthly_report(
    year: int | None = None,
    month: int | None = None,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> Response:
    today = date.today()
    report_year = year or today.year
    report_month = month or today.month
    report = _monthly_report(session, report_year, report_month)
    rows = [
        ["Mes", f"{report.year}-{report.month:02d}"],
        ["Esperado", report.expected_amount],
        ["Recibido", report.received_amount],
        ["Pendiente", report.pending_amount],
        ["Cobranza %", report.collection_rate],
        ["Dias con registro", report.active_days],
        ["Cuotas registradas", report.payments_registered],
        ["Cuotas pendientes", report.payments_pending],
    ]
    return _csv_response(f"cierre-mensual-{report.year}-{report.month:02d}.csv", ["Concepto", "Valor"], rows)


@router.get("/reports/maintenance", response_model=MaintenanceReportOut)
def maintenance_report(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> MaintenanceReportOut:
    return _maintenance_report(session)


@router.get("/reports/maintenance/export")
def export_maintenance_report(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> Response:
    report = _maintenance_report(session)
    rows = [
        [
            item.id,
            item.vehicle_id,
            item.task,
            item.due_label,
            item.risk,
            item.cost_estimate,
            "Completado" if item.completed else "Abierto",
        ]
        for item in report.items
    ]
    return _csv_response(
        "reporte-mantenimiento.csv",
        ["ID", "Unidad", "Trabajo", "Vence", "Riesgo", "Costo estimado", "Estado"],
        rows,
    )


@router.get("/reports/delinquency", response_model=DelinquencyReportOut)
def delinquency_report(
    report_date: date | None = None,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> DelinquencyReportOut:
    active_date = report_date or _active_payment_date(session)
    return _delinquency_report(session, active_date)


@router.get("/reports/delinquency/export")
def export_delinquency_report(
    report_date: date | None = None,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> Response:
    active_date = report_date or _active_payment_date(session)
    report = _delinquency_report(session, active_date)
    rows = [
        [
            item.payment_date.isoformat(),
            item.vehicle_id,
            item.driver_name,
            item.expected_amount,
            item.received_amount,
            item.pending_amount,
            item.days_overdue,
            item.status,
        ]
        for item in report.items
    ]
    return _csv_response(
        f"morosidad-{active_date.isoformat()}.csv",
        ["Fecha", "Unidad", "Piloto", "Esperado", "Recibido", "Pendiente", "Dias mora", "Estado"],
        rows,
    )


@router.post("/quotas/payments", response_model=QuotaPayment)
def create_quota_payment(
    payload: QuotaPaymentCreate,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> QuotaPayment:
    _require_vehicle(session, payload.vehicle_id)
    _require_driver(session, payload.driver_id)

    status = "Registrada" if payload.received_amount >= payload.expected_amount else "Pendiente"
    payment = QuotaPayment(
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        payment_date=payload.payment_date or date.today(),
        expected_amount=payload.expected_amount,
        received_amount=payload.received_amount,
        status=status,
    )
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


@router.post("/maintenance", response_model=MaintenanceEvent)
def create_maintenance(
    payload: MaintenanceEventCreate,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> MaintenanceEvent:
    _require_vehicle(session, payload.vehicle_id)
    event = MaintenanceEvent(
        vehicle_id=payload.vehicle_id,
        task=payload.task,
        due_label=payload.due_label,
        risk=payload.risk,
        cost_estimate=payload.cost_estimate,
        completed=False,
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.patch("/maintenance/{event_id}/complete", response_model=MaintenanceEvent)
def complete_maintenance(
    event_id: int,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> MaintenanceEvent:
    event = session.get(MaintenanceEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado.")

    event.completed = True
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.post("/attendance", response_model=AttendanceRecord)
def create_attendance(
    payload: AttendanceRecordCreate,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> AttendanceRecord:
    _require_driver(session, payload.driver_id)
    record = AttendanceRecord(
        driver_id=payload.driver_id,
        work_date=payload.work_date or date.today(),
        status=payload.status,
        notes=payload.notes,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


@router.patch("/vehicles/{vehicle_id}", response_model=Vehicle)
def update_vehicle(
    vehicle_id: str,
    payload: VehicleUpdate,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> Vehicle:
    vehicle = _require_vehicle(session, vehicle_id)
    data = payload.model_dump(exclude_unset=True)

    if "driver_id" in data and data["driver_id"] is not None:
        _require_driver(session, data["driver_id"])

    if "status" in data and data["status"] is not None:
        try:
            data["status"] = VehicleStatus(data["status"])
        except ValueError as exc:
            allowed = ", ".join(status.value for status in VehicleStatus)
            raise HTTPException(status_code=400, detail=f"Estado invalido. Permitidos: {allowed}") from exc

    for field, value in data.items():
        setattr(vehicle, field, value)

    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


def _active_payment_date(session: Session) -> date:
    today = date.today()
    today_payment = session.exec(
        select(QuotaPayment).where(QuotaPayment.payment_date == today)
    ).first()
    if today_payment:
        return today

    latest = session.exec(select(QuotaPayment.payment_date).order_by(QuotaPayment.payment_date.desc())).first()
    return latest or today


def _require_vehicle(session: Session, vehicle_id: str) -> Vehicle:
    vehicle = session.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Unidad no encontrada.")
    return vehicle


def _require_driver(session: Session, driver_id: int) -> Driver:
    driver = session.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Piloto no encontrado.")
    return driver


def _auth_user_out(user: UserAccount) -> AuthUserOut:
    role = user.role.value if isinstance(user.role, UserRole) else str(user.role)
    return AuthUserOut(
        username=user.username,
        display_name=user.display_name,
        role=role,
        driver_id=user.driver_id,
    )


def _daily_report(session: Session, report_date: date) -> DailyClosureOut:
    payments = session.exec(select(QuotaPayment).where(QuotaPayment.payment_date == report_date)).all()
    attendance = session.exec(select(AttendanceRecord).where(AttendanceRecord.work_date == report_date)).all()
    expected = sum(payment.expected_amount for payment in payments)
    received = sum(payment.received_amount for payment in payments)
    pending = expected - received
    pending_count = sum(1 for payment in payments if payment.received_amount < payment.expected_amount)
    absent_count = sum(1 for record in attendance if record.status == "Ausente")
    maintenance_open = session.exec(
        select(func.count()).select_from(MaintenanceEvent).where(MaintenanceEvent.completed == False)  # noqa: E712
    ).one()
    alerts_open = session.exec(
        select(func.count()).select_from(Alert).where(Alert.resolved == False)  # noqa: E712
    ).one()

    return DailyClosureOut(
        report_date=report_date,
        expected_amount=expected,
        received_amount=received,
        pending_amount=pending,
        collection_rate=round((received / expected) * 100, 2) if expected else 0,
        payments_registered=len(payments),
        payments_pending=pending_count,
        attendance_total=len(attendance),
        attendance_absent=absent_count,
        maintenance_open=maintenance_open,
        alerts_open=alerts_open,
    )


def _monthly_report(session: Session, year: int, month: int) -> MonthlyClosureOut:
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Mes invalido.")

    start = date(year, month, 1)
    end = date(year, month, calendar.monthrange(year, month)[1])
    payments = session.exec(
        select(QuotaPayment).where(
            QuotaPayment.payment_date >= start,
            QuotaPayment.payment_date <= end,
        )
    ).all()
    expected = sum(payment.expected_amount for payment in payments)
    received = sum(payment.received_amount for payment in payments)
    pending = expected - received
    active_days = len({payment.payment_date for payment in payments})
    pending_count = sum(1 for payment in payments if payment.received_amount < payment.expected_amount)

    return MonthlyClosureOut(
        year=year,
        month=month,
        expected_amount=expected,
        received_amount=received,
        pending_amount=pending,
        collection_rate=round((received / expected) * 100, 2) if expected else 0,
        active_days=active_days,
        payments_registered=len(payments),
        payments_pending=pending_count,
    )


def _maintenance_report(session: Session) -> MaintenanceReportOut:
    events = session.exec(select(MaintenanceEvent).order_by(MaintenanceEvent.completed, MaintenanceEvent.id)).all()
    open_events = [event for event in events if not event.completed]
    completed_events = [event for event in events if event.completed]
    items = [
        MaintenanceReportItemOut(
            id=event.id,
            vehicle_id=event.vehicle_id,
            task=event.task,
            due_label=event.due_label,
            risk=event.risk,
            cost_estimate=event.cost_estimate,
            completed=event.completed,
        )
        for event in events
    ]

    return MaintenanceReportOut(
        total_events=len(events),
        open_events=len(open_events),
        completed_events=len(completed_events),
        high_risk_open=sum(1 for event in open_events if event.risk == "Alta"),
        estimated_open_cost=sum(event.cost_estimate for event in open_events),
        items=items,
    )


def _delinquency_report(session: Session, report_date: date) -> DelinquencyReportOut:
    payments = session.exec(select(QuotaPayment).where(QuotaPayment.payment_date == report_date)).all()
    drivers = {driver.id: driver for driver in session.exec(select(Driver)).all()}
    today = date.today()
    items = []

    for payment in payments:
        pending = payment.expected_amount - payment.received_amount
        if pending <= 0:
            continue

        driver = drivers.get(payment.driver_id)
        items.append(
            DelinquencyReportItemOut(
                vehicle_id=payment.vehicle_id,
                driver_name=driver.name if driver else "Sin piloto",
                payment_date=payment.payment_date,
                expected_amount=payment.expected_amount,
                received_amount=payment.received_amount,
                pending_amount=pending,
                days_overdue=max((today - payment.payment_date).days, 0),
                status=payment.status,
            )
        )

    return DelinquencyReportOut(
        report_date=report_date,
        pending_total=sum(item.pending_amount for item in items),
        pending_count=len(items),
        items=items,
    )


def _csv_response(filename: str, headers: list[str], rows: list[list[object]]) -> Response:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _require_tracking_session(session: Session, token: str) -> TrackingSession:
    tracking = session.exec(select(TrackingSession).where(TrackingSession.token == token)).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="Jornada GPS no encontrada.")
    return tracking


def _ensure_tracking_active(tracking: TrackingSession) -> None:
    if tracking.revoked_at is not None:
        raise HTTPException(status_code=403, detail="Jornada GPS revocada.")
    if tracking.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=403, detail="Jornada GPS vencida.")


def _tracking_session_out(session: Session, tracking: TrackingSession) -> TrackingSessionOut:
    driver = session.get(Driver, tracking.driver_id) if tracking.driver_id else None
    return TrackingSessionOut(
        id=tracking.id,
        token=tracking.token,
        vehicle_id=tracking.vehicle_id,
        driver_id=tracking.driver_id,
        driver_name=driver.name if driver else None,
        session_date=tracking.session_date,
        expires_at=tracking.expires_at,
        consent_at=tracking.consent_at,
        revoked_at=tracking.revoked_at,
        is_active=_tracking_is_active(tracking),
        public_url=f"/jornada/{tracking.token}",
    )


def _tracking_public_out(session: Session, tracking: TrackingSession) -> TrackingPublicOut:
    driver = session.get(Driver, tracking.driver_id) if tracking.driver_id else None
    return TrackingPublicOut(
        token=tracking.token,
        vehicle_id=tracking.vehicle_id,
        driver_name=driver.name if driver else "Piloto asignado",
        session_date=tracking.session_date,
        expires_at=tracking.expires_at,
        consent_at=tracking.consent_at,
        is_active=_tracking_is_active(tracking),
        can_send_gps=_tracking_is_active(tracking) and tracking.consent_at is not None,
        route_name="Cuilapa - Oratorio",
    )


def _tracking_is_active(tracking: TrackingSession) -> bool:
    return tracking.revoked_at is None and tracking.expires_at > datetime.utcnow()


def _external_ai_status() -> ExternalAIStatusOut:
    from .settings import get_settings

    current_settings = get_settings()
    enabled = current_settings.ai_external_enabled
    provider = current_settings.ai_provider.strip() or None
    model = current_settings.ai_model.strip() or None
    has_key = current_settings.has_ai_api_key
    cost_acknowledged = current_settings.ai_cost_acknowledged
    ready = bool(enabled and provider and model and has_key and cost_acknowledged)

    if ready:
        detail = "IA externa autorizada por configuracion local. Falta implementar el conector del proveedor elegido."
        status = "ready"
    else:
        missing = []
        if not enabled:
            missing.append("AI_EXTERNAL_ENABLED=true")
        if not provider:
            missing.append("AI_PROVIDER")
        if not model:
            missing.append("AI_MODEL")
        if not has_key:
            missing.append("AI_API_KEY")
        if not cost_acknowledged:
            missing.append("AI_COST_ACKNOWLEDGED=true")
        detail = "IA externa bloqueada. Falta: " + ", ".join(missing)
        status = "blocked"

    return ExternalAIStatusOut(
        status=status,
        enabled=enabled,
        provider=provider,
        model=model,
        has_api_key=has_key,
        cost_acknowledged=cost_acknowledged,
        ready=ready,
        detail=detail,
    )


@router.get("/ai/status", response_model=SystemStatusOut)
def ai_status() -> SystemStatusOut:
    # Este endpoint confirma que NO hay Gemini ni IA externa.
    # El endpoint /api/assistant/local-query usa reglas locales gratuitas.
    return SystemStatusOut(
        status="local_only",
        detail="La IA externa esta deshabilitada. Solo existe analisis local bajo demanda.",
    )


@router.get("/ai/external/status", response_model=ExternalAIStatusOut)
def external_ai_status(_: UserAccount = Depends(require_admin)) -> ExternalAIStatusOut:
    return _external_ai_status()


@router.post("/ai/external-query", response_model=LocalAssistantResponse)
def external_ai_query(
    payload: LocalAssistantRequest,
    _: UserAccount = Depends(require_admin),
) -> LocalAssistantResponse:
    status = _external_ai_status()
    if not status.ready:
        raise HTTPException(status_code=403, detail=status.detail)

    raise HTTPException(
        status_code=501,
        detail="Proveedor externo autorizado, pero el conector real aun no esta implementado.",
    )


@router.post("/assistant/local-query", response_model=LocalAssistantResponse)
def local_assistant(
    payload: LocalAssistantRequest,
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> LocalAssistantResponse:
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacia.")

    return answer_local_question(payload.question, session)


@router.get("/gps/status", response_model=SystemStatusOut)
def gps_status() -> SystemStatusOut:
    return SystemStatusOut(
        status="consent_required",
        detail="GPS real es opcional: requiere token de jornada, consentimiento y contexto seguro.",
    )


@router.post("/tracking/sessions", response_model=TrackingSessionOut)
def create_tracking_session(
    payload: TrackingSessionCreate,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_admin),
) -> TrackingSessionOut:
    vehicle = _require_vehicle(session, payload.vehicle_id)
    driver_id = payload.driver_id if payload.driver_id is not None else vehicle.driver_id

    if driver_id is not None:
        _require_driver(session, driver_id)

    expires_hours = min(max(payload.expires_hours, 1), 24)
    tracking = TrackingSession(
        token=secrets.token_urlsafe(24),
        vehicle_id=vehicle.id,
        driver_id=driver_id,
        session_date=payload.session_date or date.today(),
        expires_at=datetime.utcnow() + timedelta(hours=expires_hours),
        created_by_user_id=current_user.id,
    )
    session.add(tracking)
    session.commit()
    session.refresh(tracking)
    return _tracking_session_out(session, tracking)


@router.get("/tracking/sessions", response_model=list[TrackingSessionOut])
def tracking_sessions(
    session: Session = Depends(get_session),
    _: UserAccount = Depends(require_admin),
) -> list[TrackingSessionOut]:
    sessions = session.exec(select(TrackingSession).order_by(TrackingSession.created_at.desc())).all()
    return [_tracking_session_out(session, item) for item in sessions]


@router.get("/public/tracking/{token}", response_model=TrackingPublicOut)
def public_tracking_session(token: str, session: Session = Depends(get_session)) -> TrackingPublicOut:
    tracking = _require_tracking_session(session, token)
    return _tracking_public_out(session, tracking)


@router.post("/public/tracking/{token}/consent", response_model=TrackingPublicOut)
def accept_tracking_consent(
    token: str,
    payload: TrackingConsentIn,
    session: Session = Depends(get_session),
) -> TrackingPublicOut:
    tracking = _require_tracking_session(session, token)
    _ensure_tracking_active(tracking)

    if not payload.accepted:
        raise HTTPException(status_code=400, detail="El consentimiento es obligatorio para GPS real.")

    tracking.consent_at = datetime.utcnow()
    tracking.consent_name = payload.consent_name.strip() or "Piloto"
    session.add(tracking)
    session.commit()
    session.refresh(tracking)
    return _tracking_public_out(session, tracking)


@router.post("/public/tracking/{token}/points", response_model=GpsPoint)
def create_tracking_point(
    token: str,
    payload: TrackingPointCreate,
    session: Session = Depends(get_session),
) -> GpsPoint:
    tracking = _require_tracking_session(session, token)
    _ensure_tracking_active(tracking)

    if tracking.consent_at is None:
        raise HTTPException(status_code=403, detail="Primero se requiere consentimiento del piloto.")

    if not payload.simulated and not payload.secure_context:
        raise HTTPException(status_code=403, detail="GPS real requiere HTTPS o localhost seguro.")

    point = GpsPoint(
        vehicle_id=tracking.vehicle_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_kmh=payload.speed_kmh,
        simulated=payload.simulated,
    )
    session.add(point)
    session.commit()
    session.refresh(point)
    return point


@router.post("/gps/points", response_model=GpsPoint)
def create_gps_point(
    payload: GpsPointCreate,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_pilot_or_admin),
) -> GpsPoint:
    require_vehicle_access(session, current_user, payload.vehicle_id)

    point = GpsPoint(
        vehicle_id=payload.vehicle_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_kmh=payload.speed_kmh,
        simulated=payload.simulated,
    )
    session.add(point)
    session.commit()
    session.refresh(point)
    return point


@router.get("/gps/latest/{vehicle_id}", response_model=GpsPoint | None)
def latest_gps_point(
    vehicle_id: str,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_pilot_or_admin),
) -> GpsPoint | None:
    require_vehicle_access(session, current_user, vehicle_id)
    return session.exec(
        select(GpsPoint).where(GpsPoint.vehicle_id == vehicle_id).order_by(GpsPoint.recorded_at.desc())
    ).first()
