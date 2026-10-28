# CONTIGO

Aplicación móvil preventiva de apoyo temprano para pasajeros y trabajadores de Metro de Santiago.

## Resumen de avances

- Se construyó la interfaz móvil CONTIGO con Ionic y Angular: Login y Crear Cuenta, Inicio, Registro Emocional y secciones de bienestar y apoyo.
- Se ajustó el desplazamiento vertical de Inicio para que el contenido se desplace entre el encabezado y la barra inferior, manteniendo ambas áreas visibles y permitiendo llegar a las secciones finales.
- Se incorporó Docker para compilar la aplicación y servirla con Nginx. Compose ejecuta solo el frontend en `http://localhost:8080`; las rutas Angular se pueden abrir directamente y recargar. La aplicación no incluye backend ni servicios de datos conectados.
- Se documentaron en este README los pasos de ejecución local y Docker, incluidos los comandos para clonar, iniciar, comprobar, ver logs y detener la aplicación.

## Requisitos

- Node.js 24 LTS
- npm (incluido con Node.js)

## Estado de almacenamiento y cuentas

Firebase ya no forma parte del código ni de las dependencias de CONTIGO. El inicio de sesión, la creación de cuentas y la sincronización de contactos están temporalmente inactivos; la aplicación no crea cuentas ni modifica los datos que permanezcan en servicios remotos. Las rutas de las pantallas se pueden abrir directamente, sin autenticación.

Los registros emocionales guardados y las secciones editables del Plan de Seguridad se mantienen únicamente en memoria mientras la aplicación está abierta. Se pierden al cerrar o recargar la app. Esta versión no ofrece almacenamiento persistente para datos personales.

## Ejecutar con Docker

Docker solo necesita un contenedor para el frontend web: Angular se compila durante la construcción de la imagen y Nginx sirve los archivos resultantes. No se ejecutan contenedores de backend ni de base de datos.

### Requisitos

- Docker Desktop con Docker Compose v2 en Windows o macOS, o Docker Engine con el complemento `docker compose` en Linux.
- Docker debe estar iniciado. Node.js no es necesario en el computador anfitrión para construir o ejecutar la versión Docker.
- Git, si vas a clonar el repositorio.

Comprueba que Docker está disponible:

```powershell
# En instalaciones por usuario donde `docker` no se reconoce, agrega el CLI a
# esta ventana de PowerShell (el cambio no es permanente ni afecta al sistema).
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  $dockerCli = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
  if (Test-Path "$dockerCli\docker.exe") {
    $env:PATH = "$dockerCli;$env:PATH"
  }
}

docker version
docker compose version
```

### Clonar y levantar el proyecto

En PowerShell, desde la carpeta donde quieras guardar el repositorio:

```powershell
git clone https://github.com/macacarreno/PROYECTO-CONTIGO.git
cd PROYECTO-CONTIGO
docker compose up --build -d
```

La primera vez, Docker descarga las imágenes base y compila Angular; puede tardar unos minutos. `-d` deja el servicio ejecutándose en segundo plano. Para ver si está saludable:

```powershell
docker compose ps
```

Abre **http://localhost:8080** en el navegador. Las rutas de la aplicación, por ejemplo `/inicio` o `/bienestar`, también deben funcionar al abrirlas o recargarlas directamente.

### Comprobar, ver logs y administrar el servicio

Para comprobar la respuesta HTTP del servidor:

```powershell
Invoke-WebRequest http://localhost:8080/healthz
Invoke-WebRequest http://localhost:8080/inicio
```

Para seguir los logs o revisar el estado:

```powershell
docker compose logs -f web
docker compose ps
```

Pulsa `Ctrl+C` para salir del seguimiento de logs; esto no detiene el servicio. Para detener y eliminar el contenedor:

```powershell
docker compose down
```

Para volver a levantarlo después de haberlo detenido:

```powershell
docker compose up -d
```

Si cambiaste el código o el Dockerfile y quieres reconstruir la imagen:

```powershell
docker compose up --build -d
```

El puerto del computador es configurable. Si el 8080 ya está ocupado, define otro antes de levantar el servicio:

```powershell
$env:CONTIGO_PORT = "8081"
docker compose up --build -d
```

En ese caso abre **http://localhost:8081**. Para volver al puerto predeterminado en la misma ventana de PowerShell:

```powershell
Remove-Item Env:CONTIGO_PORT
```

En macOS o Linux, los mismos comandos `docker compose` funcionan desde una terminal; para cambiar el puerto se puede anteponer `CONTIGO_PORT=8081` al comando.

## Desarrollo local

Desde PowerShell, en la raíz del repositorio:

```powershell
npm.cmd ci
npm.cmd start
```

Abre la dirección local que indique Angular CLI para usar la aplicación en el navegador. Para comprobar una compilación de producción:

```powershell
npm.cmd run build
```

En Git Bash puedes usar `npm` en lugar de `npm.cmd`.

## Alcance actual

La aplicación utiliza Ionic, Angular, TypeScript y Capacitor. No integra un servicio de autenticación ni una base de datos. Las secciones de apoyo incluyen contenido orientativo y no personalizado. No se implementan análisis emocional automático ni notificaciones push. La aplicación no diagnostica ni reemplaza la atención profesional.

## Estructura OpenSpec

Las propuestas, especificaciones, decisiones técnicas y tareas del proyecto se mantienen en `openspec/`.
Los artefactos históricos que mencionan servicios retirados se conservan como documentación; no se usan durante la compilación ni la ejecución.

