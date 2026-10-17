# Spec Delta

## MODIFIED Requirements

### Requirement: El registro emocional solo se crea tras confirmación explícita
La aplicación MUST crear como máximo un registro persistente por envío válido de «Guardar registro», asociado al UID autenticado en `usuarios/{uid}/registros_emocionales/{registroId}`, con estado, emociones, nota opcional, UID y fecha de servidor. MUST mostrar confirmación solo tras confirmación de Firestore y MUST comunicar fallas de guardado.

#### Scenario: La persona confirma un formulario válido
- **WHEN** una persona autenticada guarda un estado y al menos una emoción válidos
- **THEN** Firestore confirma un documento bajo su UID y la aplicación muestra «Tu registro emocional fue guardado.»

#### Scenario: La persona pulsa guardar repetidamente
- **WHEN** el envío válido sigue pendiente y la persona vuelve a pulsar «Guardar registro»
- **THEN** la aplicación realiza como máximo una escritura para ese envío

#### Scenario: Falla la conexión o la escritura
- **WHEN** Firestore no confirma el guardado
- **THEN** la aplicación informa que el registro no se guardó y permite reintentar sin mostrar una confirmación falsa

#### Scenario: La persona abandona el formulario sin confirmarlo
- **WHEN** sale de Registro Emocional sin guardar
- **THEN** Firestore no recibe ningún registro

#### Scenario: No existe sesión autenticada
- **WHEN** se intenta guardar un registro sin una identidad autenticada
- **THEN** no se crea ningún documento y la persona debe iniciar sesión

## ADDED Requirements

### Requirement: Los registros emocionales solo son accesibles por su propietario
Cloud Firestore MUST permitir a una persona autenticada leer sus propios registros y crear registros válidos bajo su UID, y MUST denegar lecturas o escrituras de otros UID, actualizaciones, eliminaciones y campos no permitidos.

#### Scenario: La persona crea un registro con datos permitidos
- **WHEN** el documento contiene su UID, un estado y emociones válidos, una fecha de servidor y solo los campos admitidos
- **THEN** las reglas permiten la creación bajo `usuarios/{uid}/registros_emocionales/{registroId}`

#### Scenario: Una persona intenta leer o escribir bajo otro UID
- **WHEN** la ruta del documento no corresponde al UID autenticado
- **THEN** las reglas deniegan la operación

#### Scenario: Una escritura contiene datos inválidos o una operación de modificación
- **WHEN** el estado, las emociones, tipos, fecha o campos no cumplen el esquema, o se intenta actualizar o borrar
- **THEN** las reglas deniegan la operación

### Requirement: La emoción Otra permite especificar un texto opcional
Registro Emocional MUST mostrar un campo para especificar «Otra» mientras esa emoción esté seleccionada y MUST permitir guardar el texto opcional junto con el registro.

#### Scenario: La persona selecciona Otra
- **WHEN** activa la emoción «Otra»
- **THEN** aparece un campo etiquetado para especificarla

#### Scenario: La persona guarda el texto de Otra
- **WHEN** guarda un registro válido con un texto en el campo «Otra»
- **THEN** el documento incluye ese texto en `otraEmocion`

#### Scenario: La persona no especifica Otra
- **WHEN** selecciona «Otra» y deja vacío el campo opcional
- **THEN** puede guardar el registro y no se inventa un texto para `otraEmocion`
