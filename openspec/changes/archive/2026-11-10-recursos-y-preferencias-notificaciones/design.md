# Design

## Context

Consulta `proposal.md` y los contratos en `specs/resources/spec.md` y `specs/notifications/spec.md`. Las rutas de frontend `/recursos` y `/configuracion-notificaciones` ya existen. Recursos usa siete artículos definidos en el componente y filtros con cuatro categorías que actualmente combinan Bienestar Emocional con Autocuidado y Búsqueda de Ayuda con Prevención. La configuración ya presenta tres categorías, solicita permiso con Capacitor Local Notifications en nativo y la API Web de notificaciones en navegador, y guarda preferencias bajo una clave local por usuario. El backend usa Express, autenticación mediante `requireAuth`, validación con Zod y Prisma/PostgreSQL.

## Goals / Non-Goals

**Goals:**
- Convertir el catálogo existente en contenido servido por API, conservando artículos y enlaces de apoyo.
- Persistir en el backend las preferencias de la cuenta autenticada y sincronizar el respaldo local por usuario.
- Mantener estados de error explícitos para que ni un fallo de API ni un cambio local pendiente parezcan un guardado remoto confirmado.

**Non-Goals:**
- Programar, enviar o prometer notificaciones locales o push.
- Añadir administración de contenido, analítica individual de recursos o recomendaciones personalizadas.
- Añadir un proveedor remoto de notificaciones o una dependencia nueva de Capacitor.

## Decisions

### Catálogo de recursos como contenido compartido

Crear el modelo `Resource` con identificador estable, título, resumen, contenido, categoría, URL de imagen opcional y fecha de creación. La categoría se representa con los slugs `bienestar-emocional`, `senales-alerta`, `autocuidado` y `busqueda-ayuda-prevencion`, correspondientes a los cuatro temas visibles. El contenido estructurado conserva los párrafos actuales; los enlaces asociados se almacenan como metadatos estructurados para no perder las acciones telefónicas y sitios de orientación ya presentes. Las imágenes se mantienen opcionales y el catálogo actual puede usar `null`.

Los endpoints de lectura no requieren sesión: el catálogo no contiene datos personales y así sus recursos informativos no dependen de la autenticación. La lista devuelve metadatos y acepta un filtro de categoría validado; el detalle devuelve el contenido completo. Se mantiene orden estable por categoría y título. Los errores de identificador o categoría inválidos usan las respuestas de error existentes, sin devolver contenido aproximado.

Alternativa considerada: conservar artículos en el bundle y solo añadir filtros locales. Se descarta porque no cumpliría la fuente de datos requerida en backend ni permitiría que el detalle y el listado reflejen el contenido persistido.

Los siete artículos actuales se trasladan mediante una carga inicial idempotente con identificadores estables. El seeding conserva títulos, párrafos, categorías y enlaces, y se documenta como paso necesario del despliegue. La página conserva su ruta, filtros y acordeones, pero consume el servicio API y diferencia carga, vacío y error.

### Preferencias asociadas a la identidad autenticada

Añadir una relación uno-a-uno `UserNotificationPreference`, con valores booleanos desactivados por defecto para recordatorios del diario emocional, bienestar preventivo y plan de seguridad, además de fecha de actualización. `GET /api/users/preferences` y `PUT /api/users/preferences` usan `requireAuth`; el servidor obtiene `userId` de la sesión y nunca de un identificador enviado por el cliente. Un `PUT` valida el conjunto completo de categorías antes de persistirlo. Un `GET` sin registro devuelve los valores predeterminados e indica si ya existe una preferencia persistida, para distinguir defaults de una elección previa.

Alternativa considerada: añadir columnas directamente a `User`. Se elige un modelo relacionado para mantener separada la configuración de preferencias del perfil y permitir incorporar categorías sin ampliar el modelo de autenticación. La relación mantiene las restricciones referenciales existentes; la eliminación transaccional de cuenta debe borrar primero esta fila para no romper el flujo de privacidad.

### Respaldo local y sincronización sin conexión

