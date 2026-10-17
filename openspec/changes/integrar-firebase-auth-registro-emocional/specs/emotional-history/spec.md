# Spec Delta

## Purpose

Mi Bienestar presenta a cada persona su propio historial persistente de registros emocionales y estados de consulta honestos, sin revelar información de otras cuentas.

## ADDED Requirements

### Requirement: Mi Bienestar consulta solo el historial de la persona autenticada
Mi Bienestar MUST consultar los registros asociados al UID de la sesión y MUST presentarlos del más reciente al más antiguo.

#### Scenario: La persona tiene registros
- **WHEN** Mi Bienestar carga para una sesión autenticada con registros propios
- **THEN** muestra cada registro con su estado emocional, emociones, nota y fecha, ordenado desde el más reciente

#### Scenario: La persona todavía no tiene registros
- **WHEN** la consulta termina correctamente y no encuentra registros para su UID
- **THEN** Mi Bienestar muestra un estado vacío que explica que aún no hay registros, sin inventar datos

#### Scenario: Se guarda un registro nuevo
- **WHEN** una escritura de Registro Emocional se confirma y Mi Bienestar vuelve a cargar
- **THEN** el registro recién guardado aparece en el historial ordenado

### Requirement: Mi Bienestar comunica carga y errores de consulta
Mi Bienestar MUST distinguir la carga de datos de un historial vacío y MUST informar fallas de consulta sin presentarlas como ausencia de registros.

#### Scenario: El historial está cargando
- **WHEN** la consulta de Firestore está pendiente
- **THEN** la interfaz indica que está cargando y no muestra un estado vacío prematuro

#### Scenario: Falla la consulta del historial
- **WHEN** Firestore no puede completar la consulta
- **THEN** la interfaz informa que no fue posible cargar los registros y permite volver a intentar

### Requirement: Ninguna persona puede consultar el historial de otra
Las consultas de Mi Bienestar MUST limitarse a los registros del UID autenticado y las reglas de Firestore MUST rechazar lecturas de registros de otros UID.

#### Scenario: Una cuenta intenta consultar registros ajenos
- **WHEN** una sesión autenticada solicita un registro bajo el UID de otra cuenta
- **THEN** Firestore deniega la lectura y Mi Bienestar no muestra esos datos
