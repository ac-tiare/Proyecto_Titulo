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

El catálogo de siete recursos informativos se carga en PostgreSQL mediante la semilla de Prisma. Las preferencias de notificación se guardan en la cuenta y se conservan también localmente para poder reintentar su sincronización; la app todavía no programa ni envía notificaciones.

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

### Ver la aplicación desde otro computador de la misma red

El computador que ejecuta Docker debe permanecer encendido y conectado a la red para que la app esté disponible. Estos pasos sirven para una demostración de desarrollo en una red privada y confiable; no publiques el puerto HTTP en Internet ni ingreses datos personales o reales en este modo.

1. Conecta ambos computadores a la misma red privada (Wi-Fi o Ethernet). Evita redes de invitados que aíslen sus dispositivos.
2. En el computador anfitrión, ejecuta `ipconfig` en PowerShell y anota la dirección IPv4 del adaptador conectado a esa red, por ejemplo `192.168.1.50`.
3. En el `.env` del anfitrión, agrega el origen exacto que usará el navegador del otro computador, reemplazando el ejemplo por la IP y el puerto reales:

   ```dotenv
   WEB_ORIGINS=http://localhost:8080,http://localhost:3000,http://192.168.1.50:8080
   ```

   Si también probarás recuperación por correo, configura `PUBLIC_APP_URL` con la misma dirección de la app para que el enlace no apunte al `localhost` del otro computador:

   ```dotenv
   PUBLIC_APP_URL=http://192.168.1.50:8080
   ```

   Para que el inicio de sesión funcione en esta demostración HTTP, configura además:

   ```dotenv
   NODE_ENV=development
   COOKIE_SECURE=false
   ```

   Esta excepción es solo para pruebas con cuentas y datos ficticios en una red de confianza: HTTP no cifra el tráfico. No uses esos valores en una publicación ni los copies a un entorno con datos reales. En producción, conserva `NODE_ENV=production` y `COOKIE_SECURE=true`, y sirve la aplicación exclusivamente detrás de HTTPS.

4. Desde la raíz del proyecto, inicia o recrea los servicios para aplicar la configuración:

   ```powershell
   docker compose up -d --build
   docker compose ps
   ```

5. Si Windows Firewall pregunta, permite el acceso al puerto TCP `8080` solo en redes privadas. Si no aparece el aviso y no hay conexión, comprueba que el perfil de red sea Privado y que la regla de entrada esté limitada a ese puerto y perfil; no desactives el firewall.
6. En el otro computador, abre `http://192.168.1.50:8080` usando la IP anotada. El frontend y la API viajan por el mismo origen; PostgreSQL y el puerto interno de la API no se publican al otro computador.

Si la IP del anfitrión cambia, actualiza `WEB_ORIGINS` y repite el paso 4. Para detener la app sin borrar sus datos, ejecuta `docker compose down`; el volumen `postgres-data` se conserva.

Para compartir la app fuera de una red privada o trabajar con datos reales, configura un dominio o proxy HTTPS confiable, permite en `WEB_ORIGINS` el origen `https://` que usarán los navegadores y mantén `COOKIE_SECURE=true`. No configures reenvío del puerto del router hacia el servicio HTTP.

Para ver logs:

```powershell
docker compose logs -f web backend database migrate
```

Para reconstruir y actualizar:

```powershell
docker compose up -d --build
```

Después de actualizar el frontend, recarga completamente la pestaña para activar
la versión nueva y limpiar la caché offline anterior.

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

## Vistas y rutas implementadas

La navegación principal tiene cuatro pestañas —Inicio, Explorar, Mi Plan y Bienestar—, además de accesos superiores a Perfil y Necesito ayuda. Las rutas marcadas como **requieren sesión** están protegidas; las demás pueden abrirse como invitado.

