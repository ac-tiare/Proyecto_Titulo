# Proposal

## Why

CONTIGO presenta actualmente flujos de demostración: Crear Cuenta no crea usuarios reales y los registros emocionales solo permanecen en memoria. La integración con Firebase permitirá autenticar a cada persona y guardar y consultar su historial de forma persistente y aislada por UID.

## What Changes

- Reemplazar el alta demostrativa por Firebase Authentication con correo y contraseña, validación existente, nombre de perfil y errores comprensibles; permitir iniciar y cerrar sesión.
- Exigir una sesión autenticada en todas las pantallas de la aplicación, incluidas Inicio, Mi Bienestar, perfil y las pantallas informativas o de ayuda. Solo Login y Crear Cuenta serán públicas.
- Persistir registros emocionales en Cloud Firestore únicamente tras la confirmación explícita de la persona; permitir indicar el texto de «Otra» y evitar duplicados por pulsaciones repetidas.
- Mostrar en Mi Bienestar el historial propio, ordenado desde el más reciente, junto con estados de carga, error y ausencia de registros.
- Entregar reglas de Firestore que validen identidad, propiedad, tipos y campos permitidos, además de instrucciones de configuración y publicación.
- Conservar la selección de estado desde Inicio, las interfaces y las rutas existentes.
- La configuración de Firebase Console y la región de una base Firestore nueva son prerrequisitos manuales: antes de usarlos, confirmar el proyecto y la región con la usuaria; no inventar credenciales ni guardar secretos en Git.

## Capabilities

### New Capabilities

- `user-authentication`: autenticación, cierre de sesión y protección global de rutas.
- `emotional-history`: consulta privada y presentación del historial emocional en Mi Bienestar.

### Modified Capabilities

- `user-registration`: el formulario deja de ser una demostración y crea cuentas en Firebase Authentication.
- `emotional-entry`: el registro se conserva en Firestore después de confirmación, con validación y aislamiento por UID.

## Impact

- Afecta las pantallas existentes de Login, Crear Cuenta, Registro Emocional y Mi Bienestar, la configuración de rutas, el estado de sesión y el servicio temporal de registros.
- Añade el SDK web modular de Firebase, sujeto a verificar compatibilidad con Angular 22 e Ionic 9 al implementar.
- Añade configuración del cliente Firebase sin credenciales inventadas y reglas de Cloud Firestore para desplegar en Firebase Console.
- Requiere un proyecto Firebase con Authentication Email/Password habilitado y Cloud Firestore creado; no se encontró configuración Firebase existente.
- La protección de rutas mejora la privacidad, pero cambia el acceso: todas las rutas salvo `/login` y `/crear-cuenta` requerirán sesión.
