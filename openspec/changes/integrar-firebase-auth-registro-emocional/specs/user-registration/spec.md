# Spec Delta

## RENAMED Requirements

- FROM: Crear Cuenta ofrece solo un alta de demostración
- TO: Crear Cuenta crea una cuenta real con Firebase Authentication

## ADDED Requirements

### Requirement: Crear Cuenta crea una cuenta real con Firebase Authentication
Al enviar datos válidos, Crear Cuenta MUST crear una cuenta real con Firebase Authentication usando correo y contraseña, asociar el nombre al perfil de autenticación y MUST NOT almacenar la contraseña en Cloud Firestore.

#### Scenario: La persona completa válidamente el formulario
- **WHEN** envía nombre, correo y contraseñas válidos y coincidentes
- **THEN** Firebase Authentication crea la cuenta, la persona queda autenticada y continúa a Inicio

#### Scenario: Firebase rechaza la creación
- **WHEN** el correo ya existe, la contraseña no cumple la política o Firebase no puede completar el alta
- **THEN** Crear Cuenta informa el error de forma clara, no presenta el alta como exitosa y permite corregir o reintentar

#### Scenario: Se crea una cuenta
- **WHEN** Firebase Authentication confirma el alta
- **THEN** el nombre se asocia al perfil de autenticación y la contraseña no se escribe en Cloud Firestore
