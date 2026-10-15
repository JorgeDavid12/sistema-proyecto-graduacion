# Mototaxi David · Sistema Integral de Flotas

Interfaz de trabajo para administrar cinco mototaxis y un microbús de la ruta Cuilapa–Oratorio. Los procesos se basan en el documento `semana.docx`: cuotas, asistencia, servicios preventivos, jornadas y consultas de operación.

## Ejecución

```powershell
pnpm install
pnpm dev
```

Para generar la distribución: `pnpm build`. Para revisarla: `pnpm preview`.
No es necesario iniciar el backend existente ni instalar una base de datos.

## Publicar en Netlify

Para una carga manual, ejecuta `pnpm build` y sube la carpeta `dist` completa al proyecto existente de Netlify. Debe incluir `index.html`, `assets/` y `_redirects`. No subas la carpeta `src` ni solamente `index.html`.

El archivo `public/_redirects` se copia automáticamente a `dist/_redirects` durante la compilación. La regla `/* /index.html 200` permite abrir y recargar rutas como `/sistema/login` directamente, también desde otro dispositivo.

Si conectas el repositorio, `netlify.toml` define el comando de compilación `pnpm build` y el directorio de publicación `dist`. El cambio no se aplica a una publicación existente hasta volver a desplegar.

## Cuentas para revisar el prototipo

| Perfil | Usuario | Contraseña |
| --- | --- | --- |
| Administrador | admin | admin123 |
| Piloto | piloto | piloto123 |

El login no muestra ni completa estas credenciales. El perfil piloto abre su jornada y no tiene acceso a las pantallas administrativas.

## Funciones

- Resumen: indicadores calculados, búsqueda de flota, prioridades, cobranza, servicios y actividad reciente.
- Operación: abonos de cuota con validación de saldo y piloto, asistencia del día, programación y cierre de servicios, actualización de unidades.
- Reportes: filtros diarios y mensuales, morosidad, mantenimiento y exportación CSV con los mismos registros del resumen.
- Asistente: conversación sobre cuotas, mantenimiento, asistencia y puntos de control. Consulta los registros actuales y reconoce información insuficiente.
- Jornadas: asignación de piloto y unidad, enlace temporal, consentimiento y registro puntual de ubicación desde el navegador.
- Piloto: iniciar o pausar la jornada y confirmar llegadas a puntos de control.
- Configuración: empresa, sede, horario de referencia y prioridades del resumen.

El punto de entrada `/` dirige al sistema y solicita acceso si no hay una sesión. Las direcciones antiguas de demo y defensa redirigen al sistema.

## Alcance técnico

Este sigue siendo un prototipo, aunque la interfaz presenta el flujo del sistema. El acceso por roles es una simulación en cliente y no debe usarse para proteger datos de producción. Las cuentas están en el código; no existe autenticación de servidor. La sesión vence a las ocho horas.

La información inicial es de ejemplo. Los movimientos y preferencias se guardan en `localStorage`; sobreviven a las recargas del mismo navegador y origen, pero no se sincronizan entre equipos, dominios o puertos. La conversación se conserva en la pestaña con `sessionStorage`. Borrar estos datos devuelve el escenario inicial. La bitácora local permite revisar acciones pero no ofrece integridad de auditoría de servidor.

El asistente usa reglas y cálculos locales: no llama a Gemini ni a otro proveedor, no genera cargos y no implementa predicciones mecánicas reales. Si la consulta requiere combustible, un trimestre completo o una predicción, informa que no tiene historial suficiente.

El esquema de ruta representa puntos de control; no es un mapa GPS en vivo. El enlace de jornada funciona en el navegador y origen que contiene la asignación. El registro opcional de coordenadas requiere consentimiento, permiso del navegador y HTTPS o localhost; queda en ese navegador y no se transmite a un servidor. No se validó GPS físico.

El backend anterior se conserva como referencia y no interviene en esta experiencia.

## Código

- `src/services/api.js`: persistencia local, validaciones y cálculos compartidos.
- `src/data/fleetData.js`: flota, servicios y recorrido inicial.
- `src/components/AppShell.jsx`: menú por perfil y navegación adaptable.
- `src/routes/`: pantallas de trabajo.

Los cambios locales anteriores a esta intervención se conservaron en `.work/before-system/` antes de editar. Ese respaldo y las capturas de QA quedan excluidos de Git.
