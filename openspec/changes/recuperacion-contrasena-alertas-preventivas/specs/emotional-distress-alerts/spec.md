# Spec Delta

## Purpose

Ofrece una invitación privada y no clínica a consultar vías de apoyo cuando varios registros recientes reflejan malestar, usando exclusivamente datos explícitos de la cuenta autenticada.

## ADDED Requirements

### Requirement: El sistema detecta la condición de invitación preventiva
La API SHALL contar registros emocionales propios de los últimos siete días corridos y activar la invitación cuando al menos tres registros califican por estado `mal`/`muy-mal` o por una emoción triste, ansiosa, de miedo, enojo o soledad.

#### Scenario: Se alcanza el umbral con estados de malestar
- **WHEN** la cuenta tiene al menos tres registros en los últimos siete días con estado `mal` o `muy-mal`
- **THEN** la API indica que corresponde mostrar la invitación

#### Scenario: Se alcanza el umbral con etiquetas emocionales
- **WHEN** al menos tres registros propios de los últimos siete días incluyen una o más etiquetas tristeza, ansiedad, miedo, enojo o soledad, aunque su estado sea distinto
- **THEN** la API indica que corresponde mostrar la invitación

#### Scenario: Un registro coincide por estado y etiqueta
- **WHEN** un mismo registro cumple el criterio por estado y por una o más etiquetas
- **THEN** se cuenta una sola vez hacia el umbral

#### Scenario: No se alcanza el umbral o faltan registros
- **WHEN** existen menos de tres registros que califican, incluidos los casos sin registros
- **THEN** la API no activa la invitación y no interpreta la ausencia de datos como malestar

### Requirement: La detección permanece privada y no clínica
La API SHALL calcular la condición solo con la identidad autenticada y SHALL NOT consultar ni devolver notas, datos de otras cuentas, diagnósticos, puntuaciones de riesgo o predicciones clínicas.

#### Scenario: Una persona consulta su condición
- **WHEN** solicita la condición con una sesión vigente
- **THEN** recibe únicamente el resultado booleano derivado de sus propios registros

#### Scenario: La solicitud no está autenticada
- **WHEN** se consulta la condición sin una sesión válida
- **THEN** la API rechaza la solicitud sin revelar si existen registros

### Requirement: La aplicación comunica errores de consulta con claridad
La aplicación SHALL distinguir un error al consultar la condición de una respuesta válida sin invitación y SHALL ofrecer una forma accesible de volver a consultar.

#### Scenario: No se puede consultar el servicio
- **WHEN** falla la solicitud autenticada de la condición
- **THEN** la aplicación no presenta el error como una evaluación negativa y comunica que no pudo cargar la sugerencia
