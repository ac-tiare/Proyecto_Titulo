# Design

## Context

La página Inicio ya contiene el saludo, las cinco opciones emocionales y los accesos funcionales a apoyo dentro de un componente Ionic/Angular con estilos encapsulados. La estructura compartida de cabecera y navegación está fuera del componente. Véanse [proposal.md](./proposal.md) y [specs/home-screen/spec.md](./specs/home-screen/spec.md) para la motivación y el contrato de comportamiento.

## Goals / Non-Goals

**Goals:**

- Reordenar la composición de Inicio para acercarla a la referencia y dar jerarquía al selector emocional y a la tarjeta de acompañamiento.
- Usar superficies claras y acentos pastel naturales, con tipografía, foco y objetivos táctiles legibles.
- Mantener la selección, rutas y acciones ya implementadas.

**Non-Goals:**

- Introducir ilustraciones descargadas, nuevas dependencias, componentes compartidos o cambios globales de tema.
- Modificar la cabecera, la barra de navegación, el Login o el comportamiento de otras pantallas.

## Decisions

- **Mantener el rediseño encapsulado en Inicio.** Actualizar su plantilla y estilos locales, en vez de cambiar tokens globales o el shell, evita que el cambio alcance otras rutas.
- **Reutilizar las interacciones y destinos existentes.** Conservar el arreglo de estados, `selectMood` y los enlaces actuales evita introducir cambios de flujo para una tarea visual. La alternativa de añadir selección persistente o lógica emocional se descarta por estar fuera de alcance.
- **Crear el panel de acompañamiento con markup y CSS locales, sin recurso externo.** El proyecto no tiene ilustraciones propias para Inicio; una composición decorativa ligera dentro del componente evita dependencias, solicitudes de red y artefactos nuevos. Los elementos ornamentales serán ignorados por tecnologías de asistencia; el mensaje se expondrá como texto normal.
- **Adaptar el selector con una cuadrícula flexible y validar móvil estrecho.** Mantener las cinco opciones visibles en anchos pequeños requiere limitar etiquetas y espacios con medidas fluidas; evitar una fila con desplazamiento horizontal favorece el descubrimiento y la operabilidad.

## Risks / Trade-offs

- [La composición decorativa local puede no reproducir exactamente la ilustración de la referencia] → Priorizar el tono, la jerarquía y el espacio del panel; no cargar imágenes externas ni retrasar la pantalla por recursos remotos.
- [El selector de cinco opciones puede quedar apretado en móviles estrechos] → Usar tamaños y separaciones fluidos, texto legible y comprobar el diseño a 320 px, además de 375 px.
- [El contenido puede extenderse más allá del área visible por la navegación inferior] → Conservar el desplazamiento vertical normal del contenido y probar que los accesos inferiores sigan alcanzables.

## Migration Plan

No requiere migración ni cambios de dependencias. Aplicar el ajuste en Inicio y validar sus pruebas, navegación y presentación en móvil. Para revertir, restaurar la plantilla y los estilos encapsulados del componente sin afectar el shell.
