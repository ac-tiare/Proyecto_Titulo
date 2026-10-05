# Spec Delta

## Purpose

Define la experiencia de entrada y navegación móvil de CONTIGO para que las personas encuentren sus herramientas preventivas sin depender de una cuenta ni de servicios externos.

## ADDED Requirements

### Requirement: Navegación móvil a las pantallas iniciales
La aplicación SHALL ofrecer navegación móvil accesible a Inicio, Mi bienestar, Plan de seguridad y Red de apoyo, y permitir llegar también a Registro emocional, Necesito ayuda, Información y recursos, y Perfil.

#### Scenario: Abrir la aplicación
- **WHEN** una persona abre la aplicación
- **THEN** la aplicación muestra Inicio y la navegación principal sin exigir registro ni inicio de sesión

#### Scenario: Acceder a una pantalla inicial
- **WHEN** una persona selecciona una opción de navegación o un acceso de Inicio
- **THEN** la aplicación muestra la pantalla correspondiente y mantiene una forma clara de volver a Inicio

#### Scenario: Usar la navegación con tecnologías de asistencia
- **WHEN** una persona recorre la navegación mediante teclado o lector de pantalla
- **THEN** cada destino tiene un nombre accesible, un foco perceptible y un estado seleccionado identificable

### Requirement: Inicio presenta las acciones preventivas principales
Inicio SHALL mostrar un saludo neutral, la pregunta “¿Cómo te sientes hoy?”, opciones visuales de estado emocional, accesos al plan de seguridad, red de apoyo e información y recursos, y un acceso visible a Necesito ayuda.

#### Scenario: Recorrer Inicio
- **WHEN** una persona abre Inicio
- **THEN** encuentra la pregunta emocional y los accesos indicados sin tener que navegar por menús secundarios

#### Scenario: Abrir una acción desde Inicio
- **WHEN** una persona selecciona una opción emocional o un acceso preventivo de Inicio
- **THEN** la aplicación abre la pantalla correspondiente sin iniciar una llamada, registro o flujo externo de manera inesperada

### Requirement: La interfaz se adapta a pantallas móviles
La aplicación SHALL presentar sus pantallas iniciales en una interfaz móvil clara, legible y operable con controles accesibles.

#### Scenario: Usar la aplicación en distintos tamaños móviles
- **WHEN** una persona visualiza la aplicación en un tamaño de pantalla móvil compatible
- **THEN** el contenido y los controles principales permanecen disponibles sin solaparse ni requerir desplazamiento horizontal
