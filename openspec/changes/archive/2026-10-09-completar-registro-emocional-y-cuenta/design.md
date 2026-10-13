# Design

## Context

Inicio navega al formulario emocional guardando solo el estado actual en un servicio en memoria. Registro Emocional puede reflejar y cambiar ese estado, pero hoy solo muestra el selector y vuelve a Inicio. Login tiene campos Ionic y estilos SCSS encapsulados; no existe una pantalla ni una capa visual compartida para Crear Cuenta. Véanse [proposal.md](./proposal.md) y las especificaciones delta para alcance y comportamiento.

## Goals / Non-Goals

**Goals:**

- Extender el borrador de navegación existente para transportar el estado de Inicio y reunir las demás entradas hasta una confirmación explícita.
- Mantener los estados emocionales y accesos de Inicio, y reproducir las referencias visuales actuales en las pantallas relacionadas.
- Añadir validación y estados de confirmación perceptibles, sin exponer ni persistir datos personales.

**Non-Goals:**

- Crear autenticación, cuentas, historial durable, sincronización, API, backend o servicios externos.
- Añadir otra dependencia; Angular Forms e Ionic ya están instalados.
- Cambiar el diseño de Inicio o Login, salvo conectar Login con Crear Cuenta.

## Decisions

- **Tratar la selección de Inicio como borrador, no como registro.** Conservar el estado seleccionado en el servicio de sesión que ya lo transporta al formulario evita introducir un mecanismo de ruta redundante y permite editarlo antes de guardar. Solo la confirmación válida crea una entrada temporal; los abandonos y errores de validación no crean ninguna.
- **Mantener el borrador y la lista simulada en memoria de sesión.** Extender el servicio existente permite demostrar confirmación y evitar guardar en localStorage, sessionStorage o un backend. La fecha se deriva de la fecha local del dispositivo al iniciar el borrador. La confirmación bloquea la repetición inmediata del mismo envío; empezar otro registro requiere una nueva interacción de Inicio.
- **Usar validación de formulario del framework ya presente junto a controles Ionic.** Las reglas quedan explícitas y comprobables para campos requeridos, formato de correo y coincidencia de contraseñas, sin incluir restricciones inventadas de contraseña. Los errores se muestran junto a los campos y la confirmación se anuncia como estado accesible.
- **Mantener estilos según el contexto de entrada.** Registro Emocional usará superficies, colores, tarjetas y jerarquía de Inicio. Crear Cuenta seguirá la estructura, inputs, botones, foco y colores de Login. Como no existe una biblioteca visual compartida y los estilos de Login están encapsulados, compartir únicamente tokens/estilos necesarios mediante SCSS local evita un rediseño global y mantiene Login visualmente igual.
- **Conservar navegación separada del shell.** Crear Cuenta será una ruta independiente junto a Login; Registro Emocional seguirá dentro del shell existente. Así Login/Crear Cuenta no heredan la barra inferior y el registro conserva la navegación de la aplicación.

## Risks / Trade-offs

- [La información temporal puede perderse al recargar o cerrar la aplicación] → Mostrar claramente que se trata de una demostración en memoria y no afirmar que existe almacenamiento durable.
- [La validación de varios campos puede desplazar el formulario cuando aparece el teclado] → Mantener el contenido desplazable, asociaciones accesibles de error y comprobar vistas de móvil estrechas y de baja altura.
- [Compartir estilos puede alterar accidentalmente el aspecto actual del Login] → Extraer solo tokens/estilos comunes necesarios y verificar Login con las pruebas existentes y renderizado antes/después.
- [El cambio de emoción desde Inicio puede confundirse con guardar] → Indicar que Inicio solo inicia el formulario y cubrir en pruebas que no se crea un registro hasta una confirmación válida.

## Migration Plan

No se requiere migración ni configuración externa. Implementar primero el estado borrador y el registro temporal, luego la pantalla emocional y su flujo, y después Crear Cuenta y su enlace desde Login. Validar navegación, errores, confirmaciones, accesibilidad visual móvil, pruebas, lint y compilación. La reversión se limita a rutas, pantallas, pruebas y estilos añadidos o modificados; Login debe conservar su presentación actual.
