# Mototaxi David

Sistema Integral de Gestion de Flotas para proyecto de graduacion.

## Fase 1 - Frontend

Frontend con React, Vite, React Router, Tailwind y datos demo locales.

```powershell
corepack prepare pnpm@10.29.3 --activate
corepack pnpm install
corepack pnpm dev
```

Rutas demo:

- `/demo`
- `/demo/defensa`

Rutas del sistema:

- `/sistema/login`
- `/sistema`
- `/sistema/operacion`
- `/sistema/reportes`
- `/sistema/gps`
- `/sistema/ia`
- `/sistema/configuracion`
- `/sistema/piloto`
- `/jornada/:token`

Las rutas antiguas `/`, `/defensa`, `/login`, `/app`, `/app/operacion` y
`/track/demo` redirigen a la nueva estructura para conservar compatibilidad.

## Fase 2 - Backend

Backend base con FastAPI, SQLModel y datos demo persistentes. Usa SQLite local
por defecto para correr sin instalar PostgreSQL. Cuando exista PostgreSQL,
definir `DATABASE_URL` en `.env`.

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend\requirements.txt
.\.venv\Scripts\python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Endpoints:

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

## Alcance actual

Hay autenticacion local con SQLite/FastAPI. No hay Gemini, GPS real ni
proveedores externos de identidad.

## Fase 3 - Conexion frontend/backend

El dashboard y la pantalla `/sistema/piloto` intentan leer datos desde FastAPI usando
`VITE_API_BASE_URL`. Si el backend no esta activo, el frontend vuelve
automaticamente a los datos locales de Fase 1.

```powershell
# Backend
.\.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# Frontend
corepack pnpm dev
```

No se agregan dependencias nuevas en esta fase.

## Fase 4 - APIs internas gratuitas

Se agregaron APIs propias que no dependen de servicios externos:

- `POST /api/assistant/local-query`: asistente analitico local basado en reglas.
- `POST /api/gps/points`: guarda puntos GPS enviados por el frontend.
- `GET /api/gps/latest/{vehicle_id}`: consulta el ultimo punto guardado.

Estas APIs no ejecutan procesos en segundo plano, no consumen recursos cuando el
proyecto esta apagado y no generan cobros silenciosos. Solo trabajan cuando
FastAPI esta encendido y reciben una solicitud.

## Fase 5 - Operacion diaria

Se agrego la ruta `/sistema/operacion` con formularios para:

- Registrar cuotas.
- Registrar asistencia.
- Registrar mantenimientos.
- Completar mantenimientos pendientes.
- Actualizar kilometraje, salud, estado y proximo servicio de una unidad.

Los formularios usan solo la API local de FastAPI. No hay servicios pagados ni
procesos en segundo plano.

## Fase 6 - Autenticacion local y roles

Se agrego login local sin servicios externos. FastAPI guarda usuarios, hashes de
contrasena PBKDF2 y tokens de sesion en SQLite.

Credenciales iniciales:

- Administrador: `admin` / `admin123`
- Piloto: `piloto` / `piloto123`

Permisos:

- Administrador: dashboard, operacion diaria, asistente local y reportes futuros.
- Piloto: pantalla `/sistema/piloto` y envio de puntos locales solo para su unidad asignada.

Rutas protegidas:

- `/sistema`
- `/sistema/operacion`
- `/sistema/reportes`
- `/sistema/gps`
- `/sistema/ia`
- `/sistema/configuracion`
- `/sistema/piloto`

## Separacion demo/sistema

La demo academica queda aislada en `/demo` y `/demo/defensa`. El sistema real se
trabaja desde `/sistema`, con login, roles y navegacion propia. Esto permite
mantener la demo terminada sin bloquear el avance del programa operativo.

## Fase 7 - Reportes y exportaciones

Se agrego la ruta `/sistema/reportes` para administradores con:

- Cierre diario.
- Cierre mensual.
- Reporte de mantenimiento.
- Reporte de morosidad.
- Exportaciones CSV generadas por FastAPI local.

Los reportes usan solo datos de SQLite/API local y no requieren servicios
externos.

## Fase 8 - PostgreSQL opcional

Se agrego `/sistema/configuracion` y `GET /api/system/database` para mostrar el
motor activo de base de datos sin exponer claves. Por defecto el sistema sigue
en SQLite local.

Para usar PostgreSQL real cuando decidas instalarlo/configurarlo:

```powershell
# .env
DATABASE_URL=postgresql+psycopg://mototaxi_user:mototaxi_password@127.0.0.1:5432/mototaxi_david
```

Luego reinicia FastAPI. El backend creara las tablas con SQLModel y sembrara
usuarios/datos iniciales si la base esta vacia.

## Fase 9 - GPS real opcional

Se agrego `/sistema/gps` para crear jornadas GPS temporales por unidad/piloto.
Cada jornada genera un enlace `/jornada/:token`.

El envio de ubicacion real requiere:

- Token de jornada activo.
- Consentimiento explicito del piloto.
- Contexto seguro del navegador (`https`, `localhost` o `127.0.0.1`).

El sistema no activa rastreo en segundo plano. La ubicacion se envia solo cuando
el piloto presiona el boton desde su enlace de jornada.

## Fase 10 - IA externa opcional

Se agrego `/sistema/ia` y endpoints de estado para IA externa. La integracion
queda bloqueada por defecto y no realiza llamadas pagadas.

Para autorizar una IA externa en una fase posterior se deben definir:

```env
AI_EXTERNAL_ENABLED=true
AI_PROVIDER=openai|google|anthropic
AI_MODEL=modelo_autorizado
AI_API_KEY=clave_autorizada
AI_COST_ACKNOWLEDGED=true
```

Si falta cualquiera de esos valores, `POST /api/ai/external-query` responde 403.
Aunque todo este configurado, el conector real todavia devuelve 501 hasta que se
implemente el proveedor elegido explicitamente.

Endpoints de autenticacion:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Integraciones futuras

Gemini y GPS real no estan implementados. Solo hay endpoints de estado y una
guia de referencia en [docs/futuras-integraciones.md](docs/futuras-integraciones.md)
con la idea tecnica para implementarlos despues de forma segura.
