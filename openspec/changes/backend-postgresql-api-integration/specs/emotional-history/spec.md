# Spec Delta

## Purpose

Permite guardar y recuperar el historial emocional de la persona entre sesiones, manteniendo el acceso privado y las opciones de consulta existentes.

## ADDED Requirements

### Requirement: Los registros emocionales persisten por cuenta
La API SHALL guardar los registros emocionales confirmados y permitir que la persona los recupere después de cerrar y volver a abrir la aplicación.

#### Scenario: La persona confirma un registro
- **WHEN** envía un estado válido y al menos una emoción
- **THEN** el servidor persiste el registro asociado a su sesión y la aplicación confirma el guardado solo tras recibir éxito

#### Scenario: La persona consulta su historial después de volver a ingresar
- **WHEN** solicita su historial con una sesión vigente
- **THEN** recibe sus registros persistidos, incluyendo estado, emociones, nota opcional y fecha

### Requirement: La persona administra solo sus propios registros
La API SHALL restringir la consulta individual, modificación y eliminación al propietario autenticado de cada registro.

#### Scenario: La persona solicita un registro ajeno
- **WHEN** consulta, modifica o elimina un registro que pertenece a otra cuenta
- **THEN** la API no revela ni modifica ese registro

### Requirement: El historial admite filtros y paginación acotada
La API SHALL permitir consultar los períodos de semana, mes y año disponibles en la pantalla y SHALL limitar las páginas y su tamaño a valores válidos.

#### Scenario: La persona cambia el período del historial
- **WHEN** solicita registros para semana, mes o año
- **THEN** recibe únicamente registros del período indicado, con paginación y metadatos de resultados

#### Scenario: La solicitud excede el límite de página
- **WHEN** el tamaño de página solicitado supera el máximo permitido o los parámetros son inválidos
- **THEN** la API rechaza la solicitud con un error de validación sin ejecutar una consulta sin límites

### Requirement: Los datos emocionales se protegen frente a exposición accidental
El sistema SHALL limitar el tamaño y validar el contenido recibido y SHALL NOT incluir notas ni contenido emocional en registros operacionales.

#### Scenario: Una nota supera el tamaño permitido
- **WHEN** la persona envía una nota demasiado extensa
- **THEN** el servidor rechaza la entrada con un error de validación y no la persiste
