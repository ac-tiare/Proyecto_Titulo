# Spec Delta

## Purpose

Proporciona una entrada visual accesible y adaptable a CONTIGO, con un flujo de demostración que permite llegar a la aplicación sin autenticar ni almacenar credenciales.

## ADDED Requirements

### Requirement: Login es la pantalla inicial de la demostración
La ruta inicial MUST mostrar Login sin la navegación inferior de la aplicación. La acción «Iniciar sesión» MUST llevar a Inicio en modo demostración, sin comprobar credenciales ni afirmar que se autenticó una cuenta.

#### Scenario: La persona abre la aplicación
- **WHEN** la persona navega a la ruta raíz
- **THEN** ve Login como pantalla inicial y puede identificar que el acceso es una demostración sin autenticación real

#### Scenario: La persona avanza desde Login
- **WHEN** la persona activa «Iniciar sesión», con o sin valores en los campos
- **THEN** la aplicación navega a Inicio sin autenticar, validar una cuenta ni persistir los valores introducidos

### Requirement: Login ofrece campos y controles accesibles
Login MUST presentar campos etiquetados para correo electrónico y contraseña, mantener la contraseña oculta inicialmente y permitir alternar su visibilidad. Los controles MUST mostrar foco perceptible y mantener sus etiquetas aunque tengan texto de ejemplo.

#### Scenario: La persona cambia la visibilidad de la contraseña
- **WHEN** la persona activa el control para mostrar u ocultar la contraseña
- **THEN** el campo alterna su presentación y el control comunica su estado de forma accesible

#### Scenario: La persona introduce información de acceso
- **WHEN** la persona enfoca y escribe en cualquiera de los campos
- **THEN** el foco es visible, el texto permanece legible y la contraseña sigue oculta salvo que la persona la muestre

### Requirement: Las acciones secundarias no simulan servicios reales
Login MUST mostrar «¿Olvidaste tu contraseña?» y «Crear cuenta» como acciones secundarias. Activarlas MUST comunicar que esas funciones aún no están disponibles, sin iniciar recuperación, registro ni comunicación externa.

#### Scenario: La persona activa recuperar contraseña o crear cuenta
- **WHEN** la persona activa cualquiera de las acciones secundarias
- **THEN** recibe una indicación de que la función no está disponible en esta versión y permanece en Login

### Requirement: Login se adapta a pantallas móviles y teclado
Login MUST usar la paleta neutral indicada, mantener texto y controles legibles y adaptar el contenido a anchos móviles y a la aparición del teclado virtual sin ocultar permanentemente el campo activo o las acciones.

#### Scenario: Login se muestra en una pantalla móvil estrecha
- **WHEN** Login se visualiza en un viewport de 320 píxeles de ancho
- **THEN** los campos y acciones caben sin desplazamiento horizontal y pueden alcanzarse mediante desplazamiento vertical

#### Scenario: Aparece el teclado virtual
- **WHEN** la persona enfoca un campo en un dispositivo móvil y aparece el teclado
- **THEN** puede desplazar Login para ver el campo activo y llegar a las acciones del formulario

### Requirement: La demostración no recopila credenciales
El flujo Login MUST permanecer exclusivamente en el cliente y MUST NOT guardar, enviar ni registrar las credenciales introducidas ni invocar servicios de autenticación.

#### Scenario: La persona usa los campos de Login
- **WHEN** la persona escribe credenciales y continúa a Inicio
- **THEN** la aplicación no persiste ni transmite esos valores y no presenta el resultado como autenticación real
