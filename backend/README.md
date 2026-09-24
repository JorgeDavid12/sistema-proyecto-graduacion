# Backend Fase 2 - Mototaxi David

API base con FastAPI, SQLModel y persistencia local. Por defecto usa SQLite para
desarrollo inmediato. Si defines `DATABASE_URL` con PostgreSQL, la misma capa de
modelos queda lista para migrar a PostgreSQL en una fase posterior.

## Ejecutar

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend\requirements.txt
.\.venv\Scripts\python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

## Endpoints principales

- `GET /api/health`
- `GET /api/system/database`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/dashboard/kpis`
- `GET /api/vehicles`
- `GET /api/drivers`
- `GET /api/maintenance`
- `GET /api/alerts`
- `GET /api/routes/demo`
- `GET /api/quotas/summary`
- `GET /api/reports/daily`
- `GET /api/reports/daily/export`
- `GET /api/reports/monthly`
- `GET /api/reports/monthly/export`
- `GET /api/reports/maintenance`
- `GET /api/reports/maintenance/export`
- `GET /api/reports/delinquency`
- `GET /api/reports/delinquency/export`
- `POST /api/quotas/payments`
- `POST /api/maintenance`
- `PATCH /api/maintenance/{event_id}/complete`
- `POST /api/attendance`
- `PATCH /api/vehicles/{vehicle_id}`
- `GET /api/ai/status`
- `GET /api/ai/external/status`
- `POST /api/ai/external-query`
- `GET /api/gps/status`
- `POST /api/tracking/sessions`
- `GET /api/tracking/sessions`
- `GET /api/public/tracking/{token}`
- `POST /api/public/tracking/{token}/consent`
- `POST /api/public/tracking/{token}/points`
- `POST /api/assistant/local-query`
- `POST /api/gps/points`
- `GET /api/gps/latest/{vehicle_id}`

## Autenticacion local

Usuarios iniciales sembrados en SQLite:

- Administrador: `admin` / `admin123`
- Piloto: `piloto` / `piloto123`

La API usa contrasenas con PBKDF2 y tokens locales tipo Bearer. No integra
proveedores externos de identidad. El rol administrador controla el dashboard,
operacion diaria y asistente local; el rol piloto solo puede usar la pantalla
movil del sistema y enviar puntos para su unidad asignada.

Esta fase no integra Gemini. El asistente es local y gratuito; los puntos GPS se
guardan solo cuando el cliente llama al endpoint.

## Reportes locales

Los endpoints `/api/reports/*` entregan cierres diarios/mensuales, mantenimiento
y morosidad. Cada reporte tiene una variante `/export` que genera CSV local para
descargar desde el frontend.

## PostgreSQL opcional

El backend usa `DATABASE_URL`. El valor por defecto es SQLite local:

```env
DATABASE_URL=sqlite:///./backend/mototaxi_david.db
```

Cuando exista PostgreSQL, cambia `.env` a una URL como:

```env
DATABASE_URL=postgresql+psycopg://mototaxi_user:mototaxi_password@127.0.0.1:5432/mototaxi_david
```

Reinicia FastAPI despues del cambio. `GET /api/system/database` permite validar
si el sistema esta trabajando con SQLite o PostgreSQL.

## GPS real opcional

Los endpoints `/api/tracking/*` permiten generar enlaces temporales de jornada.
Los endpoints `/api/public/tracking/*` funcionan con token y no requieren login,
pero exigen consentimiento antes de guardar puntos reales.

El backend rechaza puntos reales si el cliente no indica contexto seguro. En el
frontend esto corresponde a `window.isSecureContext`, `localhost` o `127.0.0.1`.

## IA externa opcional

La IA externa esta bloqueada por defecto. `GET /api/ai/external/status` muestra
si faltan proveedor, modelo, clave, habilitacion o aceptacion de costo.

Variables requeridas para autorizarla:

```env
AI_EXTERNAL_ENABLED=true
AI_PROVIDER=openai|google|anthropic
AI_MODEL=modelo_autorizado
AI_API_KEY=clave_autorizada
AI_COST_ACKNOWLEDGED=true
```

`POST /api/ai/external-query` responde 403 si falta algun requisito y 501 si ya
esta autorizada pero aun no existe el conector del proveedor elegido.
