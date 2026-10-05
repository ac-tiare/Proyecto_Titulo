# Spec Delta

## Purpose

Define the accessible and responsive visual experience of CONTIGO's home screen, presenting its existing emotional check-in and support links without changing their behavior.

## ADDED Requirements

### Requirement: Inicio presenta una bienvenida y selector emocional claros
Inicio MUST mostrar el saludo «Hola 👋», la pregunta «¿Cómo te sientes hoy?» y cinco opciones identificables: «Muy bien», «Bien», «Regular», «Mal» y «Muy mal». Elegir una opción MUST conservar el flujo existente: seleccionar ese estado y abrir Registro emocional.

#### Scenario: La persona elige un estado emocional desde Inicio
- **WHEN** la persona activa cualquiera de las cinco opciones emocionales
- **THEN** la aplicación conserva la selección temporal correspondiente y navega a Registro emocional

### Requirement: Inicio ofrece accesos de apoyo reconocibles
Inicio MUST presentar accesos separados para Mi Plan de Seguridad, Mi Red de Apoyo e Información y recursos, además de un botón «Necesito ayuda» visible y calmado. Cada acceso MUST conservar su destino actual.

#### Scenario: La persona abre una herramienta de apoyo
- **WHEN** la persona activa una tarjeta de apoyo o el botón «Necesito ayuda»
- **THEN** la aplicación navega a la pantalla correspondiente sin alterar su contenido ni su comportamiento

### Requirement: El diseño de Inicio es adaptable, accesible y acotado
El contenido de Inicio MUST usar la identidad visual pastel indicada para este cambio, mantener texto legible, controles fáciles de activar y foco perceptible, y adaptarse desde 320 píxeles de ancho sin desplazamiento horizontal. El rediseño MUST limitarse a Inicio y no modificar la cabecera, la navegación compartida ni las demás pantallas.

#### Scenario: Inicio se muestra en un dispositivo móvil estrecho
- **WHEN** la pantalla se visualiza a 320 píxeles de ancho
- **THEN** el contenido y sus controles permanecen visibles, legibles y operables sin desbordamiento horizontal

#### Scenario: La persona navega Inicio mediante teclado
- **WHEN** la persona mueve el foco por los controles interactivos de Inicio
- **THEN** cada control muestra un indicador de foco perceptible y mantiene su acción existente
