# Spec Delta

## Purpose

Registro Emocional permite preparar y confirmar un registro completo a partir de un estado de ánimo, emociones, una nota opcional y la fecha actual, sin requerir servicios externos ni almacenamiento persistente.

## ADDED Requirements

### Requirement: El registro emocional permite escoger un único estado
Registro Emocional MUST mostrar «¿Cómo te sientes hoy?» y las opciones «Muy bien», «Bien», «Regular», «Mal» y «Muy mal». MUST mantener exactamente un estado seleccionado, permitiendo modificar el estado precargado desde Inicio.

#### Scenario: La persona modifica el estado preseleccionado
- **WHEN** Registro Emocional recibe un estado elegido en Inicio y la persona selecciona otro
- **THEN** el nuevo estado sustituye al anterior como única selección

### Requirement: El registro emocional permite seleccionar varias emociones
Registro Emocional MUST permitir seleccionar una o más opciones entre Tristeza, Ansiedad, Miedo, Enojo, Soledad, Calma, Esperanza y Otra.

#### Scenario: La persona selecciona varias emociones
- **WHEN** la persona activa más de una emoción
- **THEN** cada emoción elegida permanece seleccionada hasta que la persona la desactive o confirme el registro

### Requirement: El registro emocional admite una nota opcional
Registro Emocional MUST ofrecer un campo opcional «¿Quieres agregar algo?» que permita escribir una nota sin exigir su contenido para completar el registro.

#### Scenario: La persona guarda sin escribir una nota
- **WHEN** la persona completa los campos obligatorios y deja vacía la nota
- **THEN** la nota vacía no impide confirmar el registro

### Requirement: El registro emocional muestra su fecha
Registro Emocional MUST mostrar la fecha actual del dispositivo para el registro en preparación.

#### Scenario: Se presenta el registro emocional
- **WHEN** la persona abre Registro Emocional
- **THEN** ve la fecha local actual como parte del formulario

### Requirement: El registro emocional valida los campos obligatorios
La confirmación del registro MUST requerir un estado emocional y al menos una emoción seleccionados, e informar claramente qué falta cuando no se cumple alguna condición.

#### Scenario: Falta el estado emocional o una emoción
- **WHEN** la persona intenta guardar sin un estado o sin seleccionar emociones
- **THEN** la aplicación no confirma ni crea el registro e informa el campo obligatorio pendiente

### Requirement: El registro emocional solo se crea tras confirmación explícita
La aplicación MUST crear como máximo un registro temporal por activación válida de «Guardar registro» y mostrar confirmación. El registro y la nota MUST permanecer solo en memoria de la sesión y MUST NOT enviarse a servicios externos ni persistirse.

#### Scenario: La persona confirma un formulario válido
- **WHEN** la persona pulsa «Guardar registro» con un estado y al menos una emoción seleccionados
- **THEN** se crea un registro temporal y se muestra «Tu registro emocional fue guardado.»

#### Scenario: La persona abandona el formulario sin confirmarlo
- **WHEN** la persona sale de Registro Emocional sin pulsar «Guardar registro»
- **THEN** no se crea ningún registro
