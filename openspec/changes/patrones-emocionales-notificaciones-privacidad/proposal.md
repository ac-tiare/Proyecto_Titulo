# Proposal

## Why

CONTIGO ya persiste el historial emocional, pero no ayuda a reconocer tendencias; las preferencias de notificaciones solo existen mientras la pantalla está abierta y la sección de privacidad es informativa. Se necesitan herramientas claras para revisar patrones personales, configurar avisos optativos y ejercer control sobre los datos propios.

## What Changes

- Agregar un resumen descriptivo de tendencias emocionales usando únicamente el historial de la cuenta autenticada, sin diagnósticos, predicción de crisis ni puntuación de riesgo.
- Mantener la configuración persistente y la entrega push en pausa hasta validar una alternativa Android sin Firebase en un dispositivo real; no prometer soporte para plataformas no verificadas.
- Mantener los avisos genéricos, sin enviar contenido emocional a proveedores de notificaciones.
- Permitir exportar los datos personales actualmente persistidos y solicitar la eliminación de la cuenta y sus datos asociados mediante una acción autenticada y confirmada. Las preferencias y suscripciones de notificación quedan fuera de esta fase porque aún no se persisten.
- Ampliar la información de privacidad para explicar el uso y control de los datos, y mantener el contenido de notificaciones genérico para no exponer información sensible en la pantalla bloqueada.

## Capabilities

### New Capabilities
- `emotional-patterns`: visualización de tendencias descriptivas del historial propio.
- `notifications`: preferencias, registro de dispositivos y entrega de notificaciones optativas.
- `personal-data-controls`: exportación y eliminación autenticada de los datos de la cuenta.

### Modified Capabilities

## Impact

- Frontend Angular/Ionic: historial emocional, perfil y configuración existente.
- Backend Express/Prisma y PostgreSQL: endpoints de exportación y eliminación, y operación transaccional que respete las relaciones existentes.
- Capacitor y web: permisos, registro de dispositivos y entrega push, sujeta a la validación técnica sin Firebase en Android.
- Documentación: alcance del análisis descriptivo, privacidad, exportación, eliminación y configuración por dispositivo.