| Vista | Ruta(s) | Qué incluye y acceso |
|---|---|---|
| Inicio | `/inicio` | Check-in de ánimo, selección de emociones y nota opcional; recomendaciones de prácticas, accesos a Explorar y ayuda. Invitados conservan los check-ins solo en esa sesión/dispositivo; usuarios autenticados los sincronizan con la API. |
| Explorar | `/explorar` | Filtros para calma, sobrecarga, sonidos y lecturas; práctica destacada, catálogo de ejercicios y enlaces a recursos oficiales. |
| Mi Bienestar | `/bienestar` | Resumen con estados y emociones frecuentes, gráfico de áreas de bienestar y períodos semana/mes/año; incluye la vista Historial, paginada en bloques de 20. Invitados ven solo sus registros de la sesión. |
| Registro emocional | `/registro-emocional`, `/mi-bienestar` | Formulario para registrar estado, emociones y nota opcional. `/mi-bienestar` requiere sesión; el formulario también conserva registros temporales de invitado. |
| Mi Plan | `/mi-plan`, `/plan-seguridad` | **Requiere sesión.** Edita señales de alerta, acciones de afrontamiento y lugares seguros; muestra contactos de confianza y permite iniciar una llamada tras confirmar. |
| Red de Apoyo | `/red-apoyo` | **Requiere sesión.** Crea, edita, elimina y pagina contactos; ofrece accesos confirmados para llamar o enviar SMS, además de organizaciones de apoyo. |
| Información y recursos | `/recursos`, `/informacion-recursos`, `/recursos-informacion` | Filtra el catálogo informativo por tema y expande el contenido de cada recurso. Incluye canales oficiales de apoyo. |
| Necesito ayuda | `/necesito-ayuda` | Canales oficiales, orientación ante peligro inmediato y accesos al plan, la red y el registro. Disponible sin iniciar sesión. |
| Prácticas breves | `/apoyo/:activity` | Experiencias sin cuenta: `calmarme` (pausa de calma), `respirar` (duración y ritmo elegibles), `enraizar` (enfoque sensorial 5-4-3-2-1), `despejar` (lectura guiada), `sobrecarga` (anclaje visual y corporal, con audio de lluvia opcional), `sonidos`, `pensamientos`, `cuerpo` y `herramientas`. Sonidos, pensamientos y cuerpo son componentes reutilizables; herramientas reúne accesos a ejercicios. |
| Iniciar sesión | `/login` | Autentica una cuenta existente y permite ir al registro o a la recuperación de contraseña. |
| Crear cuenta | `/crear-cuenta` | Valida nombre, correo y contraseña; crea la cuenta y su sesión en el backend. |
| Recuperar contraseña | `/forgot-password`, `/reset-password` | Solicita instrucciones y restablece la contraseña con el token de un solo uso del correo. El envío requiere configurar SMTP. |
| Bienvenida | `/bienvenida` | Pantalla de bienvenida con accesos a las funciones de la app; permanece disponible como ruta de entrada alternativa. |
| Perfil | `/perfil` | **Requiere sesión.** Consulta y edita nombre/correo, administra notificaciones, exporta datos, elimina la cuenta y cierra la sesión. |
| Configuración de notificaciones | `/configuracion-notificaciones` | **Requiere sesión.** Preferencias para check-in emocional, bienestar preventivo y plan de seguridad; las preferencias se sincronizan con la cuenta y el dispositivo solicita permiso cuando corresponda. Aún no se programan ni envían avisos. |

Las rutas agrupadas en una misma fila son alias de la misma vista. La lista de recursos oficiales de apoyo y las prácticas principales están disponibles localmente en la app web; la carga del catálogo y los detalles de recursos, los enlaces externos, el inicio de sesión, el historial de cuenta y la sincronización necesitan conexión. En Capacitor, las vistas y recursos estáticos forman parte del paquete instalado; en web, el service worker guarda recursos estáticos y el router precarga vistas después de una primera visita con conexión.

La aplicación ofrece apoyo temprano; no diagnostica, no reemplaza la atención profesional ni los servicios de emergencia.

## OpenSpec

Las propuestas, especificaciones, decisiones técnicas y tareas se conservan en [`openspec/`](./openspec/).
