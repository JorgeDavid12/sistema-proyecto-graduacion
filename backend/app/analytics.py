from datetime import date

from sqlmodel import Session, select

from .models import Alert, AlertLevel, Driver, MaintenanceEvent, QuotaPayment, Vehicle
from .schemas import LocalAssistantResponse


def answer_local_question(question: str, session: Session) -> LocalAssistantResponse:
    normalized = question.lower().strip()

    if any(word in normalized for word in ["mantenimiento", "aceite", "fren", "servicio"]):
        return _maintenance_answer(session)

    if any(word in normalized for word in ["cuota", "recaud", "moros", "pago", "dinero"]):
        return _quota_answer(session)

    if any(word in normalized for word in ["piloto", "asistencia", "ausencia", "personal"]):
        return _people_answer(session)

    if any(word in normalized for word in ["ruta", "gps", "microbus", "oratorio", "cuilapa"]):
        return _route_answer(session)

    return LocalAssistantResponse(
        matched_topic="resumen",
        answer="El sistema local identifica mantenimiento, cuotas, asistencia y ruta como los ejes principales del proyecto.",
        insights=[
            "La API usa reglas locales, no Gemini ni servicios externos.",
            "Los calculos se realizan solo cuando llamas este endpoint.",
            "La informacion proviene de la base demo local.",
        ],
        suggested_actions=[
            "Consulta mantenimiento para priorizar servicios.",
            "Consulta cuotas para revisar saldos del dia.",
            "Consulta ruta para revisar el estado del microbus.",
        ],
    )


def _maintenance_answer(session: Session) -> LocalAssistantResponse:
    items = session.exec(select(MaintenanceEvent).where(MaintenanceEvent.completed == False)).all()  # noqa: E712
    high_risk = [item for item in items if item.risk.lower() == "alta"]
    total_cost = sum(item.cost_estimate for item in items)

    return LocalAssistantResponse(
        matched_topic="mantenimiento",
        answer=f"Hay {len(items)} servicios pendientes y {len(high_risk)} requiere atencion alta. El costo estimado preventivo es Q {total_cost:,.0f}.",
        insights=[
            f"{item.vehicle_id}: {item.task} ({item.due_label}, riesgo {item.risk})."
            for item in items[:4]
        ],
        suggested_actions=[
            "Atender primero las unidades con riesgo alto.",
            "Registrar cada servicio completado para mejorar predicciones futuras.",
            "Comparar costos preventivos contra reparaciones correctivas.",
        ],
    )


def _quota_answer(session: Session) -> LocalAssistantResponse:
    payment_date = _active_payment_date(session)
    payments = session.exec(select(QuotaPayment).where(QuotaPayment.payment_date == payment_date)).all()
    expected = sum(payment.expected_amount for payment in payments)
    received = sum(payment.received_amount for payment in payments)
    pending = expected - received
    pending_items = [payment for payment in payments if payment.received_amount < payment.expected_amount]
    rate = round((received / expected) * 100, 2) if expected else 0

    return LocalAssistantResponse(
        matched_topic="cuotas",
        answer=f"La recaudacion del dia demo {payment_date.isoformat()} va en Q {received:,.0f} de Q {expected:,.0f}, con Q {pending:,.0f} pendientes ({rate}%).",
        insights=[
            f"{payment.vehicle_id}: pendiente Q {payment.expected_amount - payment.received_amount:,.0f}."
            for payment in pending_items
        ]
        or ["No hay cuotas pendientes registradas para hoy."],
        suggested_actions=[
            "Priorizar cobro de unidades pendientes antes del cierre.",
            "Validar si el pendiente corresponde a ausencia, taller o falta de pago.",
            "Usar el cierre diario para alimentar reportes mensuales.",
        ],
    )


def _active_payment_date(session: Session) -> date:
    today = date.today()
    today_payment = session.exec(
        select(QuotaPayment).where(QuotaPayment.payment_date == today)
    ).first()
    if today_payment:
        return today

    latest = session.exec(select(QuotaPayment.payment_date).order_by(QuotaPayment.payment_date.desc())).first()
    return latest or today


def _people_answer(session: Session) -> LocalAssistantResponse:
    drivers = session.exec(select(Driver).order_by(Driver.compliance_rate)).all()
    weakest = drivers[:3]
    average = round(sum(driver.compliance_rate for driver in drivers) / len(drivers), 2) if drivers else 0

    return LocalAssistantResponse(
        matched_topic="personal",
        answer=f"El cumplimiento promedio del personal demo es {average}%. Los casos con menor cumplimiento deben revisarse primero.",
        insights=[
            f"{driver.name}: {driver.compliance_rate}% de cumplimiento, {driver.absences_month} ausencias este mes."
            for driver in weakest
        ],
        suggested_actions=[
            "Revisar ausencias injustificadas antes de liquidar cuotas.",
            "Definir regla visible para descansos semanales.",
            "Mantener historial auditable por piloto.",
        ],
    )


def _route_answer(session: Session) -> LocalAssistantResponse:
    microbus = session.get(Vehicle, "MB-001")
    alerts = session.exec(
        select(Alert).where(Alert.level == AlertLevel.logistics, Alert.resolved == False)  # noqa: E712
    ).all()

    return LocalAssistantResponse(
        matched_topic="ruta",
        answer="La ruta Cuilapa-Oratorio se mantiene en modo demo. No hay GPS real activo ni consumo en segundo plano.",
        insights=[
            f"Unidad {microbus.id}: {microbus.status}, salud {microbus.health}%."
            if microbus
            else "Microbus demo no encontrado.",
            *[f"Alerta: {alert.title}." for alert in alerts],
        ],
        suggested_actions=[
            "Usar tokens temporales cuando se implemente rastreo real.",
            "No activar ubicacion fuera de la jornada laboral.",
            "Guardar solo puntos necesarios para auditoria de ruta.",
        ],
    )
