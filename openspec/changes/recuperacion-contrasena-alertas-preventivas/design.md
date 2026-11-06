# Design

## Context

Ver `proposal.md` y las especificaciones de recuperación, invitación preventiva e Inicio. El backend usa Express 5, Prisma 6 y PostgreSQL; el registro/login ya aplican Argon2id y las sesiones se guardan por hashes. El endpoint autenticado `GET /api/emotions/patrones` consulta estados, fechas y etiquetas sin incluir notas. Inicio carga actualmente el formulario de registro en `/mi-bienestar`, mientras que `/bienestar` presenta el historial. SMTP no está configurado todavía.

## Goals / Non-Goals

**Goals:**
- Añadir recuperación verificable sin exponer existencia de cuentas, tokens ni hashes.
- Aplicar límites de recuperación por IP y correo sin registrar el correo en claro, y alinear la política de contraseñas entre registro y restablecimiento.
- Reutilizar el aislamiento por propietario y los estados/etiquetas actuales.
- Mantener una alerta en pantalla, respetuosa y accesible, con errores distintos de un resultado sin alerta.

**Non-Goals:**
- Cambiar Argon2id, implementar bcrypt, añadir autenticación externa o integrar Firebase.
- Enviar push, correo de alerta emocional, diagnósticos o datos emocionales a terceros.
- Cambiar las rutas actuales de registro, historial o navegación de ayuda.

## Decisions

### Tokens de recuperación y actualización transaccional

Generar un token opaco criptográficamente aleatorio con `node:crypto`, enviar el valor solo en un enlace de recuperación y persistir únicamente su hash SHA-256, propietario, vencimiento y momento de uso (`usedAt`). La vigencia será de 15 minutos; la base de datos no permitirá aceptar tokens usados o vencidos. Al solicitar otro enlace se invalidarán los anteriores de esa cuenta. El endpoint público responderá HTTP 200 con el mismo mensaje tanto para correos existentes como para inexistentes, para reducir enumeración de cuentas.

El registro y el restablecimiento validarán una contraseña de 8–128 caracteres que contenga al menos un número. Se conservará Argon2id y no se migrarán los hashes ya almacenados. En una sola transacción, el restablecimiento consumirá el token, actualizará la contraseña y revocará las sesiones activas. Las solicitudes y eliminación de cuenta deberán limpiar los tokens asociados sin incorporarlos a exportaciones.

Alternativa considerada: JWT de recuperación sin estado. Se descarta porque complica el uso único, la revocación y la invalidación de enlaces anteriores. Guardar el token en texto plano también se descarta porque una filtración de la tabla permitiría recuperar cuentas.

### Limitación de solicitudes de recuperación

Permitir como máximo tres solicitudes por IP y tres por correo normalizado en cada ventana de 15 minutos. La clave derivada del correo se calculará de forma no reversible y no se registrará en logs; se mantendrá una respuesta de límite genérica que no confirme la existencia de una cuenta. Se conservará el registro `usedAt` como evidencia temporal de consumo en vez de añadir un booleano redundante.

### Política de contraseña

Usar la misma validación de 8–128 caracteres y al menos un dígito en el registro y en el restablecimiento. Mantener el hash Argon2id existente para las contraseñas nuevas y no modificar ni migrar hashes actuales; así se evitan incompatibilidades de inicio de sesión.

### Entrega de correo

Usar Nodemailer con transporte SMTP configurado por variables de entorno, una URL pública de frontend y una dirección remitente. Además de los nombres ya desplegados (`SMTP_PASSWORD`, `PUBLIC_APP_URL`), aceptar `SMTP_PASS` y `FRONTEND_URL` como alias para no romper instalaciones existentes. El backend construirá el enlace hacia `/reset-password` y no incluirá el token en logs. Las pruebas usarán un transporte de correo sustituible/falso; no requerirán credenciales ni envío real. La interfaz mostrará un mensaje condicional genérico, no una confirmación que permita enumerar cuentas.

Alternativa considerada: integrar un proveedor SaaS específico. Se evita acoplar la aplicación a un proveedor; la configuración SMTP permite decidir el servicio fuera del repositorio.

### Condición preventiva derivada de los registros propios

Agregar una consulta autenticada separada de las tendencias descriptivas actuales. El repositorio seleccionará únicamente fecha, estado y etiquetas de registros cuyo `userId` coincida con la sesión y cuya fecha esté dentro de los últimos 7 × 24 horas. Un registro contará una sola vez si el estado es `BAD`/`VERY_BAD` o incluye `SADNESS`, `ANXIETY`, `FEAR`, `ANGER` o `LONELINESS`; el resultado será verdadero desde tres registros. Las notas no se seleccionan ni se inspeccionan.

El endpoint entregará solo el booleano de la condición. La consulta ocurrirá al entrar a Inicio; si falla, la interfaz comunicará que no pudo cargar la sugerencia y permitirá reintentar, en lugar de tratar el error como ausencia de malestar.

Alternativa considerada: derivar la condición en Angular desde el historial paginado. Se descarta para evitar transferir más datos emocionales y duplicar reglas en el cliente.

### Presentación y navegación

Mostrar la invitación como tarjeta no modal en Inicio con el texto literal definido por la especificación, sin cambiar el contenido existente cuando no corresponde mostrarla. El enlace emocional irá a `/bienestar`, que actualmente abre el historial. Se conservan `/mi-bienestar` para el registro y las rutas existentes de plan, red y ayuda rápida. La tarjeta usará semántica accesible no urgente y no interferirá con acciones del usuario.

Las pantallas de recuperación usarán Angular Reactive Forms con validación compartida con el backend. Mostrarán un spinner durante el envío; después de completar un restablecimiento, Login recibirá un estado de navegación efímero para mostrar un toast, sin incluir secretos en la URL.

## Risks / Trade-offs

- [El correo puede no llegar por configuración SMTP o filtros] → Validar configuración al iniciar, registrar fallos de entrega sin direcciones ni tokens y documentar variables y prueba de envío.
- [Un enlace puede ser filtrado o reenviado] → Token aleatorio, hash en base de datos, vigencia breve, uso único, invalidación de enlaces anteriores y revocación de sesiones tras el cambio.
- [Las respuestas de recuperación pueden revelar una cuenta] → Mantener iguales el código y mensaje públicos; aplicar limitación de solicitudes y no registrar el correo en logs de aplicación.
- [La invitación puede interpretarse como evaluación clínica] → Umbral determinista, copy no diagnóstico, booleano mínimo, ausencia de notas y prohibición de inferir malestar por falta de registros.
- [Los datos pueden cambiar después del cálculo] → Consultar al entrar a Inicio y volver a cargar al regresar; presentar errores de red como errores y no como resultado negativo.

## Migration Plan

1. Añadir una migración Prisma aditiva para tokens de recuperación; no modificar ni borrar filas de usuario, sesión o historial existentes.
2. Desplegar backend con variables SMTP y URL pública configuradas; no habilitar recuperación si la configuración necesaria está ausente.
3. Implementar y probar el flujo de solicitud/reset, incluyendo transacción, expiración, un solo uso, revocación de sesiones y limpieza en eliminación de cuenta.
4. Añadir el endpoint de condición preventiva y conectar Inicio; validar ventanas temporales, umbral, etiquetas, aislamiento entre cuentas y destinos de navegación.
5. Si el despliegue falla, revertir la versión de aplicación. La migración es aditiva; no eliminar la tabla ni volúmenes durante rollback.
