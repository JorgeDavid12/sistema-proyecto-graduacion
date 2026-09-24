from collections.abc import Generator

from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlmodel import Session, SQLModel, create_engine

from .settings import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def get_database_status() -> dict[str, object]:
    url = make_url(settings.database_url)
    driver = url.drivername
    engine_name = "postgresql" if driver.startswith("postgresql") else "sqlite"

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "connected",
        "engine": engine_name,
        "driver": driver,
        "database": url.database or "",
        "host": url.host or "local",
        "port": url.port,
        "is_postgresql": engine_name == "postgresql",
        "is_sqlite": engine_name == "sqlite",
        "detail": _database_detail(engine_name),
    }


def _database_detail(engine_name: str) -> str:
    if engine_name == "postgresql":
        return "PostgreSQL configurado desde DATABASE_URL."
    return "SQLite local activo. PostgreSQL sigue opcional hasta configurar DATABASE_URL."
