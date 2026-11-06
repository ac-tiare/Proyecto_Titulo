# Spec Delta

## Purpose

Permite que una persona recupere el acceso a su cuenta mediante un enlace temporal enviado por correo, sin revelar a terceros si una dirección está registrada ni exponer credenciales de recuperación.

## ADDED Requirements

### Requirement: La persona solicita un enlace de recuperación
La API SHALL aceptar una dirección de correo válida y responder con HTTP 200 y el mismo mensaje público tanto si existe una cuenta como si no, sin revelar la existencia de la cuenta. SHALL limitar las solicitudes a tres por IP y a tres por correo normalizado durante cualquier ventana de 15 minutos, sin registrar el correo en claro para aplicar el límite.

#### Scenario: Se solicita recuperación para una cuenta existente
- **WHEN** la persona envía un correo válido asociado a una cuenta
- **THEN** el sistema envía un enlace de recuperación de un solo uso y responde HTTP 200 indicando que, si la cuenta existe, recibirá instrucciones

#### Scenario: Se solicita recuperación para un correo no registrado
- **WHEN** la persona envía un correo válido no asociado a una cuenta
- **THEN** el sistema devuelve HTTP 200 y el mismo mensaje público que para una cuenta existente y no envía un correo

#### Scenario: Se excede el límite por IP o correo
- **WHEN** una IP o un correo normalizado supera tres solicitudes en 15 minutos
- **THEN** la API rechaza solicitudes adicionales con una respuesta limitada que no revela si el correo está registrado

### Requirement: El enlace de recuperación es temporal y de un solo uso
El sistema SHALL aceptar únicamente tokens criptográficamente aleatorios no vencidos, no utilizados y asociados a la cuenta correspondiente. Los tokens SHALL expirar a los 15 minutos, almacenarse solo como hash y no devolverse en respuestas de API.

#### Scenario: Se presenta un token vigente
- **WHEN** la persona envía un token válido antes de su vencimiento
- **THEN** el sistema permite completar el cambio de contraseña una sola vez

#### Scenario: Se presenta un token inválido, vencido o ya utilizado
- **WHEN** la persona intenta restablecer la contraseña con un token inválido, vencido o consumido
- **THEN** el sistema rechaza el cambio y solicita generar un nuevo enlace

### Requirement: La persona restablece su contraseña de forma segura
La API SHALL validar para registro y restablecimiento una contraseña de 8 a 128 caracteres que contenga al menos un número, almacenarla con Argon2id y revocar las sesiones activas de la cuenta al completar el cambio.

#### Scenario: Se completa el cambio de contraseña
- **WHEN** la persona confirma una contraseña válida con un token vigente
- **THEN** la nueva contraseña permite iniciar sesión, las sesiones previas dejan de ser válidas y el token no puede reutilizarse

#### Scenario: La nueva contraseña no cumple la política
- **WHEN** la persona envía una contraseña inválida o demasiado corta
- **THEN** el sistema no modifica la contraseña ni consume el token

#### Scenario: La nueva contraseña no contiene un número
- **WHEN** la persona envía una contraseña de longitud permitida que no incluye un número
- **THEN** el sistema rechaza el cambio sin modificar la contraseña ni consumir el token

### Requirement: La persona usa pantallas claras para recuperar el acceso
La aplicación SHALL ofrecer formularios reactivos y accesibles para solicitar el enlace e ingresar una nueva contraseña, mostrar el estado de carga con un spinner, y presentar confirmaciones y errores accionables sin simular éxito. Tras un cambio exitoso, SHALL redirigir a Login y mostrar una confirmación temporal.

#### Scenario: Se solicita un enlace desde la aplicación
- **WHEN** la persona envía un correo con formato válido desde recuperación
- **THEN** la aplicación muestra la confirmación genérica del servidor sin afirmar que la cuenta existe

#### Scenario: La persona abre un enlace vencido o inválido
- **WHEN** el formulario de restablecimiento recibe un token que el servidor rechaza
- **THEN** la aplicación informa que el enlace ya no sirve y permite volver a solicitar otro

#### Scenario: La contraseña se restablece correctamente
- **WHEN** el servidor confirma el cambio de contraseña
- **THEN** la aplicación redirige a Login y muestra un toast de confirmación
