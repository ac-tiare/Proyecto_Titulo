# Spec Delta

## Purpose

Ayuda a la persona a revisar tendencias descriptivas de su historial emocional para facilitar la reflexión personal, sin diagnosticar ni predecir situaciones de crisis.

## ADDED Requirements

### Requirement: La persona consulta tendencias de su historial emocional
La aplicación SHALL presentar resúmenes descriptivos calculados exclusivamente a partir de los registros de la cuenta autenticada y dentro del período seleccionado.

#### Scenario: Hay registros en el período seleccionado
- **WHEN** la persona consulta tendencias con registros disponibles
- **THEN** ve resúmenes de estados de ánimo y emociones frecuentes, además de cambios observables en el período, sin mostrar notas personales como parte del análisis

#### Scenario: No hay registros suficientes
- **WHEN** no existen registros o no hay suficientes para comparar tendencias
- **THEN** la aplicación informa que aún no hay información suficiente y no presenta conclusiones

### Requirement: Las tendencias no diagnostican ni predicen crisis
El sistema SHALL describir únicamente frecuencias y cambios observados y SHALL NOT asignar diagnósticos, puntuaciones de riesgo ni predicciones clínicas.

#### Scenario: Se muestra un resumen emocional
- **WHEN** la aplicación presenta una tendencia
- **THEN** la identifica como descriptiva y no la presenta como evaluación clínica o diagnóstico

### Requirement: Las tendencias permanecen privadas por cuenta
La API SHALL limitar los datos usados para calcular tendencias a los registros de la persona autenticada y SHALL NOT revelar información de otras cuentas.

#### Scenario: La persona consulta sus tendencias
- **WHEN** solicita un resumen con una sesión vigente
- **THEN** recibe únicamente resultados derivados de sus propios registros

#### Scenario: La solicitud no tiene una sesión válida
- **WHEN** se solicitan tendencias sin autenticación válida
- **THEN** la API rechaza la solicitud sin devolver resúmenes ni datos personales
