# Tasks

## 1. Modelo de datos y autenticación

- [x] 1.1 Completar el esquema Prisma para acceso de corta duración y renovación rotativa, relaciones de plan/contactos y restricciones; crear migración versionada incremental y comprobar `prisma migrate deploy` en una base PostgreSQL exclusiva de pruebas.
- [x] 1.2 Hacer transaccionales el registro y la creación de sesión; implementar hash Argon2id, login, renovación atómica, revocación, perfil y respuestas seguras; verificar con pruebas backend altas duplicadas, credenciales incorrectas, caducidad, rotación y revocación.
- [x] 1.3 Completar autenticación web con cookies `HttpOnly`, CSRF y configuración segura por entorno; probar rechazo de CSRF/orígenes inválidos y que ningún secreto aparece en respuestas o logs.
- [x] 1.4 Documentar el modelo relacional y el ciclo de autenticación en la documentación técnica; verificar que tablas, relaciones y contratos descritos coinciden con Prisma y las rutas implementadas.

## 2. API de datos personales

- [x] 2.1 Completar CRUD de emociones, plan y contactos con validación, paginación y filtros existentes; verificar en pruebas que cada operación consulta solo datos del propietario y que el plan se actualiza atómicamente.
- [x] 2.2 Implementar o ajustar `/api/health`, `/api/ready`, errores JSON centralizados, límites de frecuencia y CORS; verificar respuestas saludables/no saludables y errores sin filtración de detalles.
- [x] 2.3 Añadir pruebas HTTP e integración PostgreSQL para persistencia, validaciones, ownership, errores, CSRF y disponibilidad de base de datos; ejecutarlas contra una base aislada y confirmar que no aceptan una URL de producción.
- [x] 2.4 Documentar endpoints, autenticación, parámetros, ejemplos de respuesta y errores; comprobar que los ejemplos se corresponden con pruebas de API.

## 3. Cliente Angular y sesiones

- [x] 3.1 Configurar `HttpClient`, URL de API por entorno, tipos y servicios para autenticación, registros, plan y contactos; verificar las solicitudes con pruebas unitarias de servicios e interceptor.
- [x] 3.2 Implementar transporte web con cookies/CSRF y transporte Capacitor nativo con acceso Bearer y renovación rotativa en almacenamiento seguro; verificar que el navegador no inicializa el plugin ni guarda credenciales en `localStorage`.
- [x] 3.3 Integrar restauración de sesión, guards, cierre de sesión y manejo de expiración/errores; comprobar reintentos controlados y navegación a Login cuando la sesión deja de ser válida.

## 4. Integración de pantallas existentes

- [x] 4.1 Conectar login y registro al backend, manteniendo validaciones, accesibilidad y rutas; probar alta, duplicado, errores del servidor e inicio de sesión sin modificar estilos.
- [x] 4.2 Conectar registro emocional e historial a persistencia remota, filtros y paginación; probar que solo un guardado confirmado se anuncia como éxito y que los datos reaparecen tras una nueva sesión.
- [x] 4.3 Conectar las secciones del plan y la red de apoyo, evitando duplicar contactos entre ambas vistas; probar recuperación, altas, cambios, eliminaciones y estados vacíos/error sin modificar estilos.
- [x] 4.4 Conectar perfil y cierre de sesión a la cuenta real, manteniendo las preferencias locales no especificadas; verificar que un conflicto de correo o fallo de red no se muestra como guardado.

## 5. Docker, configuración y operación

- [x] 5.1 Crear imagen backend multi-stage y ampliar `compose.yaml` con web, backend y PostgreSQL en red interna, volumen persistente, variables externas y healthchecks; comprobar `docker compose config` y `docker compose build`.
- [x] 5.2 Configurar Nginx para proxy `/api` y mantener fallback SPA/puerto 8080; verificar `/healthz`, rutas Angular y proxy a la API sin exponer PostgreSQL en puertos host.
- [x] 5.3 Excluir secretos del control de versiones y actualizar `.env.example` sin credenciales reales; verificar con `git check-ignore` que `.env` queda ignorado y que el ejemplo permite completar la configuración.
- [x] 5.4 Documentar instalación, migraciones, ejecución web/móvil, configuración HTTPS, comprobación de salud, detención sin pérdida de datos, respaldos y restauración; verificar los comandos documentados en un entorno limpio de prueba.

## 6. Verificación integral

- [ ] 6.1 Ejecutar pruebas backend/frontend y builds de producción; comprobar `docker compose up -d --build`, estado saludable de los tres servicios y flujos reales de registro, login, historial, plan y contactos.
- [x] 6.2 Verificar aislamiento entre dos cuentas de prueba y persistencia PostgreSQL tras reiniciar servicios sin borrar el volumen; registrar resultados y pendientes sin usar datos emocionales reales.
