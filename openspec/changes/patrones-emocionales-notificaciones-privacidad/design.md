# Design

## Context

See `proposal.md` for the motivation and `specs/` for the behavior contracts. CONTIGO usa Angular/Ionic/Capacitor, Express, Prisma y PostgreSQL. El historial emocional ya tiene filtros semana/mes/año y aislamiento por cuenta. El perfil contiene controles de notificación temporales y una sección de privacidad informativa. Las relaciones de datos personales usan `RESTRICT`, por lo que eliminar una cuenta requiere una operación explícita sobre sus dependencias. El repositorio no integra Firebase.

El plugin oficial de push de Capacitor utiliza FCM en Android. La decisión del producto es no usar Firebase; por ello la compatibilidad Android no se presume y debe validarse antes de habilitar o declarar push multiplataforma.

## Goals / Non-Goals

**Goals:**
- Derivar tendencias agregadas de los registros propios sin consultar ni mostrar notas.
- Mantener la entrega push en pausa hasta validar un proveedor no Firebase para Android en un dispositivo real.
- Exportar y eliminar los datos asociados a una cuenta sin exponer credenciales ni datos de otras cuentas.
- Preservar el backend PostgreSQL propio y la prohibición de Firebase.

**Non-Goals:**
- Diagnosticar, predecir crisis, puntuar riesgo o enviar alertas clínicas.
- Usar notas emocionales como entrada del análisis o contenido de notificación.
- Enviar a un proveedor externo estados de ánimo, emociones, notas, plan de seguridad o contactos.
- Garantizar soporte Android remoto antes de demostrar un transporte no Firebase que funcione en el dispositivo objetivo.
- Afirmar cumplimiento legal o clínico sin revisión especializada.

## Decisions

### Tendencias calculadas en el backend

Agregar una ruta autenticada de patrones que acepta los períodos ya usados por el historial. El servidor obtiene la identidad desde la sesión y calcula conteos de estados y emociones y buckets temporales; no devuelve notas ni persiste una evaluación derivada. La respuesta incluye el período y el número de registros. Si no existen registros, muestra el estado vacío; solo se comparan buckets cuando hay registros en más de un día. Esto evita descargar el historial completo al dispositivo y mantiene el análisis consistente.

Alternativa considerada: calcular las tendencias en Angular a partir de las páginas del historial. Se descarta porque requeriría cargar varias páginas y duplicar reglas, y aumentaría la cantidad de datos emocionales transferidos al cliente.

### Push sin Firebase, con puerta de factibilidad Android

Las preferencias de categoría, hora local y zona horaria, las suscripciones de dispositivos y el worker de entrega quedan fuera de esta fase. Los controles visuales actuales son temporales y no se exportan como si fueran datos persistidos. Su diseño y requisitos siguen descritos en la capacidad de notificaciones, pero no se declaran implementados hasta validar primero un transporte compatible.

Antes de implementar el transporte Android, una tarea de factibilidad debe comprobar una opción no Firebase con un dispositivo real, documentar requisitos del usuario y confirmar que no depende indirectamente de FCM. La documentación oficial del plugin de push de Capacitor confirma el uso de FCM en Android; UnifiedPush es una alternativa basada en distribuidores, cuya disponibilidad no es universal. No se habilita Android ni se afirma paridad hasta completar esta prueba. Si no hay proveedor viable, se pausa para que la usuaria decida si cambia la restricción o el alcance.

Alternativas consideradas: usar el plugin estándar de Capacitor con FCM (contradice la restricción explícita) o prometer notificaciones locales idénticas en web y móvil (no garantiza entrega web con la página cerrada). Ambas se descartan.

### Permisos y contenido de notificaciones

La aplicación solicita permiso solo cuando la persona activa una categoría. Si se deniega, conserva las demás funciones y explica la limitación. Al desactivar una categoría, se detienen sus entregas futuras; al revocar una suscripción, se elimina del backend y se solicita su revocación al proveedor cuando este lo permita. Las categorías parten desactivadas hasta la acción explícita de la persona.

El payload contiene únicamente una categoría técnica y un texto genérico. No se envían identificadores de registros, emociones ni texto escrito por la persona al proveedor.

### Exportación y eliminación explícitas

La exportación es JSON, se genera para la identidad autenticada y se sirve como respuesta privada sin persistir un archivo temporal en el servidor. Incluye perfil, registros, plan y contactos que ya persisten; excluye hashes y sesiones. Las preferencias y suscripciones de notificación no se incluyen porque aún no se guardan en la base de datos.

La eliminación requiere sesión vigente y confirmación deliberada. En una transacción se eliminan primero sesiones, registros emocionales, plan y contactos propios, y finalmente la cuenta; no se confía en cascadas desde usuario. La revocación de suscripciones de notificación se añadirá junto con esa capacidad, antes de habilitar registros de dispositivos. El flujo informa que las copias de respaldo se rigen por la política documentada de retención y no son accesibles desde la aplicación.

Alternativa considerada: borrar solo el perfil o anonimizarlo conservando registros. Se descarta para esta entrega porque la persona pidió eliminar la cuenta y sus datos asociados.

### Versionado de datos y despliegue

Las nuevas tablas y restricciones se agregan mediante migración Prisma incremental. La implementación conserva las migraciones existentes y prueba actualización y eliminación sobre una base de tests aislada. El worker usa la misma imagen/configuración segura del backend y una tarea única por horario para evitar envíos duplicados.

## Risks / Trade-offs

- [No existe un proveedor Android no Firebase universalmente disponible] → Ejecutar la prueba de factibilidad primero y bloquear la promesa de paridad hasta validar un transporte real; si falla, pedir una decisión de alcance.
- [Un envío duplicado o fuera de horario puede ser intrusivo] → Persistir claves de idempotencia, respetar zona horaria y preferencias, y probar cambios de horario y revocación.
- [Una notificación puede revelar información en una pantalla bloqueada] → Mantener todo el contenido genérico y no transmitir datos emocionales al proveedor.
- [La exportación o eliminación puede cruzar datos de cuentas] → Filtrar por identidad autenticada, probar aislamiento con dos cuentas y excluir secretos.
- [La eliminación tiene efectos irreversibles] → Requerir acción confirmada, comunicar el alcance antes de ejecutar y probar la transacción completa.
- [Las copias de seguridad pueden conservar datos ya eliminados hasta vencer su retención] → Documentar el período operacional y no presentar la eliminación de la cuenta como purga instantánea de respaldos.

## Migration Plan

1. Probar primero la factibilidad de notificaciones Android no Firebase y documentar requisitos y resultado.
2. Si el transporte pasa la prueba, definir adaptadores por plataforma, secretos y operación del proveedor sin registrar tokens en repositorio.
3. Añadir migraciones aditivas para preferencias, suscripciones y entregas idempotentes; verificar migración y rollback de aplicación sin borrar volúmenes.
4. Implementar agregaciones y controles de exportación/eliminación para los datos persistidos actuales, con pruebas de propietario y dos cuentas.
5. Mantener la configuración persistente, suscripciones y entrega push fuera de esta fase hasta resolver la validación del proveedor; integrar en Perfil únicamente los controles de privacidad disponibles.
6. Desplegar primero migraciones compatibles; habilitar avisos por plataforma solo después de comprobar el proveedor y el permiso.

Si la prueba Android falla, detener esa parte y consultar antes de permitir FCM, aceptar un proveedor alternativo con limitaciones o reducir la paridad. No retirar ni borrar datos existentes durante la migración.
