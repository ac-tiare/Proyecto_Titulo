# Proposal

## Why

CONTIGO todavía no persiste cuentas, registros emocionales, planes ni contactos: el registro es demostrativo, el historial vive en memoria y las pantallas de apoyo indican que la sincronización está inactiva. Se necesita una API propia con PostgreSQL para habilitar esos flujos conservando las pantallas actuales y protegiendo la información personal.

## What Changes

- Incorporar un backend Node.js/Express con TypeScript, Prisma y PostgreSQL, validaciones, API REST, controles de acceso por propietario y comprobaciones de salud.
- Cambiar registro, acceso e historial emocional desde demostraciones locales a persistencia remota autenticada; añadir persistencia al plan de seguridad y a la red de apoyo existente.
- Proteger contraseñas con Argon2id y usar sesiones revocables: cookies HttpOnly con protección CSRF para web y credenciales de sesión en almacenamiento seguro del sistema operativo para Capacitor nativo.
- Ampliar Docker Compose y Nginx para servir frontend, API y PostgreSQL con volumen persistente, healthchecks y proxy `/api`, sin publicar PostgreSQL por defecto.
- **BREAKING**: el registro y los datos emocionales dejarán de ser solo demostrativos o temporales; se transmitirán y persistirán en la cuenta autenticada. La interfaz debe informar errores reales y no presentar éxitos hasta recibir confirmación del servidor.
- Mantener recursos oficiales de apoyo estáticos, la apariencia y navegación actuales, y la configuración de Capacitor; no reintroducir Firebase.

## Capabilities

### New Capabilities
- `user-auth`: registro, inicio/cierre de sesión, sesiones revocables y perfil autenticado con separación entre clientes web y nativos.
- `emotional-history`: persistencia, consulta paginada y administración de registros emocionales propios.
- `safety-plan`: persistencia de las secciones estructuradas del plan de seguridad de cada persona.
- `trusted-contacts`: administración privada de contactos de confianza asociados a una cuenta.
- `backend-runtime`: disponibilidad verificable del proceso API y de su conexión con PostgreSQL.

### Modified Capabilities
- `user-registration`: sustituir el alta demostrativa por el registro real en la API, manteniendo validaciones, mensajes y navegación.
- `emotional-entry`: sustituir el almacenamiento temporal por persistencia autenticada y conservar la confirmación solo tras éxito del servidor.

## Impact

- Backend parcial existente en `backend/`: completar transacciones, manejo de errores, seguridad, pruebas y despliegue; Prisma ya define usuarios, sesiones, registros, planes y contactos.
- Frontend Angular/Ionic: conectar login, registro, bienestar/historial, plan, red de apoyo y edición de perfil con servicios HTTP; mantener estilos y recursos estáticos.
- Infraestructura existente: `compose.yaml` solo ejecuta el frontend web en el puerto 8080; Nginx aún no proxya `/api`. Se ampliarán ambos sin sustituir el servicio web.
- Dependencias y configuración: incorporar las necesarias en el backend y almacenamiento seguro nativo para Capacitor; documentar variables, migraciones, operación y respaldos sin versionar secretos.
- Persistencia sensible: restringir cada consulta a la identidad de sesión, no registrar contenido emocional en logs y evitar borrados en cascada de usuarios.
