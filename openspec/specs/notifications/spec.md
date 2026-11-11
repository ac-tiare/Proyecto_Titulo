# notifications Specification

## Purpose

Permite que cada persona controle sus preferencias de avisos de manera clara y privada, conserve cambios temporalmente sin conexión y mantenga acceso independiente a las demás funciones de CONTIGO.

## Requirements

### Requirement: La persona administra categorías independientes de avisos
La aplicación SHALL permitir activar o desactivar por separado los recordatorios del diario emocional, los avisos preventivos de bienestar y los avisos del plan de seguridad, explicando el propósito de cada categoría.

#### Scenario: La persona consulta las preferencias
- **WHEN** abre la configuración de notificaciones
- **THEN** ve cada categoría, su propósito y el estado guardado para su cuenta

#### Scenario: La persona cambia una categoría
- **WHEN** activa o desactiva una categoría
- **THEN** cambia solo esa preferencia y las demás conservan su estado

### Requirement: Las preferencias pertenecen a la cuenta autenticada
La API SHALL leer y actualizar las preferencias de la persona autenticada sin aceptar un identificador de cuenta del cliente.

#### Scenario: La persona consulta sus preferencias
- **WHEN** solicita `GET /api/users/preferences` con una sesión válida
- **THEN** recibe únicamente sus preferencias, valores desactivados para categorías sin configuración previa e información suficiente para distinguir valores predeterminados de preferencias persistidas

#### Scenario: La persona guarda sus preferencias
- **WHEN** envía `PUT /api/users/preferences` con valores booleanos válidos y una sesión vigente
- **THEN** la API persiste y devuelve las preferencias de su propia cuenta

#### Scenario: La persona guarda un conjunto incompleto de preferencias
- **WHEN** omite una categoría requerida al enviar el conjunto de preferencias
- **THEN** la API rechaza la solicitud y no modifica las preferencias guardadas

#### Scenario: La solicitud no está autenticada
- **WHEN** solicita o modifica preferencias sin una sesión válida
- **THEN** la API rechaza la solicitud sin revelar ni cambiar preferencias

#### Scenario: La persona envía preferencias inválidas
- **WHEN** envía una categoría desconocida o un valor que no es booleano
- **THEN** la API rechaza la solicitud y no modifica las preferencias guardadas

### Requirement: La persona autoriza el permiso del dispositivo al habilitar avisos
La aplicación SHALL solicitar el permiso de notificaciones solo cuando la persona intente activar una categoría y SHALL mantenerla desactivada si el permiso es denegado o no está disponible.

#### Scenario: La persona habilita una categoría sin permiso concedido
- **WHEN** activa una categoría en un dispositivo que todavía no ha concedido el permiso
- **THEN** la aplicación solicita permiso explícitamente y guarda la activación solo si el permiso es concedido

#### Scenario: La persona deniega el permiso
- **WHEN** deniega el permiso solicitado
- **THEN** la categoría permanece desactivada, la aplicación explica cómo cambiar el permiso y las otras categorías siguen disponibles

#### Scenario: La persona desactiva una categoría
- **WHEN** desactiva una categoría
- **THEN** la aplicación guarda la preferencia desactivada sin solicitar permiso del dispositivo

### Requirement: La persona conserva cambios mientras no hay conexión
La aplicación SHALL respaldar localmente las preferencias por cuenta y distinguir claramente los cambios que todavía no se han sincronizado con el backend.

#### Scenario: La persona abre preferencias sin conexión
- **WHEN** no se puede consultar el backend y hay una copia local para la cuenta autenticada
- **THEN** la aplicación muestra esa copia e indica que puede estar desactualizada o pendiente de sincronización

#### Scenario: La persona cambia una preferencia sin conexión
- **WHEN** el backend no está disponible al guardar un cambio
- **THEN** la aplicación conserva el cambio local para esa cuenta y comunica que todavía no está sincronizado

#### Scenario: La conexión se restablece
- **WHEN** la aplicación puede comunicarse nuevamente con el backend para la cuenta autenticada
- **THEN** sincroniza los cambios locales pendientes, muestra el resultado y elimina el estado pendiente solo tras confirmar el guardado remoto

#### Scenario: Cambia la cuenta activa
- **WHEN** otra persona inicia sesión en el mismo dispositivo
- **THEN** la aplicación no muestra ni sincroniza las preferencias locales de la cuenta anterior

### Requirement: Desactivar notificaciones no restringe otras funciones
El sistema SHALL mantener las funciones de apoyo disponibles con independencia de los permisos y las preferencias de notificación.

#### Scenario: La persona desactiva todos los avisos
- **WHEN** todas las categorías están desactivadas o el permiso del dispositivo fue denegado
- **THEN** la persona conserva el acceso al Plan de Seguridad, Diario Emocional, Necesito Ayuda y demás funciones de CONTIGO

### Requirement: Las preferencias no implican entrega de avisos
La aplicación SHALL distinguir las preferencias guardadas del servicio de entrega y SHALL NOT afirmar que hay avisos programados o entregados como resultado de activar una categoría.

#### Scenario: La persona habilita una categoría
- **WHEN** guarda una categoría como activa
- **THEN** la aplicación confirma el estado de la preferencia sin afirmar que se programó o envió una notificación
