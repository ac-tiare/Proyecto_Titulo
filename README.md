# CONTIGO

Aplicación móvil preventiva de apoyo temprano para pasajeros y trabajadores de Metro de Santiago.

## Resumen de avances

- Se construyó la interfaz móvil CONTIGO con Ionic y Angular: Login y Crear Cuenta de demostración, Inicio, Registro Emocional y secciones de bienestar y apoyo. Se añadieron validaciones e interacciones frontend; no hay autenticación real ni almacenamiento persistente.
- Se ajustó el desplazamiento vertical de Inicio para que el contenido se desplace entre el encabezado y la barra inferior, manteniendo ambas áreas visibles y permitiendo llegar a las secciones finales.
- Se incorporó Docker para compilar la aplicación y servirla con Nginx. Compose ejecuta solo el frontend en `http://localhost:8080`; las rutas Angular se pueden abrir directamente y recargar. No se añadieron backend ni base de datos.
- Se documentaron en este README los pasos de ejecución local y Docker, incluidos los comandos para clonar, iniciar, comprobar, ver logs y detener la aplicación.

## Requisitos

- Node.js 24 LTS
- npm (incluido con Node.js)

## Ejecutar con Docker

Este proyecto solo necesita un contenedor: el frontend web. Angular se compila durante la construcción de la imagen y Nginx sirve los archivos resultantes. No hay backend ni base de datos en esta versión, así que no se necesita un contenedor de datos ni un archivo de contraseñas.

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

La aplicación utiliza Ionic, Angular, TypeScript y Capacitor. Incluye una interfaz navegable con pantallas de demostración. El Login todavía no autentica usuarios y los registros emocionales no se guardan ni se envían a un servicio. No se implementan Firebase, análisis emocional automático ni notificaciones push. La aplicación no diagnostica ni reemplaza la atención profesional.

## Estructura OpenSpec

Las propuestas, especificaciones, decisiones técnicas y tareas del proyecto se mantienen en `openspec/`.

## Funcionalidades implementadas

CONTIGO cuenta con una interfaz visual y navegable para una aplicación móvil de apoyo temprano. La navegación conecta las siguientes pantallas:

- **Login visual:** muestra campos etiquetados para correo y contraseña, con contraseña oculta por defecto y control para mostrarla u ocultarla. «Iniciar sesión» continúa a Inicio como demostración, sin autenticar ni validar una cuenta. «Crear cuenta» abre el formulario de registro y «¿Olvidaste tu contraseña?» informa que la recuperación aún no está disponible.
- **Crear Cuenta:** presenta campos para nombre, correo electrónico, contraseña y confirmación. Valida campos obligatorios, formato del correo y coincidencia de las contraseñas; permite mostrar u ocultar cada contraseña y volver a Login. El envío válido solo muestra una confirmación de demostración: no crea una cuenta, ni envía o persiste los datos.
- **Inicio:** presenta el saludo «Hola 👋», la pregunta «¿Cómo te sientes hoy?» y cinco opciones emocionales: Muy bien, Bien, Regular, Mal y Muy mal. Elegir una emoción abre Registro Emocional y la precarga sin guardar un registro. Incluye una tarjeta ilustrada con un mensaje tranquilo, accesos a Mi Plan de Seguridad, Mi Red de Apoyo e Información y recursos, y un botón «Necesito ayuda».
- **Registro emocional:** permite elegir un estado, seleccionar una o varias emociones (Tristeza, Ansiedad, Miedo, Enojo, Soledad, Calma, Esperanza y Otra), añadir una nota opcional y consultar la fecha local del registro. Al pulsar «Guardar registro», valida los campos obligatorios y muestra una confirmación. El registro se mantiene solo en memoria mientras dura la sesión; abandonar el formulario no lo guarda, y no se escribe en el dispositivo ni se envía a servicios externos.
- **Mi bienestar:** muestra el espacio destinado al bienestar. Como aún no hay registros persistentes, presenta un estado vacío y no inventa historiales ni tendencias.
- **Plan de seguridad:** ofrece orientaciones de demostración para ayudar a pensar en próximos pasos. No es un plan personalizado.
- **Red de apoyo:** muestra el espacio para contactos de confianza, sin inventar nombres ni números.
- **Necesito ayuda:** ofrece orientación general para buscar apoyo humano y contactar los servicios locales de emergencia si existe una urgencia. No incluye teléfonos o servicios específicos no verificados.
- **Información y recursos:** contiene un espacio para información de apoyo y prevención.
- **Perfil:** presenta una pantalla de perfil de demostración; no hay cuentas ni autenticación.

## Navegación y experiencia de uso

La ruta inicial y las rutas desconocidas llevan al **Login**. Desde allí, «Crear cuenta» abre el formulario de demostración y «Iniciar sesión» abre Inicio en modo demostración. En Inicio, elegir una emoción conduce a Registro Emocional; solo «Guardar registro» confirma el borrador temporal. Las pantallas de la aplicación incluyen una barra inferior para acceder a **Inicio**, **Mi bienestar**, **Plan** y **Red de apoyo**.

La cabecera compartida muestra el logotipo de **CONTIGO** con una hoja decorativa, el acceso a **Perfil** y un acceso a **Necesito ayuda**. En pantallas móviles estrechas, el botón de ayuda se compacta a un icono accesible para dejar visible el logotipo.

La pantalla Inicio usa fondos claros, superficies redondeadas, acentos pastel y una ilustración decorativa hecha con SVG local. Se conservaron las rutas e interacciones existentes. La interfaz se adaptó y comprobó en anchos de 320 px y 375 px, sin desbordamiento horizontal.

## Tecnologías y estructura

- **Ionic y Angular** para la interfaz y sus componentes.
- **TypeScript** para la lógica de la aplicación.
- **Capacitor** como base para una posible integración con plataformas móviles.
- **Vitest** para las pruebas automatizadas.

Las pantallas están organizadas por áreas funcionales dentro de `src/app/features/`, y la navegación principal se define en `src/app/app.routes.ts`.

## Privacidad y alcance actual

Esta versión es una base de interfaz y navegación. El Login no usa autenticación real, backend ni Firebase; sus campos no se envían a ningún servicio y el botón principal solo permite continuar a Inicio en modo demostración. El registro emocional solo existe temporalmente en memoria: no hay almacenamiento persistente, sincronización ni análisis emocional. Tampoco se implementan notificaciones push.

El contenido es de demostración: la aplicación no diagnostica, no reemplaza la atención profesional y no debe interpretarse como un servicio de emergencia.

## Verificaciones realizadas

- Compilación de producción: correcta.
- Pruebas automatizadas: 28 pruebas aprobadas en 12 archivos.
- Lint: completado sin errores.
- Validación OpenSpec: correcta para la especificación principal `home-screen`; los cambios de Login y los rediseños de Inicio están registrados en sus artefactos OpenSpec.
- La compilación muestra avisos no bloqueantes porque los estilos de Inicio y Crear Cuenta superan el umbral de aviso de 3 kB; ambos permanecen por debajo del límite de error de 4 kB.

La compilación y las pruebas se pueden ejecutar con los comandos descritos en **Desarrollo local**.