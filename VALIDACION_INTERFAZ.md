# Validación de la interfaz de Mototaxi David

Revisión realizada el 12 de octubre de 2026, con la hora de Guatemala. Referencia funcional: `semana.docx`, sin modificar el documento original.

## Resultado

Compilación de producción correcta con Vite. `git diff --check` no reporta errores de espacios. Se utilizó un navegador de prueba separado y datos de ejemplo; los cambios de QA no afectan al almacenamiento del navegador del usuario.

## Comprobaciones funcionales

- Credenciales inválidas rechazadas; administrador y piloto acceden con sus perfiles.
- Control para mostrar la contraseña verificado; credenciales vacías en el formulario inicial.
- Sesión vencida redirige al login; cierre de sesión verificado.
- Piloto sin enlaces administrativos; acceso directo a reportes rechazado.
- Búsqueda por unidad reduce la tabla de flota al resultado correspondiente.
- Cuota de MT-079 registrada: el importe diario pasó de Q375 a Q500 en resumen, reporte y respuesta del asistente.
- Intento de segundo pago por encima del saldo rechazado.
- Asistencia de Edwin Pérez actualizada; el resumen pasó a 100% de asistencia y el reporte a cero ausencias.
- Servicio completado: mantenimiento abierto pasó de cuatro a tres; nueva orden de servicio agregada y visible.
- Cambio de unidad en el formulario muestra su kilometraje; condición de 110% rechazada; actualización válida de kilometraje reflejada en el resumen.
- Datos de cuota, jornada, consentimiento y configuración conservados después de recargar.
- CSV diario descargado e inspeccionado: recibido Q500, pendiente Q125, cobranza 80%, una cuota pendiente, cero ausencias y tres servicios abiertos.
- Fecha sin registros muestra importes cero y ninguna morosidad.
- Asistente responde sobre cuotas y reconoce que no existe historial suficiente de combustible/trimestre.
- Jornada creada con piloto y unidad; consentimiento registrado; enlace inexistente muestra un error y no abre otra jornada.
- Piloto inicia la jornada y confirma El Cerinal; Oratorio queda como siguiente punto y ese avance persiste al recargar.
- La ruta antigua de defensa dirige a `/sistema`.

## Revisión visual

Capturas de login, resumen, operación, reportes, rutas, configuración, asistente y piloto. Escritorio: 1440 × 1000. Todos los módulos se inspeccionaron a 390 × 844 y la jornada también a 320 × 720. Se corrigieron el espacio del título del login móvil y el desbordamiento del ancho mínimo; la comprobación final no encontró desbordamiento en la jornada de 320 px. Consola final inspeccionada: cero errores y cero advertencias.

Las capturas y el CSV de evidencia se encuentran en `output/playwright/`, excluidos de Git. La copia previa de los cambios locales está en `.work/before-system/`.

## Límites de la validación

La autenticación, los registros y el asistente funcionan en el cliente. No se validan seguridad de producción, sincronización entre dispositivos, disponibilidad de un servidor, IA generativa ni GPS físico. El registro opcional de geolocalización no se ejecutó con un dispositivo real. El asistente utiliza reglas sobre los datos locales; la ruta es un esquema de puntos de control.
