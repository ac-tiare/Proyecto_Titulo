# Spec Delta

## Purpose

Permite que cada persona guarde y recupere su plan de seguridad personal, organizado en las secciones que ya ofrece CONTIGO.

## ADDED Requirements

### Requirement: El plan de seguridad persiste sus secciones
El sistema SHALL guardar y recuperar por cuenta las señales de alerta, acciones de afrontamiento y lugares de apoyo del plan, conservando el orden de cada elemento.

#### Scenario: La persona guarda cambios del plan
- **WHEN** edita una o más secciones y el servidor confirma la operación
- **THEN** los elementos y su orden quedan asociados a su cuenta y se muestran como guardados

#### Scenario: La persona vuelve a abrir el plan
- **WHEN** consulta el plan con una sesión vigente desde otra visita o dispositivo
- **THEN** recupera sus secciones persistidas sin datos temporales de otra cuenta

### Requirement: La sección de contactos utiliza la red de apoyo
La sección «Mis contactos de confianza» SHALL mostrar contactos de confianza guardados de la misma cuenta y SHALL NOT duplicar sus datos personales como texto independiente del contacto.

#### Scenario: La persona consulta los contactos en el plan
- **WHEN** abre la sección de contactos de su plan
- **THEN** ve únicamente los contactos asociados a su cuenta y puede continuar a su administración existente

### Requirement: La API protege la propiedad del plan
La API SHALL limitar la consulta y modificación del plan a la identidad autenticada y SHALL NOT permitir asignar elementos a un plan de otra persona.

#### Scenario: Una persona intenta modificar el plan ajeno
- **WHEN** envía una referencia a un plan o elemento de otra cuenta
- **THEN** la API rechaza la operación sin modificar ni revelar sus datos

### Requirement: El plan valida y limita el contenido
El sistema SHALL validar el tipo, la longitud y la cantidad de elementos de cada sección antes de persistirlos.

#### Scenario: Una sección contiene elementos inválidos o excesivos
- **WHEN** el contenido supera los límites admitidos o no corresponde a una sección permitida
- **THEN** el servidor devuelve un error de validación y conserva sin cambios el plan previamente guardado
