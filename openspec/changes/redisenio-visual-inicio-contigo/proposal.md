# Proposal

## Why

La pantalla Inicio ya reúne el saludo, el selector emocional y los accesos de apoyo, pero su presentación todavía no coincide con la identidad cálida, clara y pastel de la referencia. Un rediseño acotado de Inicio permitirá validar esa identidad antes de extenderla a otras pantallas.

## What Changes

- Rediseñar visualmente solo el contenido de Inicio con morados y lilas suaves, fondos claros, tarjetas pastel, bordes redondeados, sombras sutiles y controles cómodos para móvil.
- Conservar el saludo, los cinco estados emocionales, los tres accesos rápidos y el acceso calmado a Necesito ayuda, junto con sus destinos e interacciones actuales.
- Mantener la cabecera y la barra inferior compartidas sin cambios; no aplicar todavía el nuevo estilo al resto de las pantallas.
- Comprobar que el diseño de Inicio sea adaptable y accesible, y que su contenido siga funcionando.

## Capabilities

### New Capabilities

- `home-screen`: Presentación y contenido accesible, adaptable y visualmente coherente de la pantalla Inicio, conservando sus interacciones existentes.

### Modified Capabilities

Ninguna.

## Impact

- Afecta la plantilla, los estilos y las pruebas de `src/app/features/home/`.
- No cambia rutas, servicios, datos, dependencias, arquitectura, cabecera ni barra de navegación compartidas.
- Los colores y estilos nuevos se limitarán a Inicio en esta etapa para evitar cambios visuales en las otras pantallas.
