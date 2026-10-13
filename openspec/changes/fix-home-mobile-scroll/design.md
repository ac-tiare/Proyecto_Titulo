# Design

## Context

Véase [proposal.md](./proposal.md) para el motivo y el alcance. El shell compartido monta `ion-header` antes de `ion-tabs`; el router outlet de pestañas y `ion-tab-bar` son hermanos dentro del shell. Inicio presenta `ion-content` con `scroll-y="true"` y `.home-page` usa CSS Grid con `min-height: 100%` y padding inferior. También existe un gesto manual de mouse para ventanas de ancho móvil que guarda una referencia al scroll interno de Ionic y escucha eventos globales mientras el puntero está activo.

`src/global.scss` importa los estilos estructurales de Ionic y no declara reglas propias de overflow o altura para `body`, `html` o los contenedores de la app. Ionic sí administra el viewport fijando `body` y ocultando su overflow; ese comportamiento es normal cuando las pantallas desplazan su propio `ion-content`. En la comprobación de navegador anterior, el `ion-content` de Inicio reportó scroll vertical habilitado y un contenido más alto que el viewport. Esos datos no identifican por sí solos por qué el gesto de la persona falla; aún falta comprobar el recorrido real de eventos y la geometría de todos los ancestros al cambiar entre las cuatro pestañas.

La medición reproducible confirmó dos causas relacionadas. A 320×568, el encabezado ocupaba y=0–64, pero `ion-tabs` también comenzaba en y=0; `ion-content` se extendía de y=0 a y=503, mientras la barra inferior ocupaba y=503–568. Las mismas posiciones relativas se observaron a 375×667 y 1280×800. La pantalla compensaba la superposición con padding superior, pero el área de scroll no empezaba realmente bajo el encabezado. Además, tras recargar Inicio, la referencia que el arrastre manual de mouse necesitaba seguía siendo nula: el scroller tenía overflow `auto` y espacio desplazable, pero el handler ignoraba el movimiento. Obtener el scroller al iniciar el gesto hizo que el arrastre lo desplazara.

## Goals / Non-Goals

**Goals:**

- Identificar con medidas del navegador qué elemento recibe y procesa cada gesto y cuál es la única superficie desplazable.
- Limitar esa superficie al espacio entre la cabecera y la barra inferior, y permitir que su contenido alcance el final sin quedar tapado.
- Mantener la gestión del viewport global de Ionic, la presentación existente y las acciones de controles.
- Validar scroll de mouse y táctil, cambios de tamaño y las rutas actuales de las pestañas.

**Non-Goals:**

- Rediseñar Inicio, la cabecera, la barra inferior o las demás pantallas.
- Cambiar navegación, contenido de apoyo o comportamiento del registro emocional.
- Modificar reglas globales de `body`/`html` o añadir dependencias sin evidencia de que sean necesarias para la causa.

## Decisions

- **Medir antes de escoger el nodo a corregir.** Tras cargar cada ruta y estabilizar Ionic, registrar para `ion-app`, shell, `ion-tabs`, `ion-router-outlet`, `.ion-page`, `ion-content`, su elemento de scroll y la barra: rectángulos, alturas cliente/scroll, `overflow`, `position`, `display`, `min-height`, `touch-action`, foco/hit target y eventos wheel/touch/pointer. Comparar vistas de 320×568, 375×667 y escritorio, además de observar el cambio de ruta. Esto distingue un scroll container sin altura disponible, una intercepción de eventos y un gesto que no se emite.
- **Mantener un único propietario del scroll.** Preferir el `ion-content` de la pantalla como superficie de scroll por su integración con Ionic y gestos táctiles. Si la cadena de padres impide que ocupe el espacio entre el header y la tab bar, ajustar en el shell únicamente las dimensiones y restricciones flex/grid necesarias (incluido `min-height: 0` donde las mediciones lo justifiquen). No convertir simultáneamente `.home-page` en otro contenedor desplazable.
- **Dar al shell una altura central real.** El host de `MainTabsComponent` organiza el header y `ion-tabs` en columna; `ion-tabs` participa en el flujo flex en vez de cubrir todo el viewport. Inicio deja de compensar la cabecera con padding superior y reserva espacio final, incluida el área segura inferior.
- **Conservar la geometría del shell.** Mantener el header superior y `ion-tab-bar` en sus posiciones actuales; reservar el espacio central según las dimensiones reales de ambos. Añadir el padding inferior y safe-area al contenido desplazable, no al viewport global, para poder mostrar completa la última tarjeta.
- **Tratar aparte el arrastre con mouse emulado.** La lógica manual existente solo aplica a puntero mouse bajo un umbral de ancho y excluye elementos interactivos. Como la referencia al scroller puede no estar lista al montar la ruta, resolverla al iniciar el gesto y aplicar el movimiento al `ion-content` único. Liberar el estado en todos los finales del gesto y no impedir clicks cortos. En dispositivo táctil se debe usar el gesto nativo.
- **No alterar el bloqueo global de Ionic sin prueba causal.** `body { position: fixed; overflow: hidden }` es parte del layout habitual de Ionic y evita el scroll de documento; las pantallas gestionan el suyo mediante `ion-content`. Solo se tocaría esa capa si una reproducción demuestra que está capturando el gesto, y cualquier cambio tendría que preservar los demás tabs y el comportamiento de las pantallas Login/Registro.
- **Probar interacción además de atributos CSS.** Las pruebas automatizadas comprobarán el contrato de layout y navegación; una sesión de navegador con viewport móvil comprobará wheel, barra, drag de mouse y touch emulado, los límites superior/inferior, cabecera/barra fijas, el espacio final y ausencia de scrollbars anidadas.

## Risks / Trade-offs

- [Los eventos táctiles simulados por navegador pueden no equivaler a un dispositivo físico] → Separar la evidencia de mouse emulado y touch emulado, y ejecutar una comprobación manual en teléfono cuando el runtime esté disponible; reportar claramente cualquier límite del entorno.
- [Ajustar el shell puede cambiar la altura de otras pestañas] → Validar Mi bienestar, Plan y Red de apoyo a varias alturas y anchos, conservando sus propios `ion-content` y navegación.
- [Un gesto de mouse personalizado puede interferir con clicks o navegación] → Ignorar controles interactivos, aplicar umbral de movimiento y probar tanto drag como clicks de botones/enlaces.
- [El padding seguro inferior puede parecer espacio excesivo en escritorio] → Aplicarlo solo en el contenedor desplazable y comprobarlo en ventanas de altura grande y pequeña.

## Migration Plan

No se requiere migración. Aplicar la corrección en el contenedor cuya geometría/eventos confirmen como causa, ejecutar pruebas y la revisión interactiva de rutas y entradas, y revertir únicamente los cambios de layout/gesto si la verificación detecta regresiones.
