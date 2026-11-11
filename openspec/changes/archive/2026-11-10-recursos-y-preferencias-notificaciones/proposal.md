# Proposal

## Why

La aplicación ya muestra artículos de apoyo y controles de notificación, pero los artículos están definidos en el frontend y las preferencias solo se guardan en el dispositivo. Este cambio permitirá mantener el catálogo en el backend y asociar las preferencias a la cuenta, conservando el acceso a las funciones de apoyo aunque se desactiven los avisos.

## What Changes

- Incorporar un catálogo de recursos consultable por categoría, con contenido completo y navegación accesible.
- Exponer endpoints para listar recursos, filtrarlos por categoría y consultar un recurso por identificador.
- Persistir las preferencias de notificación por cuenta y sincronizarlas con la pantalla existente.
- Solicitar permiso del dispositivo de forma explícita al habilitar por primera vez una categoría.
- Mantener una copia local de preferencias por usuario para uso sin conexión, indicando cuando un cambio todavía no se ha sincronizado.
- Limitar este alcance a permisos y preferencias: no programa ni promete la entrega de notificaciones push o locales.

## Capabilities

### New Capabilities

- `resources`: catálogo de información y recursos organizado en temáticas, con filtrado y vista de detalle.
- `notifications`: preferencias de notificación por cuenta, solicitud de permisos y comportamiento de respaldo local.

### Modified Capabilities

## Impact

- Frontend Angular/Ionic: páginas existentes de recursos y configuración de notificaciones, servicios API y sus pruebas.
- Backend Express/Prisma/PostgreSQL: modelos, migraciones, endpoints públicos de lectura de recursos y endpoints autenticados de preferencias.
- Capacitor Local Notifications: reutilización del plugin instalado para solicitar permisos en dispositivos compatibles; no se integra transporte ni programación de avisos.
