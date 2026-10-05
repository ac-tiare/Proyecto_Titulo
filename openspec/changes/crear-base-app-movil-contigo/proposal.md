# Proposal

## Why

CONTIGO necesita una base móvil organizada y navegable antes de incorporar servicios o datos reales. Este cambio establece una primera experiencia preventiva para pasajeros y trabajadores de Metro de Santiago, sin presentar la aplicación como un servicio clínico ni sustituir la ayuda profesional.

## What Changes

- Crear la aplicación base con Ionic, Angular, TypeScript y Capacitor, preparada para desarrollo móvil y ejecución local.
- Establecer una estructura modular y navegación accesible para las pantallas iniciales de CONTIGO.
- Incorporar Inicio y pantallas iniciales para registro emocional, bienestar e historial, plan de seguridad, red de apoyo, ayuda inmediata, información y recursos, y perfil.
- Preparar los componentes de interfaz y puntos de extensión para servicios futuros, sin conectarlos ni simular persistencia.
- Limitar los datos de demostración a contenido local y claramente identificable como de prueba.

## Capabilities

### New Capabilities
- `mobile-app-navigation`: estructura de la aplicación, navegación principal, Inicio y acceso a las pantallas iniciales.
- `emotional-wellbeing`: registro emocional inicial y presentación demostrativa del bienestar e historial, sin guardar ni analizar datos.
- `safety-support`: pantallas iniciales del plan de seguridad, red de apoyo, ayuda e información preventiva, con límites claros sobre el alcance no clínico de la aplicación.

### Modified Capabilities
- Ninguna.

## Impact

- Se crearán la configuración y el código iniciales de Ionic + Angular + Capacitor, junto con las pantallas y componentes de la aplicación.
- Se definirán límites modulares para facilitar futuras integraciones, sin implementar Firebase Authentication, Cloud Firestore, Firebase Cloud Messaging ni Chart.js en este cambio.
- No se implementarán autenticación, almacenamiento persistente, análisis o predicción de riesgo, diagnóstico, notificaciones push ni sustitución de atención profesional.
- No se introducirán dependencias adicionales a las necesarias para la base Ionic + Angular + Capacitor.
