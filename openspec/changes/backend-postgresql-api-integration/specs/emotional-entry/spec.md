# Spec Delta

## MODIFIED Requirements

### Requirement: El registro emocional solo se crea tras confirmación explícita
La aplicación MUST crear como máximo un registro persistente por activación válida de «Guardar registro» y mostrar confirmación únicamente cuando el servidor confirme que fue guardado. El registro y la nota MUST quedar asociados a la cuenta autenticada y MUST NOT permanecer solo en memoria de la sesión.

#### Scenario: La persona confirma un formulario válido
- **WHEN** la persona pulsa «Guardar registro» con un estado y al menos una emoción seleccionados
- **THEN** la aplicación envía el registro a la API, lo persiste para la cuenta autenticada y muestra «Tu registro emocional fue guardado.» solo después del éxito del servidor

#### Scenario: La API rechaza o no puede guardar el registro
- **WHEN** la solicitud falla por validación, sesión expirada o indisponibilidad del servidor
- **THEN** la aplicación no muestra confirmación de guardado y comunica el error para permitir una acción apropiada

#### Scenario: La persona abandona el formulario sin confirmarlo
- **WHEN** la persona sale de Registro Emocional sin pulsar «Guardar registro»
- **THEN** no se crea ningún registro
