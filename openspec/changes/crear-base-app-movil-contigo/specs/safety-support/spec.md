# Spec Delta

## Purpose

Ofrecer puntos de acceso iniciales a herramientas de seguridad y apoyo humano, con información responsable y sin atribuir a CONTIGO funciones clínicas o de respuesta a emergencias.

## ADDED Requirements

### Requirement: Plan de seguridad inicial
La aplicación SHALL ofrecer una pantalla de Plan de seguridad con contenido orientativo y SHALL identificar de forma inequívoca cualquier contenido de demostración.

#### Scenario: Consultar el plan de seguridad de ejemplo
- **WHEN** una persona abre el Plan de seguridad sin un plan guardado
- **THEN** la pantalla distingue el contenido de ejemplo de un plan personal y no afirma que se haya guardado

#### Scenario: Consultar el plan sin servicios conectados
- **WHEN** una persona usa el Plan de seguridad en esta etapa inicial
- **THEN** puede leer el contenido disponible sin iniciar sesión ni depender de una conexión de red

### Requirement: Red de apoyo de demostración
La aplicación SHALL ofrecer una pantalla de Red de apoyo y SHALL distinguir los contactos de ejemplo de contactos reales de la persona.

#### Scenario: Consultar la red de apoyo inicial
- **WHEN** una persona abre Red de apoyo sin contactos guardados
- **THEN** la aplicación identifica cualquier contacto mostrado como demostrativo y no lo presenta como contacto real o disponible

### Requirement: Acceso a ayuda e información responsable
La aplicación SHALL ofrecer las pantallas Necesito ayuda e Información y recursos, y SHALL evitar inventar o presentar como oficiales contactos, servicios o instrucciones de emergencia sin verificación.

#### Scenario: Abrir Necesito ayuda
- **WHEN** una persona selecciona Necesito ayuda
- **THEN** la aplicación muestra una vía clara para buscar apoyo humano y no afirma diagnosticar, predecir ni reemplazar atención profesional

#### Scenario: Mostrar recursos de Chile
- **WHEN** la aplicación presenta números, servicios u otros recursos de ayuda para Chile
- **THEN** cada recurso está verificado en una fuente oficial antes de publicarse y no se presenta información no verificada como un servicio disponible

#### Scenario: Consultar información y recursos
- **WHEN** una persona abre Información y recursos
- **THEN** puede distinguir el contenido educativo de cualquier recomendación profesional o servicio de emergencia
