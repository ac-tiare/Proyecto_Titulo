# Spec Delta

## REMOVED Requirements

### Requirement: Crear Cuenta ofrece solo un alta de demostración
Al enviar datos válidos, la pantalla MUST informar que el flujo es de demostración y MUST NOT autenticar, transmitir ni persistir los datos personales.

#### Scenario: La persona completa válidamente el formulario
- **WHEN** la persona envía nombre, correo y contraseñas válidos y coincidentes
- **THEN** la aplicación muestra una confirmación de demostración sin crear una cuenta real ni conservar los datos fuera de la sesión

**Reason**: El flujo demostrativo será reemplazado por registro autenticado y persistente solicitado para CONTIGO.
**Migration**: Configurar y habilitar la API antes de usar el registro; conservar las validaciones y la presentación existentes.

## ADDED Requirements

### Requirement: Crear Cuenta registra una cuenta en el servidor
Crear Cuenta SHALL enviar los datos válidos a la API, autenticar a la persona tras una respuesta exitosa y SHALL NOT afirmar éxito cuando el servidor rechaza o no puede procesar el registro.

#### Scenario: El servidor confirma un nuevo registro
- **WHEN** la persona envía datos válidos y el servidor crea la cuenta
- **THEN** la aplicación muestra confirmación y mantiene la sesión devuelta por el servidor sin exponer información interna

#### Scenario: El correo ya está registrado
- **WHEN** la persona intenta registrarse con un correo existente
- **THEN** la aplicación informa el conflicto sin crear una segunda cuenta

#### Scenario: La API no está disponible o rechaza los datos
- **WHEN** el registro no llega al servidor o este devuelve un error
- **THEN** la aplicación informa que no se creó la cuenta y permite reintentar sin mostrar una confirmación falsa
