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

La base utiliza Ionic, Angular, TypeScript y Capacitor. Esta etapa contiene pantallas y contenido de demostración; no implementa inicio de sesión, almacenamiento de datos, Firebase, análisis emocional ni notificaciones push. El contenido de ejemplo no representa datos personales, y la aplicación no diagnostica ni reemplaza la atención profesional.

## Estructura OpenSpec

Las propuestas, especificaciones, decisiones técnicas y tareas del proyecto se mantienen en `openspec/`.

**********************************************************************************************


## Funcionalidades implementadas

CONTIGO cuenta con una base visual y funcional para una aplicación móvil de apoyo temprano. La navegación conecta las siguientes pantallas:

- **Inicio:** presenta accesos a las secciones principales y a las herramientas de apoyo.
- **Registro emocional:** permite seleccionar un estado emocional. La selección se mantiene temporalmente en memoria y se borra al salir; no se guarda ni se envía.
- **Mi bienestar:** muestra el espacio destinado al bienestar. Como aún no hay registros persistentes, presenta un estado vacío y no inventa historiales ni tendencias.
- **Plan de seguridad:** ofrece orientaciones de demostración para ayudar a pensar en próximos pasos. No es un plan personalizado.
- **Red de apoyo:** muestra el espacio para contactos de confianza, sin inventar nombres ni números.
- **Necesito ayuda:** ofrece orientación general para buscar apoyo humano y contactar los servicios locales de emergencia si existe una urgencia. No incluye teléfonos o servicios específicos no verificados.
- **Información y recursos:** contiene un espacio para información de apoyo y prevención.
- **Perfil:** presenta una pantalla de perfil de demostración; no hay cuentas ni autenticación.

## Navegación y experiencia de uso

La aplicación incluye una barra inferior para acceder a **Inicio**, **Mi bienestar**, **Plan** y **Red de apoyo**. También mantiene accesos a **Perfil** y **Necesito ayuda** en la cabecera.

Se configuraron las rutas de la aplicación, el idioma español, el tema visual y estados de foco visibles para facilitar la navegación. La interfaz se revisó en una pantalla estrecha de 320 px para comprobar que no apareciera desbordamiento horizontal.

## Tecnologías y estructura

- **Ionic y Angular** para la interfaz y sus componentes.
- **TypeScript** para la lógica de la aplicación.
- **Capacitor** como base para una posible integración con plataformas móviles.
- **Vitest** para las pruebas automatizadas.

Las pantallas están organizadas por áreas funcionales dentro de `src/app/features/`, y la navegación principal se define en `src/app/app.routes.ts`.

## Privacidad y alcance actual

Esta versión es una base de interfaz y navegación. No implementa inicio de sesión, backend, Firebase, almacenamiento persistente, sincronización, análisis emocional ni notificaciones push. El registro emocional solo existe temporalmente en memoria.

El contenido es de demostración: la aplicación no diagnostica, no reemplaza la atención profesional y no debe interpretarse como un servicio de emergencia.

## Verificaciones realizadas

- Compilación de producción: correcta.
- Pruebas automatizadas: 14 pruebas aprobadas en 10 archivos.
- Lint: completado sin errores.
- Auditoría de dependencias: cero vulnerabilidades reportadas.
- Validación OpenSpec: correcta, con 11 de 11 tareas completadas.

La compilación y las pruebas se pueden ejecutar con los comandos descritos en **Desarrollo local**.