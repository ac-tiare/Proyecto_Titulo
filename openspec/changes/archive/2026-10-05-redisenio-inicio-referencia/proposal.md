# Proposal

## Why

La pantalla Inicio ya permite elegir un estado emocional y acceder a herramientas de apoyo, pero su composición y paleta actuales no coinciden con la nueva referencia visual. Adaptar toda la pantalla permitirá ofrecer una experiencia más cálida, clara y acogedora sin cambiar sus funciones.

## What Changes

- Rediseñar visualmente todo el contenido de Inicio según la referencia: bienvenida, selector de cinco estados emocionales, tarjeta de acompañamiento visual, accesos a herramientas y botón de ayuda.
- Mantener la selección emocional temporal, las rutas y las acciones actuales.
- Conservar sin cambios la cabecera y la navegación inferior compartidas, además de Login y las demás pantallas.
- Adaptar el contenido a móviles y mantener controles legibles, accesibles y cómodos al tacto.
- No incorporar dependencias, servicios, persistencia ni lógica emocional nueva.

## Capabilities

### New Capabilities
- `home-screen`: Presentación visual accesible y adaptable de Inicio, con selección emocional y accesos existentes a apoyo.

### Modified Capabilities

Ninguna.

## Impact

- Afecta la plantilla, estilos y pruebas de `src/app/features/home/`.
- No cambia rutas, servicios, el shell compartido ni otras pantallas.
- No hay ilustraciones de Inicio reutilizables en `src/assets/`; el diseño debe evitar dependencias de imágenes o bibliotecas externas.
