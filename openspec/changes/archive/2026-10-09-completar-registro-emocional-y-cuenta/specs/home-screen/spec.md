# Spec Delta

## MODIFIED Requirements

### Requirement: Inicio presenta la bienvenida y la selección emocional
Inicio MUST presentar la bienvenida de la referencia y cinco estados emocionales identificables: «Muy bien», «Bien», «Regular», «Mal» y «Muy mal». Elegir un estado MUST abrir Registro Emocional con la selección previamente aplicada y MUST NOT crear ni guardar un registro antes de que la persona confirme «Guardar registro» en esa pantalla.

#### Scenario: La persona elige un estado emocional
- **WHEN** la persona activa uno de los cinco estados en Inicio
- **THEN** la aplicación conserva temporalmente la selección y navega a Registro Emocional con ese estado seleccionado, sin crear un registro

#### Scenario: La persona cambia la selección inicial
- **WHEN** la pantalla Registro Emocional se abre con un estado preseleccionado y la persona elige otro estado
- **THEN** el nuevo estado queda seleccionado para el borrador del registro y todavía no se crea un registro
