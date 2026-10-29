# Spec Delta

## Purpose

Permite comprobar si la API está activa y si puede atender solicitudes que dependen de PostgreSQL, para que el despliegue detecte fallos reales de disponibilidad.

## ADDED Requirements

### Requirement: El endpoint de salud informa que la API está activa
La API SHALL exponer un endpoint de salud que responda en JSON cuando el proceso HTTP está activo, sin revelar configuración ni datos personales.

#### Scenario: El proceso API está activo
- **WHEN** se consulta el endpoint de salud
- **THEN** responde con un estado HTTP exitoso y una respuesta JSON sin datos sensibles

### Requirement: El endpoint de readiness verifica PostgreSQL
La API SHALL exponer un endpoint de preparación que compruebe la conexión con PostgreSQL y devuelva un estado no exitoso cuando la base de datos no esté disponible.

#### Scenario: PostgreSQL acepta consultas
- **WHEN** se consulta readiness con la base de datos disponible
- **THEN** la API informa que está preparada para recibir solicitudes

#### Scenario: PostgreSQL no está disponible
- **WHEN** se consulta readiness mientras falla la conexión a la base de datos
- **THEN** la API devuelve un estado no exitoso sin exponer detalles internos de conexión
