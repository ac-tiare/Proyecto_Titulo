# Tasks

## 1. Modelo y correo de recuperación

- [x] 1.1 Añadir el modelo Prisma de tokens de recuperación (hash único, propietario, vencimiento y uso) y su migración aditiva; verificar generación del cliente y migración en una base PostgreSQL aislada sin modificar datos existentes.
- [x] 1.2 Configurar Nodemailer/SMTP con validación de variables de entorno y transporte sustituible en pruebas; documentar variables, URL del enlace y prueba de correo en `.env.example` y documentación del backend, verificando que no se versionen secretos y que las pruebas no envíen correo real.

## 2. API de restablecimiento

- [x] 2.1 Implementar emisión de token aleatorio, almacenamiento solo de su hash, expiración de 30 minutos, invalidación de enlaces previos y restablecimiento transaccional con Argon2id y revocación de sesiones; cubrir tokens válidos, vencidos, usados, contraseñas inválidas y rollback con pruebas de servicio.
- [x] 2.2 Añadir validadores, controladores, rutas y límites de solicitudes para `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`; documentar solicitudes/respuestas y verificar con pruebas HTTP que el correo existente/no existente no se pueda distinguir y que no se filtren tokens ni secretos.
- [x] 2.3 Integrar la limpieza de tokens de recuperación en la eliminación de cuenta sin incluirlos en exportaciones; verificar eliminación transaccional, referencias y pruebas de privacidad existentes.

## 3. Formularios de recuperación

- [x] 3.1 Añadir rutas públicas `/forgot-password` y `/reset-password`, cliente API y formularios Ionic accesibles; enlazar desde Login y verificar validación de correo/contraseña confirmada, estados de carga, confirmación genérica y errores de token mediante pruebas frontend.
- [x] 3.2 Documentar el flujo de recuperación y sus requisitos operacionales visibles para desarrollo; verificar las instrucciones con la configuración de SMTP y las rutas reales.

## 4. Condición preventiva y presentación

- [x] 4.1 Añadir consulta autenticada que cuente registros propios de los últimos 7 × 24 horas por estados `mal`/`muy-mal` o etiquetas tristeza, ansiedad, miedo, enojo y soledad; verificar límites temporales, deduplicación por registro, umbral 0–2/3+, aislamiento por cuenta, rechazo sin sesión y selección sin notas mediante pruebas backend.
- [x] 4.2 Conectar Inicio a la consulta y mostrar solo al cumplir el umbral la tarjeta no modal con el texto oficial y enlaces a `/bienestar`, `/plan-seguridad`, `/red-apoyo` y `/necesito-ayuda`; verificar ausencia de diagnósticos, manejo/reintento de error, accesibilidad y navegación mediante pruebas frontend.

## 5. Verificación integral

- [x] 5.1 Ejecutar suites backend/frontend, builds, lint y configuración Docker; validar la migración en PostgreSQL de prueba, el proxy `/api`, los dos flujos de recuperación con transporte SMTP falso y la invitación con datos sintéticos, sin borrar volúmenes ni usar datos emocionales reales.

## 6. Ajustes de KAN321-2

- [x] 6.1 Unificar en registro y restablecimiento la política de 8–128 caracteres y al menos un número, manteniendo Argon2id; cubrir aceptación y rechazo con pruebas backend y frontend.
- [x] 6.2 Ajustar los límites a tres solicitudes por IP y tres por correo normalizado en 15 minutos; evitar conservar o registrar el correo en claro en la clave del límite y verificar respuestas no enumerables.
- [x] 6.3 Ajustar el endpoint de solicitud para devolver HTTP 200 con respuesta genérica, establecer la vigencia del token en 15 minutos y cubrir contrato HTTP, vencimiento y uso único.
- [x] 6.4 Actualizar las pantallas a Angular Reactive Forms, usar spinner durante el envío, mostrar confirmación/toast y redirigir a Login tras el restablecimiento exitoso.
- [x] 6.5 Aceptar `SMTP_PASS` y `FRONTEND_URL` como alias compatibles con las variables existentes, revisar la plantilla empática y documentar el flujo y la configuración.
- [x] 6.6 Verificar los ajustes con pruebas focalizadas, suites, builds, lint y Docker; probar en PostgreSQL aislado sin borrar volúmenes ni utilizar datos reales.
