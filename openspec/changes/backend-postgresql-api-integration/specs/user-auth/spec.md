# Spec Delta

## Purpose

Permite que las personas creen una cuenta e ingresen a CONTIGO con sesiones seguras, revocables y compatibles con navegador y dispositivos nativos.

## ADDED Requirements

### Requirement: Las sesiones autenticadas identifican a la persona
La API SHALL permitir el acceso privado únicamente mediante una sesión vigente y SHALL determinar la identidad desde esa sesión, nunca desde un identificador de usuario enviado por el cliente.

#### Scenario: Una persona no autenticada solicita información privada
- **WHEN** la solicitud no contiene una sesión vigente
- **THEN** la API la rechaza sin devolver información privada

#### Scenario: El cliente intenta consultar datos de otra persona
- **WHEN** una solicitud autenticada incluye un identificador ajeno como propietario
- **THEN** la API limita la operación a la identidad de la sesión y no revela datos ajenos

### Requirement: Las sesiones se crean y revocan de forma verificable
El registro o inicio de sesión válido SHALL crear una sesión revocable; el cierre de sesión SHALL invalidar esa sesión y las credenciales expiradas o revocadas SHALL dejar de autorizar solicitudes.

#### Scenario: Credenciales válidas crean una sesión
- **WHEN** la persona completa correctamente el registro o inicio de sesión
- **THEN** recibe una sesión vigente y una respuesta que no contiene el hash de contraseña ni secretos internos

#### Scenario: La persona cierra sesión
- **WHEN** solicita cerrar su sesión autenticada
- **THEN** esa sesión deja de autorizar solicitudes posteriores

#### Scenario: Una sesión expiró o fue revocada
- **WHEN** la persona presenta una credencial expirada o revocada
- **THEN** la API la rechaza y requiere autenticación nuevamente

### Requirement: El navegador protege las credenciales de sesión
El cliente web SHALL usar una credencial de sesión inaccesible a JavaScript y SHALL validar solicitudes que puedan modificar datos contra falsificación de solicitudes entre sitios.

#### Scenario: El navegador envía una operación que modifica datos
- **WHEN** una solicitud autenticada web no presenta una prueba CSRF válida
- **THEN** la API la rechaza sin aplicar cambios

### Requirement: Capacitor nativo protege las credenciales de sesión
El cliente nativo SHALL almacenar las credenciales de sesión en el almacenamiento seguro del sistema operativo y SHALL NOT persistirlas en `localStorage`.

#### Scenario: La aplicación nativa conserva una sesión
- **WHEN** la persona inicia sesión desde iOS o Android
- **THEN** la credencial queda disponible mediante almacenamiento seguro del dispositivo y no mediante almacenamiento web no seguro

### Requirement: Las credenciales nativas son de corta duración y renovables
El cliente nativo SHALL usar credenciales de acceso de corta duración y SHALL renovar la sesión mediante una credencial rotativa revocable, ambas protegidas en el almacenamiento seguro del sistema operativo.

#### Scenario: La credencial de acceso expira
- **WHEN** la persona mantiene una sesión válida pero su credencial de acceso expira
- **THEN** la aplicación solicita una renovación segura y continúa solo si el servidor confirma la sesión

#### Scenario: Se reutiliza una credencial de renovación anterior
- **WHEN** una credencial de renovación ya rotada vuelve a presentarse
- **THEN** el servidor la rechaza y no emite una nueva credencial válida para esa sesión

### Requirement: La persona consulta y actualiza su propio perfil
La API SHALL permitir a la persona autenticada consultar y actualizar sus datos básicos de perfil, sin exponer contraseñas ni datos internos de autenticación.

#### Scenario: La persona actualiza su perfil
- **WHEN** envía nombre y correo válidos para su cuenta
- **THEN** la API persiste los cambios propios y devuelve el perfil público actualizado

#### Scenario: El correo ya pertenece a otra cuenta
- **WHEN** la persona intenta cambiar su correo por uno registrado en otra cuenta
- **THEN** la API rechaza el cambio sin alterar el perfil existente
