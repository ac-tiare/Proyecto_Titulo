# Design

## Context

La aplicación es Angular 22 con Ionic 9 y TypeScript. Las pantallas actuales son independientes y usan un servicio de registros en memoria; `environment.ts` y `environment.prod.ts` existen y Angular reemplaza el primero por el segundo en compilaciones de producción. La imagen Docker actual sirve el frontend estático con Nginx; no existe backend ni base de datos local. No se encontró proyecto ni configuración Firebase.

## Goals / Non-Goals

**Goals:**

- Conectar el frontend existente con Firebase Authentication y Cloud Firestore.
- Mantener los datos aislados por UID y validar las escrituras mediante reglas publicadas en Firestore.
- Mantener intactos el aspecto y el recorrido visual existentes, salvo las acciones y estados necesarios para autenticar y comunicar persistencia real.
- Dejar instrucciones reproducibles para configuración, pruebas y operación.

**Non-Goals:**

- Añadir un servidor propio, una base de datos local o contenedores nuevos: Authentication y Firestore son servicios administrados de Firebase.
- Incorporar análisis de tendencias, notificaciones preventivas, IA, edición o eliminación de registros.
- Cambiar el diseño general, las rutas existentes ni Docker/Nginx.

## Decisions

1. **Usar el SDK web modular oficial de Firebase directamente.** No hay AngularFire instalado y el SDK modular limita dependencias y permite usar únicamente Authentication y Firestore. Antes de instalarlo, verificar su compatibilidad vigente con Angular 22 e Ionic 9. No añadir SDK Admin ni credenciales de cuenta de servicio al cliente.

2. **Detener la implementación antes de integrar una configuración Firebase real.** No se encontró un proyecto o credenciales Firebase. Primero la usuaria debe confirmar si usará un proyecto existente o creará uno, registrar una aplicación web, habilitar Email/Password y crear o confirmar Firestore. Si crea Firestore, debe elegir su región; no elegirla por cuenta propia porque no se puede cambiar después. Retomar la integración solo después de recibir la configuración web real y confirmar que Authentication y Firestore están listos. No introducir valores ficticios.

3. **Usar los archivos de entorno Angular que ya existen.** La configuración de cliente se define por entorno y se consume al inicializar Firebase una sola vez. La configuración web (incluida la API key) es pública en una aplicación de navegador: no es una contraseña ni permite el acceso sin autorización. No incluir contraseñas, claves privadas ni archivos de cuenta de servicio. Firestore Security Rules, no la ocultación del cliente, son la barrera de seguridad. La imagen Docker solo contendrá el bundle web y su configuración pública.

4. **Centralizar la sesión y esperar su restauración antes de proteger rutas.** Un servicio compartido proporciona la identidad de Firebase, operaciones de crear cuenta/iniciar/cerrar sesión y un estado inicial resuelto. Un guard cubre el contenedor de rutas privadas existente, de modo que también queden protegidas las pantallas de ayuda e información; Login y Crear Cuenta permanecen rutas públicas. Tras Login, usar la ruta privada originalmente solicitada o Inicio.

5. **Usar UID y catálogos actuales como valores persistidos.** Crear documentos en `usuarios/{uid}/registros_emocionales/{registroId}` con los campos `estadoEmocional`, `emociones`, `usuarioId` y `fechaRegistro`; añadir `nota` y `otraEmocion` solo cuando tengan contenido. Persistir los identificadores actuales (`muy-bien`, `bien`, `mas-o-menos`, `mal`, `muy-mal` y los IDs existentes de emoción), y mostrar sus etiquetas españolas en la interfaz. Crear `fechaRegistro` con `serverTimestamp()`. Mantener el límite actual de 500 caracteres para la nota y aplicarlo también a `otraEmocion`.

6. **Validar y hacer append-only el historial en reglas.** Las reglas deben autenticar y comparar UID/ruta, restringir las rutas consultables, exigir estado y una o más emociones válidos, limitar los campos y tipos, comprobar que `usuarioId` coincida con la sesión y que `fechaRegistro` corresponda al timestamp del servidor. Permitir lectura propia y creación válida; denegar actualización, eliminación y cualquier ruta no autorizada. Probar estas reglas con Firebase Emulator y pruebas de autorización de dos UID.

7. **Evitar escrituras dobles sin mostrar éxitos prematuros.** Deshabilitar «Guardar registro» mientras la escritura está pendiente; confirmar solo al resolverse la escritura de Firestore y volver a habilitar el envío si falla. No activar persistencia offline: un registro solo se confirma en la interfaz al recibir confirmación del servicio.

8. **Cargar Mi Bienestar al entrar a la pantalla.** Consultar solo la subcolección del UID activo, ordenada por `fechaRegistro` descendente. Distinguir carga, historial vacío y fallo de red; al volver a la pantalla tras guardar, la consulta obtiene el nuevo registro sin depender del borrador local.

## Risks / Trade-offs

- [Configuración Firebase todavía inexistente] → Bloquear esa etapa de la implementación y guiar a la usuaria por Firebase Console; esperar proyecto, región y configuración reales.
- [La configuración de una app web puede confundirse con una credencial privada] → Documentar que es pública y no autoriza datos por sí sola; nunca distribuir una clave Admin y desplegar primero reglas restrictivas.
- [Reglas estrictas pueden rechazar documentos incompatibles] → Compartir los mismos IDs, campos y límites entre validación de interfaz, servicio y pruebas de emulador.
- [Una región incorrecta aumenta latencia y no se puede cambiar en la base creada] → No crear Firestore ni escoger región hasta confirmarla expresamente con la usuaria.
- [Sin persistencia offline, un guardado depende de la conexión] → Mantener el borrador en pantalla y mostrar un error recuperable si no se confirma la escritura.
- [Firebase web config se incluye en el bundle del navegador] → No poner secretos en él; la autorización depende de Authentication y reglas de Firestore. No se requiere cambiar Docker Compose.

## Migration Plan

1. Pausar antes de introducir el SDK/configuración y explicar a la usuaria cómo seleccionar o crear su proyecto Firebase, registrar la app web, habilitar Email/Password, elegir región y habilitar Firestore.
2. Recibir y verificar la configuración web real; crear e instalar las reglas restrictivas antes de guardar datos reales.
3. Integrar y probar Authentication, guardas, escritura y consulta; actualizar el README con requisitos y despliegue de reglas.
4. Validar con pruebas unitarias, pruebas de reglas en emulador, build y recorrido manual con cuentas autenticadas.
5. Reversión: quitar el guard y volver a habilitar el servicio temporal solo mediante cambios explícitos de código; no borrar ni migrar datos Firestore. Mantener las interfaces existentes y no sustituir datos reales con ejemplos.

## Open Questions

Ninguna decisión de comportamiento queda pendiente. El proyecto Firebase, su configuración web y la región de Firestore son entradas operativas que deberán confirmarse con la usuaria antes de ejecutar la integración.
