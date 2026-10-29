# Spec Delta

## Purpose

Da a la persona información comprensible sobre los datos asociados a su cuenta y controles autenticados para obtener una copia o eliminar sus datos personales.

## ADDED Requirements

### Requirement: La persona conoce qué datos guarda CONTIGO
La aplicación SHALL explicar qué categorías de datos se guardan y para qué se usan, y SHALL distinguir el historial emocional de la información de perfil y apoyo.

#### Scenario: La persona consulta la información de privacidad
- **WHEN** abre la sección de privacidad
- **THEN** puede conocer las categorías de datos de su cuenta, su uso en CONTIGO y cómo solicitar una copia o eliminación

### Requirement: La persona exporta sus datos personales
La API SHALL permitir que una persona autenticada obtenga una exportación estructurada de los datos personales persistidos asociados a su propia cuenta, excluyendo contraseñas, hashes, credenciales de sesión y tokens de dispositivo.

#### Scenario: La persona solicita una exportación
- **WHEN** solicita sus datos con una sesión vigente
- **THEN** recibe su perfil, registros emocionales, plan de seguridad y contactos de confianza en un formato legible por máquina; los controles de notificación temporales no se presentan como preferencias persistidas

#### Scenario: La solicitud de exportación no está autenticada
- **WHEN** se solicita una exportación sin una sesión válida
- **THEN** la API rechaza la solicitud sin revelar datos personales

### Requirement: La persona elimina su cuenta y datos asociados con confirmación
La API SHALL permitir la eliminación explícita de la cuenta autenticada y sus datos personales persistidos asociados solo después de una confirmación deliberada.

#### Scenario: La persona confirma la eliminación
- **WHEN** confirma la eliminación desde una sesión válida
- **THEN** el sistema elimina la cuenta y sus sesiones, registros emocionales, plan y contactos asociados; las preferencias y suscripciones de notificación se incorporarán cuando esa capacidad se implemente

#### Scenario: La persona no confirma la eliminación
- **WHEN** cancela la confirmación o la solicitud no contiene la confirmación requerida
- **THEN** el sistema conserva la cuenta y todos sus datos

#### Scenario: La persona intenta eliminar datos de otra cuenta
- **WHEN** la solicitud incluye un identificador de otra persona
- **THEN** el sistema limita la operación a la identidad autenticada y no elimina ni revela datos ajenos

### Requirement: Las operaciones de privacidad no filtran contenido sensible
El sistema SHALL excluir notas emocionales, contenido del plan, datos de contactos y credenciales de los registros operacionales de exportación y eliminación.

#### Scenario: Se procesa una exportación o eliminación
- **WHEN** el backend registra metadatos de la operación
- **THEN** los registros operacionales no incluyen el contenido personal ni secretos de autenticación
