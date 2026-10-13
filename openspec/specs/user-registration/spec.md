# user-registration Specification

## Purpose

Crear Cuenta ofrece un formulario de demostración accesible para recopilar y validar los datos introducidos por la persona, manteniendo una navegación clara hacia Login sin crear cuentas reales.

## Requirements

### Requirement: Crear Cuenta presenta los campos de registro
La pantalla Crear Cuenta MUST mostrar campos etiquetados para Nombre, Correo electrónico, Contraseña y Confirmar contraseña, y una acción principal «Crear cuenta».

#### Scenario: La persona abre Crear Cuenta
- **WHEN** la persona navega desde Login a Crear Cuenta
- **THEN** encuentra los cuatro campos y la acción principal en un formulario adaptable a dispositivos móviles

### Requirement: Crear Cuenta valida los datos obligatorios
El formulario MUST requerir nombre, correo, contraseña y confirmación; MUST validar el formato del correo y que las contraseñas coincidan; y MUST mostrar mensajes claros para los errores.

#### Scenario: La persona envía datos incompletos o inválidos
- **WHEN** falta un campo obligatorio, el correo tiene formato inválido o las contraseñas no coinciden
- **THEN** no se acepta el formulario y se informa cada error relevante junto al campo correspondiente

### Requirement: Crear Cuenta permite mostrar y ocultar las contraseñas
La persona MUST poder alternar la visibilidad de los campos de contraseña mediante controles accesibles.

#### Scenario: La persona revela una contraseña
- **WHEN** activa el control para mostrar una contraseña
- **THEN** el valor de ese campo se vuelve legible y el control comunica su estado y acción

### Requirement: Crear Cuenta ofrece solo un alta de demostración
Al enviar datos válidos, la pantalla MUST informar que el flujo es de demostración y MUST NOT autenticar, transmitir ni persistir los datos personales.

#### Scenario: La persona completa válidamente el formulario
- **WHEN** la persona envía nombre, correo y contraseñas válidos y coincidentes
- **THEN** la aplicación muestra una confirmación de demostración sin crear una cuenta real ni conservar los datos fuera de la sesión

### Requirement: Crear Cuenta permite volver a Login
Crear Cuenta MUST proporcionar la opción «¿Ya tienes una cuenta? Iniciar sesión» que navega a Login, y Login MUST ofrecer «Crear cuenta» como enlace a dicha pantalla.

#### Scenario: La persona regresa al Login
- **WHEN** activa «Iniciar sesión» desde Crear Cuenta
- **THEN** la aplicación navega a Login

#### Scenario: La persona abre el registro desde Login
- **WHEN** activa «Crear cuenta» desde Login
- **THEN** la aplicación navega a Crear Cuenta
