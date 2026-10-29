# CONTIGO

Aplicación móvil preventiva de apoyo temprano para pasajeros y trabajadores de Metro de Santiago.

## Arquitectura

- **Frontend:** Angular 22, Ionic 9, TypeScript y Capacitor 8.
- **Backend:** Node.js 24 LTS, Express 5 y TypeScript, en [`backend/`](./backend/).
- **Datos:** PostgreSQL 17 y Prisma 6 con migraciones versionadas.
- **Contenedores:** Docker Compose administra PostgreSQL, API y frontend.
- **Web:** Nginx sirve Angular como SPA y reenvía `/api/` al backend en la red privada de Compose.

El cliente no accede directamente a PostgreSQL. Las solicitudes pasan por la API REST; el backend deriva el propietario desde la sesión autenticada. El esquema y el ciclo de autenticación están documentados en [`backend/README.md`](./backend/README.md), y los contratos HTTP en [`backend/API.md`](./backend/API.md).

## Datos y autenticación

PostgreSQL contiene usuarios, sesiones revocables, registros emocionales, planes de seguridad, elementos del plan y contactos de confianza. Los registros emocionales, el plan y los contactos solo se consultan o modifican por su propietario.

Las contraseñas se almacenan con Argon2id. En web, la sesión usa cookies `HttpOnly`, CSRF y `Secure` en producción. En Capacitor nativo, el plugin de almacenamiento seguro guarda la sesión en Keychain/Keystore; no se persisten credenciales en `localStorage` del navegador. La configuración de transporte se describe en [API.md](./backend/API.md).

Los recursos oficiales de apoyo permanecen estáticos. Las preferencias de notificación de la pantalla Perfil siguen siendo locales y no se sincronizan con la cuenta.

## Requisitos

- Node.js 24 LTS y npm para desarrollo local.
- Docker Desktop con Docker Compose v2 en Windows/macOS, o Docker Engine con el complemento `docker compose` en Linux.
- Git para clonar el repositorio.

## Ejecutar todo con Docker Compose

Compose levanta el frontend en el puerto 8080, la API en el puerto interno 3000 y PostgreSQL en una red privada. PostgreSQL no publica un puerto en el host. La migración versionada se aplica mediante el servicio de una sola ejecución `migrate` antes de iniciar la API.

1. Copia el ejemplo y reemplaza la contraseña de ejemplo:

   ```powershell
   Copy-Item .env.example .env
   ```

2. En `.env`, cambia `POSTGRES_PASSWORD` por un secreto local aleatorio y coloca la misma contraseña en `DATABASE_URL`. Mantén `database` como hostname de PostgreSQL dentro de Compose. Si la contraseña contiene caracteres reservados de URL, codifícalos en `DATABASE_URL`. No compartas ni agregues `.env` al repositorio.

3. Inicia los servicios:

   ```powershell
   docker compose up -d --build
   docker compose ps
   ```

4. Comprueba las respuestas:

   ```powershell
   Invoke-WebRequest http://localhost:8080/healthz
   Invoke-WebRequest http://localhost:8080/api/ready
   Invoke-WebRequest http://localhost:8080/inicio
   ```

   La API también ofrece `GET /api/health` y `GET /api/ready`. El puerto web se cambia con `CONTIGO_PORT` en `.env`.

Para ver logs:

```powershell
docker compose logs -f web backend database migrate
```

Para reconstruir y actualizar:

```powershell
docker compose up -d --build
```

Para detener el sistema sin perder la base de datos:

```powershell
docker compose down
```

Los datos se guardan en el volumen nombrado `postgres-data`. `docker compose down` conserva el volumen; **no uses `docker compose down -v`** si necesitas mantener los datos.

En un entorno publicado, termina TLS en un proxy HTTPS confiable y configura `COOKIE_SECURE=true`; no publiques la API o PostgreSQL directamente ni desactives la validación TLS. Para desarrollo local, el origen web permitido por defecto es `http://localhost:8080`.

## Desarrollo local

### Frontend

Desde la raíz:

```powershell
npm.cmd ci
npm.cmd start
npm.cmd test -- --watch=false
npm.cmd run build
```

### Backend

Usa una instancia PostgreSQL local. Copia [`backend/.env.example`](./backend/.env.example) a `backend/.env`, configura `DATABASE_URL` con el hostname accesible desde el computador (`localhost` para PostgreSQL local) y no reutilices una base de producción para pruebas.

```powershell
Set-Location backend
npm.cmd ci
npm.cmd run prisma:generate
npm.cmd run prisma:migrate:deploy
npm.cmd run dev
```

