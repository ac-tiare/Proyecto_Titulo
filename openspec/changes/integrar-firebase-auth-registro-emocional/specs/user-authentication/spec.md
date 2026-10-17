# Spec Delta

## Purpose

La autenticación identifica a cada persona que usa CONTIGO y protege sus pantallas privadas para que el registro emocional solo se asocie a una cuenta iniciada.

## ADDED Requirements

### Requirement: Login autentica con correo y contraseña
Login MUST autenticar a la persona con Firebase Authentication y MUST informar los errores de forma clara y accesible sin revelar datos sensibles de la cuenta.

#### Scenario: La persona inicia sesión correctamente
- **WHEN** introduce credenciales válidas y envía el formulario
- **THEN** queda autenticada con su UID de Firebase y accede al destino solicitado o, si no existe, a Inicio

#### Scenario: Las credenciales no son válidas
- **WHEN** Firebase Authentication rechaza el correo o la contraseña
- **THEN** Login permanece visible y comunica que no pudo iniciar sesión sin presentar la autenticación como exitosa

### Requirement: La sesión autenticada se restaura y se puede cerrar
La aplicación MUST conservar la sesión según Firebase Authentication y MUST permitir cerrarla desde la interfaz existente de Perfil.

#### Scenario: La aplicación restaura una sesión
- **WHEN** Firebase Authentication termina de restaurar una sesión válida
- **THEN** la persona autenticada puede acceder a las rutas privadas sin volver a ingresar sus credenciales

#### Scenario: La persona cierra sesión
- **WHEN** activa la acción de cerrar sesión
- **THEN** Firebase Authentication cierra la sesión y la aplicación navega a Login

### Requirement: Todas las rutas salvo Login y Crear Cuenta requieren sesión
La aplicación MUST exigir una sesión autenticada para todas las pantallas de CONTIGO, incluidas Inicio, Mi Bienestar y las pantallas de información, apoyo y ayuda; únicamente Login y Crear Cuenta MUST permanecer públicas.

#### Scenario: Una persona no autenticada solicita una pantalla privada
- **WHEN** abre directamente una ruta privada, incluso una ruta de ayuda o información
- **THEN** la aplicación la redirige a Login y conserva el destino para después de autenticarse

#### Scenario: Se resuelve el estado inicial de autenticación
- **WHEN** Firebase todavía está restaurando la sesión
- **THEN** la aplicación espera el resultado antes de permitir o denegar la navegación privada

#### Scenario: Una persona autenticada solicita una pantalla privada
- **WHEN** su sesión ya fue restaurada o iniciada correctamente
- **THEN** puede acceder a las rutas privadas autorizadas

#### Scenario: Una persona cierra sesión y vuelve atrás
- **WHEN** intenta volver mediante la navegación del navegador a una pantalla privada
- **THEN** la aplicación vuelve a exigir autenticación y no muestra su contenido privado
