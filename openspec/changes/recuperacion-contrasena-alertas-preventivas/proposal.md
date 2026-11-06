# Proposal

## Why

El acceso a la cuenta no ofrece recuperación de contraseña y Inicio no conecta las tendencias emocionales ya disponibles con vías concretas de apoyo. Esta mejora habilita una recuperación segura y una invitación preventiva, descriptiva y privada que no interpreta la falta de registros como señal de malestar.

## What Changes

- Agregar recuperación por correo con token de un solo uso y expiración de 15 minutos, conservando Argon2id y revocando las sesiones activas al cambiar la contraseña.
- Aplicar a registro y restablecimiento la política de contraseña de 8 a 128 caracteres y al menos un número, y limitar solicitudes de recuperación a tres por IP y por correo normalizado en 15 minutos.
- Incorporar las pantallas `/forgot-password` y `/reset-password`, conectadas a la API y con mensajes que no revelan si un correo está registrado.
- Calcular una invitación de apoyo con registros de la cuenta autenticada de los últimos siete días corridos: al menos tres registros de estado `mal`/`muy-mal` o con etiquetas tristeza, ansiedad, miedo, enojo o soledad. Cada registro cuenta una sola vez.
- Mostrar en Inicio el texto preventivo acordado y accesos a bienestar (`/bienestar`, historial existente), plan de seguridad, red de apoyo y ayuda rápida; no enviar notificaciones push ni presentar diagnósticos.

## Capabilities

### New Capabilities

- `password-recovery`: solicitud, entrega y uso seguro de enlaces de recuperación de contraseña.
- `emotional-distress-alerts`: cálculo determinista de la invitación preventiva y su presentación privada en Inicio.

### Modified Capabilities

- `home-screen`: Inicio presenta la invitación y los accesos de apoyo cuando la condición se cumple, sin alterar los destinos actuales.

## Impact

- Backend Express/Prisma: autenticación, validadores, almacenamiento de tokens de recuperación, correo SMTP configurable y consulta emocional aislada por propietario.
- Frontend Angular/Ionic: rutas y formularios de recuperación; consulta de la invitación y enlaces en Inicio.
- PostgreSQL: migración aditiva para tokens de recuperación, con caducidad y uso único.
- Operación: nuevas variables SMTP y URL pública del frontend; secretos solo en el entorno de despliegue. No se cambia Argon2id ni se integra Firebase.