## Funcionalidades implementadas

CONTIGO cuenta con una interfaz visual y navegable para una aplicación móvil de apoyo temprano. La navegación conecta las siguientes pantallas:

- **Login:** conserva el formulario y la opción de mostrar u ocultar la contraseña. El inicio de sesión está temporalmente inactivo y la pantalla informa que no se inició una sesión.
- **Crear Cuenta:** conserva la validación del formulario, pero la creación de cuentas está temporalmente inactiva. No se crea ni se guarda ninguna cuenta.
- **Inicio:** presenta el saludo «Hola 👋», la pregunta «¿Cómo te sientes hoy?» y cinco opciones emocionales: Muy bien, Bien, Regular, Mal y Muy mal. Elegir un estado abre Registro Emocional y precarga un borrador; no se guarda hasta completar y confirmar explícitamente el registro. Incluye una tarjeta ilustrada con un mensaje tranquilo, accesos a Mi Plan de Seguridad, Mi Red de Apoyo e Información y recursos, y un botón «Necesito ayuda».
- **Registro emocional:** permite elegir un estado, seleccionar una o varias emociones (Tristeza, Ansiedad, Miedo, Enojo, Soledad, Calma, Esperanza y Otra) y añadir una nota opcional. Al pulsar «Guardar registro», valida los campos y conserva el registro en memoria durante la sesión actual.
- **Mi Bienestar:** consulta los registros guardados en la sesión actual. Permite filtrar por los últimos siete días, el mes calendario actual y el año calendario actual; cada tarjeta muestra estado, emociones y fecha. Los registros se pierden al cerrar o recargar la app.
- **Mi Plan de Seguridad:** presenta señales de alerta, acciones de autocuidado, personas y lugares de apoyo y contactos de confianza. La gestión sincronizada de personas y lugares está temporalmente inactiva; las otras secciones se editan en memoria y se pierden al cerrar o recargar la app. Incluye orientación para contactar al personal de Metro, los servicios locales de emergencia y el sitio oficial de Metro.
- **Red de apoyo:** conserva la pantalla, pero muestra que los contactos sincronizados están temporalmente inactivos. Los datos remotos no se han eliminado, aunque esta versión no puede consultarlos.
- **Necesito ayuda:** permite confirmar y abrir la llamada a *4141 y acceder a Red de Apoyo, Plan de Seguridad y Registro Emocional. La gestión de contactos y llamadas/SMS desde la lista están inactivas. La llamada a *4141 requiere confirmación y, en navegadores no compatibles, la app informa el número para marcar desde un teléfono.
- **Información y recursos:** contiene un espacio para información de apoyo y prevención.
- **Perfil:** conserva la interfaz y las preferencias de vista previa. La cuenta y la gestión de sesión no están disponibles sin autenticación.

## Navegación y experiencia de uso

La ruta inicial y las rutas desconocidas llevan al **Login**. Las demás pantallas conservan sus rutas y pueden abrirse directamente; no hay autenticación configurada. En Inicio, elegir un estado conduce a Registro Emocional; el registro se guarda en memoria únicamente al pulsar «Guardar registro». Las pantallas incluyen una barra inferior para acceder a **Inicio**, **Mi bienestar**, **Plan** y **Red de apoyo**.

La cabecera compartida muestra el logotipo de **CONTIGO** con una hoja decorativa, el acceso a **Perfil** y un acceso a **Necesito ayuda**. En pantallas móviles estrechas, el botón de ayuda se compacta a un icono accesible para dejar visible el logotipo.

La pantalla Inicio usa fondos claros, superficies redondeadas, acentos pastel y una ilustración decorativa hecha con SVG local. Se conservaron las rutas e interacciones existentes. La interfaz se adaptó y comprobó en anchos de 320 px y 375 px, sin desbordamiento horizontal.

## Tecnologías y estructura

- **Ionic y Angular** para la interfaz y sus componentes.
- **TypeScript** para la lógica de la aplicación.
- **Capacitor** como base para una posible integración con plataformas móviles.
- **Vitest** para las pruebas automatizadas.

Las pantallas están organizadas por áreas funcionales dentro de `src/app/features/`, y la navegación principal se define en `src/app/app.routes.ts`.

## Privacidad y alcance actual

El registro emocional y el plan se mantienen temporalmente en memoria de la sesión y no se envían a ningún backend. La autenticación, la creación de cuentas y la sincronización de contactos están inactivas. Los datos remotos que pudieran existir no se modifican ni se eliminan mediante esta versión.

Las secciones de apoyo ofrecen contenido orientativo, no planes personalizados. La aplicación no diagnostica, no reemplaza la atención profesional y no debe interpretarse como un servicio de emergencia.

## Verificar cambios

Desde la raíz del proyecto, ejecuta las pruebas, el lint y la compilación de producción:

```powershell
npm.cmd test -- --watch=false --configuration=ci
npm.cmd run lint
npm.cmd run build
```
- Validación OpenSpec: correcta para la especificación principal `home-screen`; los cambios de Login y los rediseños de Inicio están registrados en sus artefactos OpenSpec.
- La compilación muestra avisos no bloqueantes porque los estilos de Inicio y Crear Cuenta superan el umbral de aviso de 3 kB; ambos permanecen por debajo del límite de error de 4 kB.

La compilación y las pruebas se pueden ejecutar con los comandos descritos en **Desarrollo local**.