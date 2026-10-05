# Spec Delta

## Purpose

Permitir una interacción inicial de registro emocional y una vista demostrativa del bienestar, sin convertir una base de interfaz en almacenamiento o análisis de información personal.

## ADDED Requirements

### Requirement: Selección emocional de demostración
La aplicación SHALL permitir seleccionar una opción emocional y SHALL indicar claramente que el registro de esta etapa es temporal y no se guarda.

#### Scenario: Seleccionar un estado emocional
- **WHEN** una persona selecciona una opción emocional en Inicio o Registro emocional
- **THEN** la aplicación refleja la selección en la vista actual y comunica que los datos no se almacenan

#### Scenario: Salir del registro emocional
- **WHEN** una persona cierra o recarga la aplicación después de seleccionar una opción
- **THEN** la aplicación no presenta la selección como un registro persistente

### Requirement: Historial emocional de demostración
Mi bienestar SHALL distinguir visualmente cualquier contenido de ejemplo y SHALL presentar el historial sin inferir tendencias, diagnóstico o nivel de riesgo.

#### Scenario: Ver historial de ejemplo
- **WHEN** una persona abre Mi bienestar sin registros persistidos
- **THEN** la aplicación identifica el contenido mostrado como datos de demostración y no como historial personal real

#### Scenario: No hay datos de demostración
- **WHEN** la pantalla no muestra datos de ejemplo
- **THEN** la aplicación explica que todavía no hay registros guardados y no inventa un historial personal
