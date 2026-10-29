# Spec Delta

## Purpose

Permite configurar notificaciones optativas y entregarlas en segundo plano en las plataformas compatibles, sin incluir contenido emocional ni depender de Firebase.

## ADDED Requirements

### Requirement: La persona configura sus notificaciones
La aplicación SHALL permitir activar o desactivar categorías de avisos y ajustar su programación, y SHALL conservar las preferencias asociadas a la cuenta autenticada.

#### Scenario: La persona habilita una categoría
- **WHEN** activa una categoría y el sistema operativo o navegador concede el permiso requerido
- **THEN** la preferencia queda guardada y se programa la entrega para los dispositivos registrados de su cuenta

#### Scenario: La persona desactiva una categoría
- **WHEN** deshabilita una categoría activa
- **THEN** se detienen los avisos futuros de esa categoría sin modificar las otras preferencias

### Requirement: La persona controla sus suscripciones de dispositivo
La API SHALL permitir registrar y revocar las suscripciones de notificación de los dispositivos autenticados, asociándolas únicamente a la persona de la sesión.

#### Scenario: La persona concede permiso y registra un dispositivo
- **WHEN** habilita notificaciones en un dispositivo y el proveedor entrega una suscripción válida
- **THEN** la suscripción queda asociada a su cuenta y no es accesible desde otra cuenta

#### Scenario: La persona revoca el permiso o cierra sesión
- **WHEN** revoca notificaciones o elimina la suscripción de un dispositivo
- **THEN** el sistema deja de enviar avisos a esa suscripción

### Requirement: Los avisos no exponen información sensible
Las notificaciones SHALL usar títulos y mensajes genéricos y SHALL NOT incluir estados de ánimo, emociones, notas, contactos ni contenido del plan de seguridad.

#### Scenario: Se muestra una notificación en pantalla bloqueada
- **WHEN** el sistema operativo o navegador presenta un aviso de CONTIGO
- **THEN** el texto no revela información personal ni el contenido del historial emocional

### Requirement: El envío no depende de Firebase
La aplicación y el backend SHALL NOT integrar Firebase para autenticación, almacenamiento o transporte de notificaciones, y SHALL NOT informar soporte de entrega en una plataforma sin una integración validada para esa plataforma.

#### Scenario: Se evalúa la entrega push Android
- **WHEN** se propone habilitar entrega push para Android
- **THEN** se exige una prueba de factibilidad y funcionamiento con un proveedor que no dependa de Firebase antes de declarar la plataforma compatible

#### Scenario: Una plataforma no tiene entrega validada
- **WHEN** una persona configura notificaciones en una plataforma sin un transporte validado
- **THEN** la aplicación comunica la limitación y no indica que los avisos están programados
