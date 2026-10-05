# CONTIGO

Aplicación móvil preventiva de apoyo temprano para pasajeros y trabajadores de Metro de Santiago.

## Requisitos

- Node.js 24 LTS
- npm (incluido con Node.js)

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

- **Login visual:** muestra campos etiquetados para correo y contraseña, con contraseña oculta por defecto y control para mostrarla u ocultarla. «Iniciar sesión» continúa a Inicio como demostración, sin autenticar ni validar una cuenta. «¿Olvidaste tu contraseña?» y «Crear cuenta» muestran avisos de que esas opciones aún no están disponibles.
- **Inicio:** presenta el saludo «Hola 👋», la pregunta «¿Cómo te sientes hoy?» y cinco opciones emocionales: Muy bien, Bien, Regular, Mal y Muy mal. Incluye una tarjeta ilustrada con un mensaje tranquilo, accesos a Mi Plan de Seguridad, Mi Red de Apoyo e Información y recursos, y un botón «Necesito ayuda».
- **Registro emocional:** permite seleccionar un estado emocional desde Inicio o desde la pantalla de registro. La elección se conserva temporalmente en memoria mientras dura la sesión de navegación; no se guarda en el dispositivo ni se envía.
- **Mi bienestar:** muestra el espacio destinado al bienestar. Como aún no hay registros persistentes, presenta un estado vacío y no inventa historiales ni tendencias.
- **Plan de seguridad:** ofrece orientaciones de demostración para ayudar a pensar en próximos pasos. No es un plan personalizado.
- **Red de apoyo:** muestra el espacio para contactos de confianza, sin inventar nombres ni números.
- **Necesito ayuda:** ofrece orientación general para buscar apoyo humano y contactar los servicios locales de emergencia si existe una urgencia. No incluye teléfonos o servicios específicos no verificados.
- **Información y recursos:** contiene un espacio para información de apoyo y prevención.
- **Perfil:** presenta una pantalla de perfil de demostración; no hay cuentas ni autenticación.

## Navegación y experiencia de uso

La ruta inicial y las rutas desconocidas llevan al **Login**. Desde allí, «Iniciar sesión» abre Inicio en modo demostración. Las pantallas de la aplicación incluyen una barra inferior para acceder a **Inicio**, **Mi bienestar**, **Plan** y **Red de apoyo**.

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
- Pruebas automatizadas: 17 pruebas aprobadas en 11 archivos.
- Lint: completado sin errores.
- Validación OpenSpec: correcta para la especificación principal `home-screen`; los cambios de Login y los rediseños de Inicio están registrados en sus artefactos OpenSpec.
- La compilación muestra un aviso no bloqueante: los estilos de Inicio superan el umbral de aviso de 3 kB, pero permanecen por debajo del límite de error de 4 kB.

La compilación y las pruebas se pueden ejecutar con los comandos descritos en **Desarrollo local**.