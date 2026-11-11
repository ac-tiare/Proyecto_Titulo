# Tasks

## 1. Modelos y datos iniciales

- [x] 1.1 Añadir los modelos Prisma `Resource` y `UserNotificationPreference`, sus categorías, valores predeterminados y relación por cuenta; crear migración aditiva y verificar `prisma generate` y `prisma migrate deploy` en una base aislada.
- [x] 1.2 Crear una carga inicial idempotente para los artículos y enlaces existentes, distribuidos en las cuatro categorías acordadas; documentar cómo ejecutarla y verificar que repetirla no duplica recursos y que todas las categorías quedan representadas.
- [x] 1.3 Incluir la nueva preferencia en la eliminación transaccional de cuenta y agregar pruebas de que una cuenta se elimina junto con sus preferencias sin afectar las de otra cuenta.

## 2. API del catálogo de recursos

- [x] 2.1 Implementar lectura de recursos con filtro de categoría validado, orden estable, metadatos y detalle completo; agregar pruebas HTTP para listado, filtro, categoría inválida y recurso inexistente, y documentar los endpoints y sus respuestas en `backend/API.md`.

## 3. API de preferencias

- [x] 3.1 Implementar `GET` y `PUT /api/users/preferences` con autenticación, identidad derivada de la sesión, defaults desactivados, indicador de configuración persistida y validación del conjunto completo; agregar pruebas HTTP de no autenticación, aislamiento entre cuentas, actualización, valores inválidos y preferencias ausentes, y documentar el contrato en `backend/API.md`.

## 4. Catálogo en Angular/Ionic

- [x] 4.1 Crear el servicio API tipado y actualizar la vista existente para consumir recursos remotos y exponer las cuatro categorías sin perder detalle ni filtro activo; agregar pruebas del servicio y de la pantalla para filtrado, contenido completo, carga, vacío, error/reintento y accesibilidad.

## 5. Preferencias en Angular/Ionic

- [x] 5.1 Actualizar el servicio de preferencias para usar el backend como fuente confirmada, conservar cambios locales pendientes por usuario y migrar la clave local existente cuando no haya preferencia remota; agregar pruebas de sincronización, recuperación sin conexión, reconciliación por categoría y aislamiento al cambiar de cuenta.
- [x] 5.2 Conectar la pantalla existente a preferencias persistentes y estados de sincronización, solicitar permiso al habilitar y mantener cada toggle desactivado si se deniega; agregar pruebas de toggles independientes, permisos concedidos/denegados, fallback visible y aclaración de que no se programa ni entrega una notificación.

## 6. Verificación de integración

- [x] 6.1 Ejecutar suites de backend y frontend, builds y lint; verificar migración y carga inicial en base aislada, funcionamiento de las rutas existentes y que Plan de Seguridad, Diario Emocional y Necesito Ayuda siguen disponibles con todas las preferencias desactivadas.
