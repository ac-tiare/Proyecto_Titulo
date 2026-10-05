# Design

## Context

Inicio ya se implementa como una página standalone de Ionic/Angular con estilos encapsulados, opciones emocionales y enlaces con destinos funcionales. La cabecera y la barra inferior pertenecen a un shell compartido; véase `proposal.md` para el alcance acordado y `specs/home-screen/spec.md` para el contrato observable.

## Goals / Non-Goals

**Goals:**

- Aplicar la paleta pastel solicitada a la composición de bienvenida, selector emocional, accesos y ayuda de Inicio.
- Conservar los componentes de Ionic, los iconos registrados, la navegación y el servicio de selección emocional ya existentes.
- Mantener estilos y tokens visuales dentro del ámbito de Inicio en esta iteración.

**Non-Goals:**

- Modificar el shell compartido, el tema global, otras rutas o pantallas.
- Añadir componentes compartidos, dependencias, almacenamiento, datos de contactos ni lógica emocional nueva.

## Decisions

- **Limitar estilos y variables CSS al componente Inicio.** Definir los colores, superficies y radios necesarios en los estilos encapsulados de la página evita que el nuevo morado cambie accidentalmente otras rutas. La alternativa de cambiar tokens globales se pospone hasta que se apruebe extender el sistema visual.
- **Reutilizar Ionic y la estructura funcional existente.** Ajustar la composición y los estilos de los botones y enlaces que ya están presentes mantiene las interacciones y evita dependencias o abstracciones innecesarias. No se creará un componente reutilizable para una única pantalla.
- **Adaptar la disposición con CSS responsive y objetivos táctiles amplios.** El selector y las tarjetas deben reorganizarse dentro del ancho disponible, con foco visible y sin desbordamiento a 320 px; no se requiere lógica de adaptación en TypeScript.
- **Validar contenido e interacción con las pruebas de Inicio y revisar el renderizado móvil.** Las pruebas existentes cubren los textos, enlaces y selección emocional; se ampliarán si el rediseño hace necesario cubrir nuevos estados observables.

## Risks / Trade-offs

- [El shell y las otras rutas conservarán temporalmente el estilo anterior] → Mantener ese límite permite validar Inicio de manera aislada; no aplicar tokens globales en esta fase.
- [El nuevo diseño puede apretar el selector en pantallas estrechas] → Usar una cuadrícula adaptable y comprobar el ancho de 320 px, además de foco y activación por teclado.

## Migration Plan

No hay migración de datos ni cambios de dependencias. Aplicar los estilos únicamente a Inicio; para revertir, restaurar su plantilla y estilos sin tocar el shell ni los servicios.
