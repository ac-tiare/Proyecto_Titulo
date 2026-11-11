# resources Specification

## Purpose

Ofrece información de bienestar emocional y prevención en un catálogo organizado, para que pasajeros y trabajadores puedan consultar recursos confiables y acceder a su contenido completo.

## Requirements

### Requirement: La persona explora recursos por temática
La aplicación SHALL presentar recursos informativos organizados en Bienestar Emocional (`bienestar-emocional`), Señales de Alerta (`senales-alerta`), Autocuidado (`autocuidado`) y Búsqueda de Ayuda y Prevención (`busqueda-ayuda-prevencion`).

#### Scenario: La persona abre el catálogo
- **WHEN** consulta la vista de recursos
- **THEN** ve recursos con título, resumen y temática, y puede distinguir las cuatro categorías disponibles

#### Scenario: La persona filtra por una categoría
- **WHEN** selecciona una categoría
- **THEN** la vista muestra únicamente recursos de esa categoría y comunica cuál filtro está activo

#### Scenario: La persona vuelve a mostrar todas las categorías
- **WHEN** selecciona la opción para ver todos los recursos
- **THEN** la vista presenta recursos de las cuatro categorías

### Requirement: La persona consulta el contenido completo de un recurso
La aplicación SHALL permitir abrir y cerrar el contenido completo de un recurso sin perder la categoría seleccionada ni el contexto del catálogo.

#### Scenario: La persona abre un recurso
- **WHEN** selecciona un recurso del catálogo
- **THEN** ve su contenido completo y puede regresar a la vista filtrada donde lo seleccionó

### Requirement: La API entrega recursos y detalles
La API SHALL permitir listar recursos, filtrar el listado por categoría y consultar el contenido completo de un recurso identificado.

#### Scenario: La persona solicita el catálogo
- **WHEN** consulta `GET /api/resources` sin filtro
- **THEN** recibe una lista de recursos que incluye sus identificadores, títulos, resúmenes, categorías, imagen opcional y fecha de creación

#### Scenario: La persona solicita una categoría
- **WHEN** consulta `GET /api/resources?category=...` con una categoría válida
- **THEN** recibe únicamente recursos pertenecientes a esa categoría

#### Scenario: La persona solicita el detalle de un recurso existente
- **WHEN** consulta `GET /api/resources/:id` con un identificador existente
- **THEN** recibe el contenido completo y los metadatos de ese recurso, incluidos su categoría, imagen opcional y fecha de creación

#### Scenario: La persona solicita un recurso inexistente
- **WHEN** consulta `GET /api/resources/:id` con un identificador desconocido
- **THEN** recibe una respuesta de no encontrado sin contenido de otro recurso

#### Scenario: La persona solicita una categoría inválida
- **WHEN** consulta `GET /api/resources?category=...` con una categoría no admitida
- **THEN** recibe un error de validación explícito

### Requirement: La aplicación comunica el estado del catálogo
La vista SHALL distinguir la carga, la ausencia de recursos y los errores de consulta, y SHALL NOT presentar un fallo de carga como un catálogo vacío.

#### Scenario: El catálogo está cargando
- **WHEN** la aplicación solicita recursos
- **THEN** comunica que el contenido está cargando

#### Scenario: No hay recursos para mostrar
- **WHEN** la consulta termina correctamente y no hay recursos para el filtro seleccionado
- **THEN** comunica que no hay recursos disponibles en esa categoría

#### Scenario: No se puede cargar el catálogo
- **WHEN** falla la consulta de recursos o de un detalle
- **THEN** informa que no se pudo cargar el contenido y conserva una opción para volver a intentar

### Requirement: Los recursos se presentan de forma accesible y cuidadosa
La vista SHALL permitir usar filtros y detalles con tecnologías de asistencia y SHALL identificar el contenido como informativo, sin presentarlo como diagnóstico ni reemplazo de atención profesional.

#### Scenario: La persona navega con tecnologías de asistencia
- **WHEN** recorre los filtros y recursos
- **THEN** los controles comunican su etiqueta, estado seleccionado y acción disponible

#### Scenario: La persona lee información de apoyo
- **WHEN** consulta un recurso
- **THEN** la aplicación aclara que el contenido es informativo y no reemplaza la orientación profesional
