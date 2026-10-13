# Spec Delta

## MODIFIED Requirements

### Requirement: El contenido de Inicio es accesible y adaptable
El contenido de Inicio MUST mantener texto legible, controles operables con teclado y áreas táctiles cómodas, y adaptarse desde 320 píxeles de ancho sin desbordamiento horizontal. Solo el contenido central MUST desplazarse verticalmente; la cabecera superior y la navegación inferior MUST permanecer visibles en sus posiciones actuales, y el final del contenido MUST poder verse completamente sin quedar cubierto por la barra inferior.

#### Scenario: Inicio se muestra en una pantalla móvil estrecha
- **WHEN** Inicio se visualiza a 320 píxeles de ancho
- **THEN** su contenido permanece legible y operable sin desplazamiento horizontal, y la zona central de desplazamiento se ajusta entre la cabecera y la barra inferior

#### Scenario: La persona llega al final de Inicio
- **WHEN** el contenido de Inicio es más alto que el espacio disponible y la persona se desplaza hasta el final
- **THEN** puede ver completa la última sección, la cabecera y la barra inferior permanecen en su posición y no se requiere un segundo scroll anidado

#### Scenario: La persona desplaza Inicio con mouse
- **WHEN** usa rueda, barra de desplazamiento o arrastre con mouse en una ventana de ancho móvil
- **THEN** el mismo contenido central se desplaza verticalmente y los controles interactivos conservan su acción

#### Scenario: La persona desplaza Inicio con un dispositivo táctil
- **WHEN** desliza verticalmente sobre una zona no interactiva del contenido central
- **THEN** el contenido central se desplaza y la cabecera y barra inferior permanecen visibles

#### Scenario: La persona cambia el tamaño de ventana o navega por las pestañas
- **WHEN** cambia entre tamaños de ventana o navega entre Inicio, Mi bienestar, Plan y Red de apoyo
- **THEN** cada pantalla conserva su comportamiento de desplazamiento y presentación, con una sola barra vertical cuando su contenido lo requiera

#### Scenario: Se recorre Inicio con teclado
- **WHEN** la persona mueve el foco por los controles interactivos de Inicio
- **THEN** cada control muestra un indicador de foco perceptible y conserva su acción
