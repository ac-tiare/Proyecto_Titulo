# Design

## Context

See `proposal.md` for the motivation and behavior changes; the capability contracts are in `specs/`.

CONTIGO es una aplicación Angular 22/Ionic 9/Capacitor 8 con rutas lazy-loaded y pantallas existentes para registro, login, historial emocional, plan, red de apoyo y perfil. El registro aún es demostrativo; bienestar y plan usan estado de sesión; la red de apoyo es un placeholder. Los recursos oficiales siguen siendo estáticos. No hay todavía una capa HTTP Angular ni configuración de API en `environment.ts`.

Hay un backend parcial en `backend/` con Express 5, TypeScript, Prisma 6.19.3, una migración PostgreSQL inicial, modelos y rutas para autenticación, emociones, plan y contactos. La compilación TypeScript ya pasó tras corregir errores iniciales, pero las pruebas de integración y la conexión real a PostgreSQL no se han verificado. El alta de usuario y la creación de sesión actualmente son operaciones separadas. El plugin `@aparajita/capacitor-secure-storage` está añadido a la raíz; en web puede recurrir a `localStorage`, por lo que su uso debe limitarse al cliente nativo.

Docker actualmente ejecuta solo el frontend/Nginx en el puerto configurable 8080. Nginx sirve la SPA y no proxya `/api`; Compose no define backend ni PostgreSQL. El `.gitignore` no excluye aún explícitamente archivos `.env`.

## Goals / Non-Goals

**Goals:**
- Completar el backend y su modelo relacional con migraciones incrementales, acceso privado por propietario y errores JSON coherentes.
- Conectar las pantallas existentes mediante servicios Angular sin modificar estilos ni rutas existentes.
- Aplicar sesiones distintas según cliente web/nativo con renovación revocable y credenciales protegidas.
- Mantener una ejecución local reproducible con Docker Compose y documentación operativa.

**Non-Goals:**
- Añadir recursos oficiales administrables, roles administrativos, funciones clínicas o pantallas nuevas ajenas a las que ya existen.
- Importar datos de Firebase o recuperar registros que solo existieron en memoria de una sesión anterior.
- Eliminar cuentas o datos personales en cascada, publicar PostgreSQL por defecto o cambiar navegación/diseño de CONTIGO.
- Hacer que la app nativa dependa de `localhost` o de una dirección IP privada fija en producción.

## Decisions

### Persistencia relacional mediante Prisma y PostgreSQL

Completar el modelo existente: cuentas y sesiones; registros emocionales con emociones normalizadas; plan único por cuenta con elementos tipados y ordenados; y contactos de confianza independientes. Los registros se consultan siempre filtrando por el propietario derivado de la sesión. La sección de contactos del plan reutiliza la red de apoyo de la misma cuenta en vez de copiar teléfonos o nombres en los elementos del plan.

Mantener `Restrict` para las relaciones desde datos personales hacia usuario. Usar transacciones para crear usuario y sesión, actualizar el plan y sus elementos de forma atómica, y rotar credenciales. Añadir una migración versionada posterior a la migración inicial para campos/tablas nuevos; no reescribir migraciones ya generadas. Validar el esquema con `prisma migrate deploy` sobre una base de pruebas aislada.

### Credenciales opacas, almacenadas como hashes y renovables

Emitir credenciales aleatorias no interpretables como JWT y persistir solo sus hashes. La credencial de acceso tendrá vigencia corta (15 minutos por defecto); la credencial de renovación se rotará en cada uso y tendrá vigencia configurable de hasta 14 días. Una renovación condicional en base de datos invalida la credencial anterior; el cierre de sesión revoca la sesión completa. No se requiere secreto de firma compartido ni se guarda ningún token en logs.

Para web, entregar acceso y renovación en cookies `HttpOnly`, `Secure` en producción y `SameSite` configurable; proteger operaciones mutables y renovación con token CSRF. Para Capacitor nativo, entregar credenciales por respuesta API y conservarlas solo en Keychain/Keystore mediante el plugin seguro. El código Angular solo inicializa ese plugin si `Capacitor.isNativePlatform()` es verdadero; el navegador usa cookies y nunca usa el fallback web del plugin.

Se prefieren credenciales opacas guardadas en servidor sobre JWT porque permiten revocar y rotar sesiones en PostgreSQL sin claves de firma expuestas ni dependencia de listas de revocación separadas.

### API REST del backend existente

Mantener Express, controladores/servicios/repositorios existentes y los prefijos actuales: `/api/auth`, `/api/emociones`, `/api/plan-seguridad` y `/api/contactos`. Completar `/api/auth/refresh`, la consulta/actualización de perfil, respuestas de validación y errores; mantener `/api/health` como liveness y `/api/ready` como comprobación real de PostgreSQL. Las operaciones de acceso, registro y renovación tendrán límite de frecuencia. Las consultas y escrituras de entidades personales usarán el `userId` autenticado, nunca un `usuario_id` del cuerpo.