Se conserva el almacenamiento local con una clave por `userId`, guardando solo booleanos y estado de sincronización, nunca credenciales. En línea, el backend es la fuente confirmada: las respuestas guardadas actualizan la copia local. Si una operación falla por falta de conexión, la pantalla mantiene el cambio local y lo marca explícitamente como pendiente. Al recuperar conectividad o volver a entrar en la pantalla, se consulta el backend, se aplican al estado remoto únicamente las categorías modificadas sin conexión y se envía el conjunto resultante mediante `PUT`; el estado pendiente se elimina solo al recibir confirmación. Si una categoría cambió tanto en el servidor como localmente durante la desconexión, prevalece la última acción local para esa categoría; las demás categorías se conservan desde el servidor.

La primera sincronización detecta las preferencias ya guardadas por versiones anteriores en la clave local existente. Si el backend todavía no tiene una fila persistida, esos valores se suben antes de mostrar los defaults remotos; si ya existe una fila, prevalece el estado del servidor. Los errores de autenticación no se tratan como desconexión y no se sincroniza ningún dato hasta que haya una sesión válida.

Alternativa considerada: revertir el toggle al fallar cualquier petición. Se descarta porque contradice el respaldo local solicitado; en cambio, la interfaz diferencia el estado pendiente del estado confirmado.

### Permisos del dispositivo sin servicio de entrega

Se reutiliza `NotificationPermissionService` y el plugin Capacitor Local Notifications ya instalado para solicitar permiso solo durante la primera activación; el navegador mantiene su comprobación de disponibilidad existente. Si el permiso se rechaza o no se admite, la categoría no se activa y la interfaz explica la limitación. No se añade programación local, worker ni push: el permiso y la preferencia representan consentimiento/configuración, no una entrega garantizada.

Alternativa considerada: añadir push remoto o programar recordatorios locales en este cambio. Se descarta porque no se definieron horarios ni eventos de entrega y el alcance confirmado excluye programar avisos.

## Risks / Trade-offs

- [La persona puede interpretar una preferencia activa como una promesa de recibir avisos] → La interfaz y la documentación indican que esta entrega solo guarda preferencias y permisos; no confirma programación ni envío.
- [Una copia local puede contener valores antiguos o pendientes] → Mostrar su estado, sincronizar únicamente tras autenticar la misma cuenta y borrar el indicador solo tras confirmación del backend.
- [Una edición sin conexión puede competir con cambios de otro dispositivo] → Consultar el estado remoto al reconectar, aplicar solo categorías pendientes y documentar que la acción local más reciente prevalece para esas categorías.
- [La preferencia relacionada puede impedir la eliminación de una cuenta] → Incluirla en la transacción existente de eliminación y probar las restricciones referenciales.
- [Una consulta fallida puede parecer un catálogo vacío] → Representar por separado error, carga y lista vacía, con acción explícita de reintento.
- [Los artículos de apoyo pueden quedar desactualizados] → Mantener la carga inicial versionada y conservar la advertencia para confirmar horarios y canales en fuentes oficiales.

## Migration Plan

1. Añadir los modelos Prisma y migración aditiva para recursos y preferencias; generar el cliente y comprobar la migración en la base de pruebas.
2. Cargar idempotentemente los artículos existentes y verificar que las cuatro categorías y los enlaces de apoyo estén completos.
3. Implementar endpoints de recursos y preferencias; verificar respuestas de error, autenticación y aislamiento por cuenta.
4. Desplegar backend y migración antes de la versión frontend que consulta el catálogo y sincroniza preferencias.
5. En la primera carga de preferencias, migrar la copia local anterior solo si el backend no tiene una preferencia guardada para esa cuenta.
6. Ejecutar pruebas de API, servicios y pantallas; comprobar el acceso a funciones principales con todos los avisos desactivados.
7. Para revertir la aplicación, volver a la versión frontend anterior. No borrar tablas ni datos durante rollback; la migración de base de datos es aditiva y se conserva para el siguiente despliegue.
