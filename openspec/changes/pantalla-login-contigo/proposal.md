# Proposal

## Why

CONTIGO necesita una pantalla de Login que permita visualizar una entrada clara, accesible y coherente con su propósito de bienestar desde que se abre la aplicación. Como todavía no existe autenticación, el flujo debe presentarse explícitamente como demostración y permitir avanzar a Inicio sin verificar credenciales.

## What Changes

- Añadir una pantalla Login frontend con identidad visual tranquila y neutral, campos etiquetados de correo y contraseña, contraseña oculta con alternancia de visibilidad, textos de apoyo y controles secundarios.
- Hacer que Login sea la pantalla inicial y que «Iniciar sesión» continúe a Inicio en modo de demostración, sin autenticar ni validar credenciales.
- Mantener «¿Olvidaste tu contraseña?» y «Crear cuenta» como opciones visuales sin recuperación, registro ni conexiones externas; indicar que estas funciones no están disponibles todavía.
- Mantener accesibles las rutas existentes de la aplicación y su shell de navegación una vez que la persona avance desde Login.
- Asegurar que la página responda a tamaños móviles, teclado virtual, foco visible y etiquetas accesibles.

## Capabilities

### New Capabilities

- `login-screen`: Presentación accesible y adaptable de Login en modo demostración, con navegación de entrada a la aplicación existente y sin autenticación.

### Modified Capabilities

Ninguna.

## Impact

- Afecta las rutas de `src/app/app.routes.ts` y añade la página y pruebas bajo `src/app/features/`.
- Login se mostrará fuera del shell de pestañas. La ruta raíz abrirá Login; al pulsar «Iniciar sesión» se navegará a `/inicio` sin verificar los campos.
- Los destinos actuales, el shell compartido y las pantallas existentes se conservarán.
- No se añaden dependencias, servicios de autenticación, persistencia, Firebase, Firestore ni APIs externas.
