# Futuras integraciones: IA y GPS

Este documento es solo una guia para fases posteriores. No implementa llamadas
reales, no requiere claves, no solicita permisos de ubicacion y no agrega
dependencias.

## Gemini / IA

Objetivo futuro: permitir que la gerencia consulte datos operativos en lenguaje
natural, por ejemplo:

- "Que unidades necesitan mantenimiento esta semana?"
- "Que piloto tiene mas ausencias este mes?"
- "Cual es la recaudacion pendiente por unidad?"

Idea tecnica recomendada:

1. Crear variables de entorno para la clave del proveedor de IA, nunca escribirla
   en codigo.
2. Exponer un endpoint interno como `POST /api/ai/chat`.
3. No dejar que la IA genere SQL libre.
4. Crear funciones seguras en backend, por ejemplo:
   - `get_upcoming_maintenance()`
   - `get_driver_attendance_summary()`
   - `get_quota_summary()`
   - `get_vehicle_health_report(vehicle_id)`
5. Enviar a Gemini solo resultados filtrados y necesarios, no toda la base.
6. Guardar cada respuesta importante en una tabla de auditoria.

Pseudoflujo:

```text
Usuario pregunta -> Backend valida -> IA elige funcion segura -> Backend ejecuta
consulta controlada -> IA redacta respuesta -> Backend devuelve resultado
```

## GPS real

Objetivo futuro: que el piloto abra `/track/:token`, acepte compartir ubicacion
y el sistema actualice la posicion del microbus en el dashboard.

Idea tecnica recomendada:

1. Generar un token temporal para cada jornada/ruta.
2. El piloto abre el enlace seguro en el celular.
3. La pantalla explica que se usara ubicacion durante la jornada.
4. Solo si el piloto acepta, usar `navigator.geolocation.watchPosition`.
5. Enviar puntos al backend cada cierto intervalo, por ejemplo 10-20 segundos.
6. Guardar `vehicle_id`, latitud, longitud, velocidad, timestamp y precision.
7. Detener el rastreo al cerrar jornada.
8. En el dashboard, mostrar ultima posicion y desviaciones de puntos de control.

Pseudoflujo:

```text
Piloto abre enlace -> Acepta permiso -> Navegador obtiene coordenadas ->
Frontend envia punto -> Backend valida token -> Guarda posicion -> Dashboard lee
ultima ubicacion
```

## Lo que ya existe sin servicios externos

- `POST /api/assistant/local-query`: asistente local basado en reglas. No usa
  Gemini, no consume tokens y no cobra.
- `POST /api/gps/points`: guarda puntos enviados por el frontend. No solicita
  ubicacion real por si solo.
- `GET /api/gps/latest/{vehicle_id}`: devuelve el ultimo punto guardado.

Estos endpoints son pasivos: no corren si el backend esta apagado y no ejecutan
tareas en segundo plano.

## Seguridad minima antes de implementar

- HTTPS obligatorio para geolocalizacion real.
- Tokens por jornada, no enlaces permanentes.
- Limitar frecuencia de envio para no gastar datos ni bateria.
- Mostrar claramente cuando el rastreo esta activo.
- No recolectar ubicacion fuera de horario laboral.
- Registrar auditoria de inicio, pausa y fin de rastreo.
