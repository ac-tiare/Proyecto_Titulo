# Design

## Context

La aplicación usa rutas standalone cargadas de forma diferida. Las pantallas actuales están anidadas bajo `MainTabsComponent`, que aporta cabecera y barra inferior; Login necesita mostrarse fuera de ese shell mientras mantiene las rutas de la app. Angular Forms e Ionic ya están instalados. Véase `proposal.md` para el flujo acordado y `specs/login-screen/spec.md` para el contrato observable.

## Goals / Non-Goals

**Goals:**

- Añadir una página standalone de Login con controles Ionic, estilos encapsulados y diseño que pueda desplazarse cuando el teclado reduzca el espacio visible.
- Mantener la navegación existente dentro de `MainTabsComponent` y entrar a ella por `/inicio` después de la acción de demostración.
- Comunicar explícitamente que no hay autenticación y que las acciones secundarias todavía no están disponibles.

**Non-Goals:**

- Crear guards, cuentas, sesiones, validación de credenciales, persistencia, telemetría o solicitudes de red.
- Cambiar el tema global, la cabecera y barra inferior del shell, ni el comportamiento de otras pantallas.
- Agregar dependencias o rediseñar la aplicación existente.

## Decisions

- **Definir Login como una ruta raíz hermana del shell.** La ruta `login` renderiza la página sin cabecera ni pestañas; la ruta vacía redirige allí, mientras las rutas actuales siguen bajo el shell. Así Login funciona como entrada sin trasladar el marco de navegación a esa pantalla. Se descarta envolver todo bajo una condición de sesión, porque no hay autenticación que administrar.
- **Hacer que «Iniciar sesión» navegue a `/inicio` sin validar ni transmitir los campos.** Esto permite recorrer la aplicación como demo y corresponde a la decisión confirmada por la persona. La interfaz debe identificar el carácter demostrativo para no dar a entender que verificó una cuenta.
- **Usar inputs Ionic etiquetados y mantener el estado de visibilidad de contraseña solo en el componente.** La alternancia cambia entre `password` y `text`; no se conserva el valor fuera del campo ni se añade lógica de cuentas. La alternativa de crear un servicio no aporta valor sin backend.
- **Mantener los colores del Login encapsulados en sus estilos.** Los tonos azul, celeste, menta y beige no deben cambiar los tokens globales verdes ni el Inicio lila. Reutilizar Ionic y las variables existentes para tipografía y componentes evita dependencias.
- **Mostrar una notificación local para las acciones secundarias no disponibles.** Evita enlaces inertes y deja claro que recuperación y registro aún no existen, sin simular éxito ni salir de Login.

## Risks / Trade-offs

- [El botón avanza aunque los campos estén vacíos y puede confundirse con acceso real] → Mostrar una nota de «modo demostración» y no usar mensajes de autenticación exitosa.
- [Las rutas iniciales pasan a mostrar Login] → Conservar `/inicio` y verificar que al entrar a la demo todas las rutas previas siguen disponibles.
- [El teclado puede cubrir controles en un viewport bajo] → Usar contenido desplazable y comprobar foco, desplazamiento y acceso a botones con una altura móvil reducida.

## Migration Plan

No hay cambios de datos ni dependencias. Añadir la página y sus rutas sin borrar las actuales. Para revertir, volver a dirigir la ruta raíz a Inicio y retirar la ruta/página Login.
