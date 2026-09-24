from datetime import datetime, timedelta
import hashlib
import hmac
import secrets

from fastapi import Depends, Header, HTTPException, status
from sqlmodel import Session, select

from .database import get_session
from .models import UserAccount, UserRole, UserSession, Vehicle

PASSWORD_ITERATIONS = 210_000
SESSION_HOURS = 12


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_text, salt_hex, digest_hex = password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations_text),
        )
    except (ValueError, TypeError):
        return False

    return hmac.compare_digest(digest.hex(), digest_hex)


def create_session_token(session: Session, user: UserAccount) -> tuple[str, UserSession]:
    raw_token = secrets.token_urlsafe(32)
    session_record = UserSession(
        user_id=user.id,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(hours=SESSION_HOURS),
    )
    session.add(session_record)
    session.commit()
    session.refresh(session_record)
    return raw_token, session_record


def get_current_session(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> UserSession:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise _auth_error("Sesion local requerida.")

    raw_token = authorization.split(" ", 1)[1].strip()
    if not raw_token:
        raise _auth_error("Token local invalido.")

    session_record = session.exec(
        select(UserSession).where(UserSession.token_hash == _hash_token(raw_token))
    ).first()

    if not session_record:
        raise _auth_error("Sesion local invalida.")

    now = datetime.utcnow()
    if session_record.revoked_at is not None or session_record.expires_at <= now:
        raise _auth_error("Sesion local vencida.")

    return session_record


def get_current_user(
    auth_session: UserSession = Depends(get_current_session),
    session: Session = Depends(get_session),
) -> UserAccount:
    user = session.get(UserAccount, auth_session.user_id)
    if not user or not user.active:
        raise _auth_error("Usuario local desactivado.")
    return user


def require_admin(user: UserAccount = Depends(get_current_user)) -> UserAccount:
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta accion requiere rol administrador.",
        )
    return user


def require_pilot_or_admin(user: UserAccount = Depends(get_current_user)) -> UserAccount:
    if user.role not in {UserRole.admin, UserRole.pilot}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Rol no autorizado.")
    return user


def require_vehicle_access(session: Session, user: UserAccount, vehicle_id: str) -> Vehicle:
    vehicle = session.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Unidad no encontrada.")

    if user.role == UserRole.admin:
        return vehicle

    if user.role == UserRole.pilot and user.driver_id == vehicle.driver_id:
        return vehicle

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="El piloto solo puede operar su unidad asignada.",
    )


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _auth_error(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )
