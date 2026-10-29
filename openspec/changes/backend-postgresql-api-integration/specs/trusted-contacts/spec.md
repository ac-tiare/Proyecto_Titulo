# Spec Delta

## Purpose

Permite que cada persona administre una red de contactos de confianza persistente y privada, accesible desde la pantalla de apoyo existente.

## ADDED Requirements

### Requirement: La persona administra sus contactos de confianza
La API SHALL permitir listar, crear, actualizar y eliminar contactos asociados a la cuenta autenticada, incluyendo nombre, teléfono y relación opcional.

#### Scenario: La persona crea un contacto
- **WHEN** envía los datos válidos de un contacto
- **THEN** el servidor lo guarda para su cuenta y la aplicación confirma el resultado del servidor

#### Scenario: La persona actualiza o elimina un contacto propio
- **WHEN** modifica o elimina un contacto que le pertenece
- **THEN** la API aplica el cambio y la pantalla refleja el resultado persistido

### Requirement: Los contactos permanecen privados por propietario
La API SHALL restringir la lectura y modificación de cada contacto a su propietario autenticado.

#### Scenario: La persona intenta acceder a un contacto ajeno
- **WHEN** consulta, modifica o elimina el identificador de otra cuenta
- **THEN** la API no revela ni altera los datos de ese contacto

### Requirement: Los datos del contacto se validan
El sistema SHALL validar los campos requeridos y limitar sus tamaños antes de guardar el contacto; los teléfonos SHALL conservarse como texto.

#### Scenario: Se envía un contacto inválido
- **WHEN** falta el nombre o teléfono, o un campo supera su límite
- **THEN** el servidor devuelve un error de validación y no persiste el contacto
