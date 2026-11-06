# Spec Delta

## ADDED Requirements

### Requirement: Inicio ofrece una invitación preventiva con accesos de apoyo
Cuando la API indique que se cumple la condición preventiva, Inicio SHALL mostrar una tarjeta no modal, accesible y no diagnóstica con el mensaje oficial y accesos visibles al historial, al plan personal, a la red de apoyo y a la ayuda rápida.

#### Scenario: La condición preventiva está activa
- **WHEN** Inicio recibe una respuesta válida que indica que corresponde mostrar la invitación
- **THEN** muestra exactamente «Hemos notado que en los últimos días has registrado varias veces emociones de malestar. ¿Te gustaría revisar tu plan o hablar con alguien?» y accesos a `/bienestar`, `/plan-seguridad`, `/red-apoyo` y `/necesito-ayuda`

#### Scenario: La condición preventiva no está activa
- **WHEN** la API indica que no se cumple el umbral
- **THEN** Inicio no muestra la tarjeta preventiva y conserva sus demás contenidos y accesos actuales