La API local escucha por defecto en `http://localhost:3000`. Las migraciones nuevas se crean durante el desarrollo con `npm run prisma:migrate:dev` y se despliegan con `npm run prisma:migrate:deploy`; `prisma db push` no sustituye el historial de migraciones.

### Pruebas de integración PostgreSQL

La prueba HTTP de integración está desactivada por defecto. Solo ejecútala contra una base local aislada llamada `contigo_test`; el guard del test rechaza hosts remotos y otros nombres de base:

```powershell
Set-Location backend
$env:DATABASE_URL = "postgresql://contigo_test:local-test-only@localhost:54329/contigo_test?schema=public"
$env:RUN_DB_INTEGRATION_TESTS = "true"
npm.cmd test
Remove-Item Env:DATABASE_URL
Remove-Item Env:RUN_DB_INTEGRATION_TESTS
```

No uses datos emocionales reales en pruebas.

## Ejecución con Capacitor

La app web usa `/api` como ruta relativa y funciona detrás del proxy Nginx de Compose. Un dispositivo Android o iOS no puede usar `localhost` para alcanzar el computador anfitrión. Antes de compilar/publicar una aplicación nativa, configura `apiBaseUrl` en [`src/assets/contigo-config.js`](./src/assets/contigo-config.js) con el dominio público HTTPS del backend. La dirección del entorno de desarrollo debe ser accesible desde el dispositivo; no codifiques una IP privada en la configuración de producción.

El cliente nativo envía credenciales bearer y las conserva con Keychain/Keystore. No desactives TLS para resolver problemas de conexión. Configura los orígenes permitidos en `NATIVE_ORIGINS` y `WEB_ORIGINS` según el entorno.

## Respaldos y restauración

Los respaldos contienen información personal y emocional: guárdalos cifrados, con acceso limitado y fuera del repositorio. Estos comandos de PowerShell crean una copia SQL dentro del contenedor y luego la copian a un directorio privado del usuario:

```powershell
$backupDirectory = Join-Path $env:USERPROFILE "contigo-backups"
New-Item -ItemType Directory -Force $backupDirectory | Out-Null
$backupFile = Join-Path $backupDirectory "contigo-$(Get-Date -Format yyyyMMdd-HHmmss).sql"
docker compose exec -T database sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /tmp/contigo-backup.sql'
docker compose cp database:/tmp/contigo-backup.sql $backupFile
docker compose exec -T database rm -f /tmp/contigo-backup.sql
```

Restaura primero a una base de datos vacía para no sobrescribir la base activa. Por ejemplo, crea `contigo_restore`, copia el archivo y cárgalo:

```powershell
$backupFile = Read-Host "Ruta absoluta del respaldo SQL"
docker compose exec -T database createdb -U contigo contigo_restore
docker compose cp $backupFile database:/tmp/contigo-restore.sql
docker compose exec -T database sh -c 'psql -U "$POSTGRES_USER" -d contigo_restore -v ON_ERROR_STOP=1 -f /tmp/contigo-restore.sql'
docker compose exec -T database rm -f /tmp/contigo-restore.sql
```

Verifica el contenido restaurado antes de cambiar `DATABASE_URL` para apuntar a `contigo_restore` y reiniciar la API. Ajusta el usuario si `POSTGRES_USER` no es `contigo`. Conserva también una copia protegida del archivo `.env`, porque el acceso a la base requiere sus credenciales.

La eliminación de una cuenta borra sus datos activos en PostgreSQL, pero no puede purgar respaldos ya creados. Define y aplica una retención para esas copias antes de ofrecer el servicio en producción; almacénalas cifradas, con acceso limitado y fuera del repositorio.

## Pantallas conectadas

- Login y registro crean sesiones y cuentas reales en el backend.
- Registro emocional e historial usan persistencia remota, filtro por semana/mes/año y paginación.
- El plan guarda señales, acciones y lugares. Los contactos se administran en una lista única en Red de Apoyo y se enlazan desde el plan para evitar duplicarlos.
- Perfil actualiza los datos de cuenta y el cierre de sesión revoca la sesión en el backend.
- Los recursos oficiales de ayuda y las preferencias locales de notificación no se sincronizan.

La aplicación ofrece apoyo temprano; no diagnostica, no reemplaza la atención profesional ni los servicios de emergencia.

## OpenSpec

Las propuestas, especificaciones, decisiones técnicas y tareas se conservan en [`openspec/`](./openspec/).
