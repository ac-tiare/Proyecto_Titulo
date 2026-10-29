# Tasks

## 1. Factibilidad de notificaciones sin Firebase

- [ ] 1.1 Evaluar Web Push, APNs y una alternativa Android no Firebase (incluido UnifiedPush) sin añadir dependencias de Firebase; entregar una prueba de recepción en segundo plano en Android y documentar requisitos, cobertura, operación y límites. Si no se valida un proveedor Android viable, detener la integración multiplataforma y solicitar decisión antes de continuar con push.

## 2. Tendencias emocionales descriptivas

- [x] 2.1 Añadir endpoint autenticado de patrones con agregaciones por período, conteos y buckets temporales filtrados por propietario; cubrir con pruebas backend períodos, datos insuficientes, ausencia de notas y aislamiento entre cuentas.
- [x] 2.2 Integrar resúmenes accesibles en el historial existente sin alterar su navegación; cubrir estados de carga, error y vacío, y verificar que no aparezcan diagnósticos ni puntuaciones de riesgo.
- [x] 2.3 Documentar el endpoint, las métricas descriptivas y sus límites; verificar ejemplos frente a la respuesta probada.

## 3. Preferencias y entrega de notificaciones

- [ ] 3.1 Añadir migración Prisma para preferencias, suscripciones cifradas e idempotencia de entregas; cubrir migración, aislamiento por cuenta, cifrado, revocación y ausencia de tokens o contenido personal en logs/exportaciones.
- [ ] 3.2 Implementar API de preferencias y suscripciones con autorización, consentimiento y revocación; probar permisos denegados, dispositivos de otra cuenta, cambios de horario y baja de suscripción.
- [ ] 3.3 Implementar worker programado y adaptadores solo para plataformas/proveedores validados en 1.1; probar horarios y zonas horarias, idempotencia, reintentos acotados, desactivación de categoría y payloads genéricos.
- [ ] 3.4 Conectar la configuración existente a preferencias persistentes y solicitud de permisos explícita; verificar restauración después de reiniciar la app, sincronización entre sesiones y comunicación de plataformas no disponibles.
- [ ] 3.5 Documentar configuración de proveedores, secretos, permisos, operación del worker y matriz real de plataformas; validar comandos y que ningún secreto quede versionado.

## 4. Controles de privacidad de datos

- [x] 4.1 Implementar exportación autenticada en JSON para perfil, historial, plan y contactos actualmente persistidos; probar contenido propio, exclusión de secretos/tokens, respuesta privada y rechazo sin sesión. No exportar los toggles de notificación temporales como preferencias guardadas.
- [x] 4.2 Implementar eliminación confirmada y transaccional de cuenta y dependencias actualmente persistidas; probar cancelación, dos cuentas, consistencia ante fallos y aplicación de restricciones referenciales. La revocación de dispositivos queda para la futura integración de notificaciones.
- [x] 4.3 Reemplazar la sección informativa por controles y explicación de categorías de datos, exportación, eliminación y retención de respaldos; verificar accesibilidad, confirmación y errores sin éxito simulado.
- [x] 4.4 Actualizar documentación de privacidad y operación, incluyendo límites de respaldos y formato de exportación; comprobar consistencia con API y pruebas.

## 5. Verificación integral

- [x] 5.1 Ejecutar suites backend/frontend, builds, lint y configuración/build de Docker; verificar migraciones, servicios, proxy `/api`, patrones emocionales, exportación y eliminación con datos sintéticos. No exigir worker ni escenarios de permisos push mientras la factibilidad esté pendiente.
- [x] 5.2 Verificar aislamiento entre dos cuentas y eliminación completa de los datos activos actualmente persistidos sin borrar volúmenes; registrar que push, preferencias y suscripciones siguen pendientes antes de cerrar este alcance.
