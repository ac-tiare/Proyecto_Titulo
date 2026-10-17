# Tasks

## 1. Preparación manual de Firebase

- [x] 1.1 Detenerse antes de añadir el SDK o configurar Firebase; guiar a la usuaria para confirmar o crear un proyecto, registrar una app web, habilitar Authentication con Email/Password y crear o confirmar Firestore en modo de producción. Si la base es nueva, pedirle que escoja y confirme la región antes de crearla. Reanudar solo cuando confirme que Authentication y Firestore están listos y entregue el ID de proyecto y la configuración web; verificar que corresponden a la app elegida y no contienen claves privadas.

## 2. Cliente Firebase y autenticación

- [x] 2.1 Verificar la compatibilidad vigente del SDK web modular con Angular 22 e Ionic 9, instalar la dependencia Firebase compatible y comprobar que TypeScript resuelve los módulos Auth y Firestore y que `npm run build` pasa.
- [x] 2.2 Inicializar Firebase una sola vez con los valores web confirmados en los entornos Angular existentes y exponer las instancias de Authentication y Firestore mediante un servicio inyectable. Añadir pruebas de inicialización y documentar en README la configuración pública del cliente; verificar con pruebas focalizadas y el build.
- [ ] 2.3 Conectar Crear Cuenta, Login y Perfil con Authentication; implementar restauración de sesión, cierre de sesión y mensajes de error. Añadir pruebas unitarias para éxito y error de Auth y documentar el flujo; verificar con las pruebas focalizadas y el build.

## 3. Protección de rutas privadas

- [ ] 3.1 Proteger el contenedor de rutas privadas y esperar a que Firebase resuelva la sesión antes de navegar; conservar como destino la ruta solicitada y redirigir a Inicio al autenticarse sin destino. Mantener públicas solo Login y Crear Cuenta. Añadir pruebas para Inicio, rutas de ayuda/información, sesión restaurada y retorno después de cerrar sesión; documentar el acceso privado en README y verificar las pruebas de rutas.

## 4. Registro persistente y reglas de seguridad

- [ ] 4.1 Añadir el campo opcional «Otra» cuando esa emoción esté seleccionada, enlazarlo al borrador y validar sus límites junto a la nota; añadir pruebas de selección, visibilidad y guardado con/sin texto y verificar la suite de Registro Emocional.
- [ ] 4.2 Sustituir el guardado temporal por una escritura autenticada en la ruta Firestore indicada, con UID, IDs existentes, opciones vacías omitidas y fecha de servidor; impedir doble envío mientras está pendiente y mostrar confirmación o error recuperable. Añadir pruebas unitarias de payload, usuario, fallo y doble pulsación, y verificar la suite focalizada.
- [ ] 4.3 No modificar ni publicar reglas de Firestore sin autorización expresa. Antes de usar registros reales, la usuaria debe revisar y configurar manualmente reglas que restrinjan lectura y escritura al UID propio y validen campos, tipos, valores permitidos y fecha del servidor; comprobar entonces con dos UID que no haya acceso cruzado y que las escrituras inválidas se denieguen.
- [ ] 4.4 Documentar en README el esquema `usuarios/{uid}/registros_emocionales/{registroId}`, los datos guardados y la necesidad de configurar manualmente reglas restrictivas en Firebase Console, sin crear ni publicar reglas; verificar que el README advierte que Firestore puede denegar consultas y escrituras hasta esa configuración.

## 5. Historial privado en Mi Bienestar

- [ ] 5.1 Consultar al entrar los registros del UID autenticado en orden descendente y mostrar estado, emociones, nota y fecha, con estados separados de carga, error reintentable e historial vacío. Añadir pruebas unitarias para historial ordenado, vacío, error y reintento, y documentar en README cómo se actualiza el historial al regresar tras guardar; verificar las pruebas focalizadas.

## 6. Verificación integrada

- [ ] 6.1 Ejecutar `npm test`, `npm run lint` y `npm run build`; corregir regresiones relacionadas con esta implementación y confirmar que el bundle no contiene claves privadas ni cuenta de servicio.
- [ ] 6.2 Con la configuración Firebase real confirmada, probar el recorrido manual completo: crear cuenta, Login, seleccionar «Mal» desde Inicio, registrar Ansiedad y Soledad con nota, confirmar el documento y su fecha en Firestore, comprobar Mi Bienestar, cerrar sesión y verificar rutas privadas, e iniciar con una segunda cuenta para confirmar que no ve los registros de la primera.
- [ ] 6.3 Construir y levantar la aplicación existente con `docker compose up --build -d`, comprobar `docker compose ps` y las rutas servidas por Nginx, y verificar en navegador que Login y el recorrido autenticado se conectan al proyecto Firebase; confirmar que Docker Compose sigue ejecutando solo el frontend y que no se alteraron su configuración ni diseño.
