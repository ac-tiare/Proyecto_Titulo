# home-screen Specification

## Purpose

La pantalla Inicio ofrece una entrada clara y acogedora al registro emocional y a las herramientas de apoyo de CONTIGO, con una presentación accesible y adaptable a dispositivos móviles.

## Requirements

### Requirement: Inicio presenta la bienvenida y la selección emocional
Inicio MUST presentar la bienvenida de la referencia y cinco estados emocionales identificables: «Muy bien», «Bien», «Regular», «Mal» y «Muy mal». Elegir un estado MUST abrir Registro Emocional con la selección previamente aplicada y MUST NOT crear ni guardar un registro antes de que la persona confirme «Guardar registro» en esa pantalla.

#### Scenario: La persona elige un estado emocional
- **WHEN** la persona activa uno de los cinco estados en Inicio
- **THEN** la aplicación conserva temporalmente la selección y navega a Registro Emocional con ese estado seleccionado, sin crear un registro

#### Scenario: La persona cambia la selección inicial
- **WHEN** la pantalla Registro Emocional se abre con un estado preseleccionado y la persona elige otro estado
- **THEN** el nuevo estado queda seleccionado para el borrador del registro y todavía no se crea un registro

### Requirement: Inicio ofrece un mensaje visual de acompañamiento
Inicio MUST incluir una tarjeta de acompañamiento cálida y no diagnóstica, con texto legible y un elemento visual decorativo accesible.

#### Scenario: Se muestra el acompañamiento en Inicio
- **WHEN** la persona abre Inicio
- **THEN** encuentra un mensaje de apoyo que no diagnostica, no predice crisis y no sustituye los canales de ayuda

### Requirement: Inicio conserva sus accesos a herramientas y ayuda
Inicio MUST ofrecer accesos distinguibles a Mi Plan de Seguridad, Mi Red de Apoyo, Información y recursos y Necesito ayuda, conservando las rutas y acciones actuales.

#### Scenario: La persona activa un acceso de apoyo
- **WHEN** la persona activa cualquiera de los accesos de herramientas o ayuda
- **THEN** la aplicación navega al destino existente correspondiente

### Requirement: El contenido de Inicio es accesible y adaptable
El contenido de Inicio MUST mantener texto legible, controles operables con teclado y áreas táctiles cómodas, y adaptarse desde 320 píxeles de ancho sin desbordamiento horizontal. La cabecera y la navegación compartidas MUST permanecer sin cambios.

#### Scenario: Inicio se muestra en una pantalla móvil estrecha
- **WHEN** Inicio se visualiza a 320 píxeles de ancho
- **THEN** su contenido permanece legible y operable sin desplazamiento horizontal

#### Scenario: Se recorre Inicio con teclado
- **WHEN** la persona mueve el foco por los controles interactivos de Inicio
- **THEN** cada control muestra un indicador de foco perceptible y conserva su acción