Los errores se traducirán en un middleware central con códigos estables y mensajes seguros en español. Los errores internos y fallos de CORS no expondrán configuración ni devolverán éxito simulado; los logs incluirán metadatos de solicitud, pero no credenciales, correos, notas ni contenido del plan.

### Integración Angular por servicios y transporte dependiente de plataforma

Añadir configuración de URL de API a los entornos existentes. El navegador usará la ruta relativa `/api` detrás de Nginx; el dispositivo usará una URL HTTPS configurable para el entorno de compilación, nunca una IP privada incorporada al código de producción.

Proveer `HttpClient` en la aplicación standalone y crear servicios tipados para auth, registros emocionales, plan y contactos. Un interceptor enviará cookies/CSRF en web o `Authorization: Bearer` y el indicador de cliente nativo en Capacitor. El token de acceso nativo se cargará desde el almacenamiento seguro; al expirar, el cliente coordinará una sola renovación y guardará de forma atómica el par rotado. Si la renovación falla, borrará las credenciales locales y devolverá a Login. Los guards existentes se limitarán a navegación; la autorización real permanece en el servidor.

Conectar las vistas actuales y cambiar textos de demostración por estados de carga, error, vacío y éxito según respuestas reales. Mantener el HTML/SCSS y el flujo de navegación salvo los elementos interactivos necesarios para completar las pantallas placeholder de perfil y red de apoyo. Mantener los recursos de ayuda estáticos.

### Compose conserva frontend y agrega servicios internos

Mantener el servicio `web`, el puerto configurable 8080 y su healthcheck. Añadir `backend` y `database` a una red privada de Compose; el backend se conecta a `database:5432` y PostgreSQL no publica puertos host por defecto. Un volumen nombrado conserva los datos y el healthcheck de PostgreSQL condiciona el arranque de la API. Nginx proxya `/api/` al servicio `backend:3000` antes del fallback SPA.

El backend tendrá imagen multi-stage con Node.js LTS, dependencias de producción y migración de Prisma al iniciar antes de aceptar tráfico. La configuración de secretos residirá en `.env` ignorado y `.env.example` contendrá solo valores de muestra. Compose nunca ejecutará comandos que borren volúmenes.

### Pruebas separadas de datos reales

Usar pruebas unitarias para validadores y servicios con dobles controlados, pruebas HTTP para rutas, errores, CSRF, autenticación y aislamiento por propietario, y pruebas de integración contra una base PostgreSQL exclusiva de pruebas. Las pruebas deben fallar si reciben una URL de producción/desarrollo no destinada a tests; nunca usar información emocional real. Comprobar persistencia con una consulta tras reiniciar servicios sin borrar volúmenes.

## Risks / Trade-offs

- [La información emocional y de contactos es sensible] → No registrar cuerpos ni credenciales; limitar logs a metadatos; validar límites; aplicar TLS en despliegues y filtrar por identidad autenticada en cada operación.
- [Una rotación concurrente puede reutilizar una credencial] → Actualizar el hash mediante operación condicional/transacción y aceptar solo una rotación; cubrir repetición y concurrencia con pruebas.
- [La API puede arrancar antes de que PostgreSQL esté lista] → Usar healthcheck de base de datos, dependencia `service_healthy`, migraciones controladas y endpoint de readiness.
- [Los dispositivos móviles no alcanzan el host por `localhost`] → Configurar URL HTTPS por entorno y documentar URL de desarrollo accesible desde el dispositivo; no fijar IPs privadas en producción.
- [El plugin de almacenamiento seguro tiene fallback web] → Encapsularlo en un adaptador que solo se cree en plataforma nativa y probar que el navegador usa cookies sin persistir tokens en Web Storage.
- [La nueva base comienza sin historial previo] → Informar en la documentación que los datos efímeros anteriores no son recuperables; no importar datos de Firebase.
- [Cambiar el flujo demo puede sorprender durante la operación sin API] → La interfaz mostrará error y nunca éxito si la API no está disponible; Compose iniciará los tres servicios juntos.

## Migration Plan

1. Completar y validar el esquema Prisma con una migración incremental y base de pruebas aislada.
2. Terminar y probar endpoints/seguridad del backend antes de conectar los formularios.
3. Implementar los servicios Angular y conectar las pantallas manteniendo sus estilos.
4. Añadir Dockerfile del backend, variables de entorno, servicios Compose, healthchecks y proxy Nginx.
5. Ejecutar migraciones con `prisma migrate deploy`, verificar `/api/health` y `/api/ready`, y completar los flujos web y nativos.
6. Documentar ejecución, TLS, respaldos con `pg_dump` y restauración en una base verificada.

No ejecutar `docker compose down -v` ni eliminar el volumen para revertir. Ante fallo de aplicación, volver a la imagen anterior conservando la base de datos; las migraciones serán aditivas y las operaciones destructivas de esquema requerirán un cambio aparte.

