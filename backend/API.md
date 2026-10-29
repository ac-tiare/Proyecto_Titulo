# Referencia de la API CONTIGO

## Convenciones

- Prefijo: `/api`. En local, el backend escucha en `http://localhost:3000`; mediante Docker, Nginx proxya `/api` desde el frontend.
- Las respuestas exitosas con contenido usan `{ "data": ... }`. Los errores usan `{ "error": { "code": "...", "message": "...", "details"?: [...] } }`.
- Las rutas privadas aceptan cookie de sesión en web o `Authorization: Bearer <accessToken>` en Capacitor nativo. El backend obtiene la cuenta desde la sesión; no se envía `userId`.
- Las mutaciones web requieren un origen permitido, la cookie `XSRF-TOKEN` y el encabezado `X-XSRF-TOKEN` con el mismo valor. Las solicitudes nativas deben incluir `X-Contigo-Client: native` y un `Origin` nativo configurado. No se debe desactivar la validación TLS.
- Registro, login y renovación están limitados a 8 solicitudes por ventana de 15 minutos. Al exceder el límite se responde `429 RATE_LIMITED`.

## Sesiones y autenticación

### Obtener prueba CSRF (web)

`GET /api/auth/csrf` no requiere sesión. Devuelve un token y establece la cookie `XSRF-TOKEN`.

```http
GET /api/auth/csrf
```

```json
{ "data": { "csrfToken": "<csrf-token>" } }
```

El cliente web debe enviar la cookie y copiar su valor al encabezado `X-XSRF-TOKEN` en cada mutación. El token CSRF no es una credencial de sesión.

### Registrar una cuenta

`POST /api/auth/register` crea una cuenta y su sesión en una transacción.

```json
{
  "name": "Alex",
  "surname": "Pérez",
  "email": "alex@example.cl",
  "password": "<mínimo 12 caracteres>"
}
```

Responde `201`. `name` y `email` son obligatorios; `surname` es opcional. El correo se normaliza a minúsculas. En web, las credenciales se entregan en cookies `HttpOnly`; en cliente nativo también se devuelven en JSON:

```json
{
  "data": {
    "user": {
      "id": "<uuid>",
      "name": "Alex",
      "surname": "Pérez",
      "email": "alex@example.cl"
    },
    "accessToken": "<credencial-opaca>",
    "refreshToken": "<credencial-opaca>",
    "accessExpiresAt": "<fecha ISO 8601>",
    "refreshExpiresAt": "<fecha ISO 8601>"
  }
}
```

Una cuenta con correo ya registrado responde `409 EMAIL_ALREADY_REGISTERED`. El hash de contraseña nunca se devuelve.

### Iniciar sesión

`POST /api/auth/login` recibe `email` y `password`; responde `200` con el perfil y las expiraciones. El cliente nativo recibe además `accessToken` y `refreshToken`; el navegador recibe las cookies seguras y no los tokens en el cuerpo. Credenciales incorrectas responden `401 INVALID_CREDENTIALS`.

### Renovar sesión

`POST /api/auth/refresh` rota las credenciales de una sesión. El cliente nativo envía:

```json
{ "refreshToken": "<credencial-de-renovación-actual>" }
```

El navegador usa la cookie HttpOnly `contigo_refresh` y la prueba CSRF. La respuesta tiene la misma forma de sesión que login; el cliente nativo debe reemplazar ambas credenciales almacenadas de forma segura. Un token expirado, revocado, ya rotado o inválido responde `401 UNAUTHENTICATED`.

### Consultar perfil autenticado

`GET /api/auth/me` requiere sesión y responde `200`:

```json
{
  "data": {
    "id": "<uuid>",
    "name": "Alex",
    "surname": "Pérez",
    "email": "alex@example.cl"
  }
}
```

### Actualizar perfil autenticado

`PATCH /api/auth/me` requiere sesión y CSRF en web. Recibe `name` y `email` obligatorios, y `surname` opcional (puede ser `null`). Devuelve `200` con el perfil actualizado. Si el correo ya pertenece a otra cuenta responde `409 EMAIL_ALREADY_REGISTERED`.

### Cerrar sesión

`POST /api/auth/logout` requiere sesión y CSRF en web. Revoca la sesión actual, limpia sus cookies cuando corresponda y responde `204` sin cuerpo. Las solicitudes posteriores con esa credencial responden `401 UNAUTHENTICATED`.

## Registros emocionales

Todas las rutas requieren sesión. `moodId` acepta `muy-bien`, `bien`, `mas-o-menos`, `mal` o `muy-mal`. `emotionIds` requiere entre 1 y 8 valores distintos de `tristeza`, `ansiedad`, `miedo`, `enojo`, `soledad`, `calma`, `esperanza` y `otra`. `note` y `otherEmotion` son opcionales, texto de hasta 500 caracteres. Si se selecciona `otra`, `otherEmotion` debe tener contenido; si no, debe estar vacío.

### Crear

`POST /api/emociones` responde `201` con el registro confirmado por el servidor:

```json
{
  "moodId": "bien",
  "emotionIds": ["calma"],
  "note": "",
  "otherEmotion": ""
}
```

Ejemplo de respuesta:

```json
{
  "data": {
    "id": "<uuid>",
    "moodId": "bien",
    "emotionIds": ["calma"],
    "note": "",
    "otherEmotion": "",
    "date": "28 oct 2026, 12:00",
    "dateTimestamp": 1793199600000
  }
}
```

La fecha se asigna al momento de creación en el servidor.

### Listar con paginación y período

`GET /api/emociones?page=1&pageSize=20&period=month` responde los registros propios, del más reciente al más antiguo, y metadatos de paginación. `page` inicia en 1; `pageSize` va de 1 a 100 y por defecto es 20. `period` es opcional: `week`, `month` o `year`.

```json
{
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### Consultar patrones descriptivos

`GET /api/emociones/patrones?period=month` requiere sesión y devuelve conteos agregados de los registros propios. `period` acepta `week`, `month` o `year` y por defecto es `month`. Semana consulta los últimos siete días, mes desde el primer día del mes actual y año desde el 1 de enero.

La respuesta incluye la cantidad de registros, conteos por estado y emoción, y buckets temporales. En semana los buckets son días; en mes son semanas iniciadas el lunes; en año son meses. `hasTemporalComparison` solo es `true` si hay registros en más de un día. Si no hay datos, los conteos son cero y `buckets` está vacío.

```json
{
  "data": {
    "period": "month",
    "recordCount": 2,
    "moodCounts": {
      "muy-bien": 0,
      "bien": 0,
      "mas-o-menos": 1,
      "mal": 1,
      "muy-mal": 0
    },
    "emotionCounts": {
      "tristeza": 1,
      "ansiedad": 1,
      "miedo": 0,
      "enojo": 0,
      "soledad": 0,
      "calma": 0,
      "esperanza": 0,
      "otra": 0
    },
    "buckets": [
      {
        "startDate": "2026-10-26",
        "recordCount": 2,
        "moodCounts": { "mas-o-menos": 1, "mal": 1 },
        "emotionCounts": { "tristeza": 1, "ansiedad": 1 }
      }
    ],
    "hasTemporalComparison": true
  }
}
```

El resumen no consulta notas ni detalles de «Otra», no compara cuentas y no constituye una evaluación clínica, diagnóstico o predicción. Los parámetros no admitidos responden `400 VALIDATION_ERROR`; la ausencia de sesión responde `401 UNAUTHENTICATED`.

### Consultar, actualizar y eliminar uno

- `GET /api/emociones/:id`: responde `200` con `{ "data": <registro> }`.
- `PUT /api/emociones/:id`: recibe el mismo formato de creación y responde `200` con `{ "data": <registro actualizado> }`.
- `DELETE /api/emociones/:id`: responde `204` sin cuerpo.

El identificador debe ser UUID. Una entidad inexistente o perteneciente a otra cuenta responde `404 NOT_FOUND`, sin revelar su propietario.

## Plan de seguridad

- `GET /api/plan-seguridad` requiere sesión y devuelve `{ "data": { "id", "warningSigns", "copingActions", "safePlaces", "updatedAt" } }`. Si todavía no hay plan, lo inicializa con secciones vacías.
- `PUT /api/plan-seguridad` reemplaza las secciones de forma atómica y responde con el plan guardado.

Ejemplo de cuerpo:

```json
{
  "warningSigns": ["Una señal personal"],
  "copingActions": ["Una acción de afrontamiento"],
  "safePlaces": ["Un lugar seguro"]
}
```

Cada sección es una lista de hasta 100 textos no vacíos, cada uno de hasta 500 caracteres. El orden recibido se conserva. Si la validación o la escritura falla, el plan anterior permanece sin cambios.

## Contactos de confianza

Todas las rutas requieren sesión. La propiedad se determina desde la sesión autenticada.

- `GET /api/contactos?page=1&pageSize=20`: devuelve `{ "data": { "items": [...], "pagination": { "page", "pageSize", "total", "totalPages" } } }`. Los parámetros tienen los mismos límites que el historial.
- `POST /api/contactos`: crea un contacto y responde `201` con `{ "data": <contacto> }`.
- `PUT /api/contactos/:id`: actualiza el contacto propio y responde `204`.
- `DELETE /api/contactos/:id`: elimina el contacto propio y responde `204`.

Cuerpo para crear o actualizar:

```json
{
  "name": "Persona de confianza",
  "phone": "+56912345678",
  "relationship": "Amistad",
  "details": null
}
```

`name` es obligatorio y admite hasta 100 caracteres. `phone` es texto con `+` opcional y entre 7 y 15 dígitos. `relationship` es opcional, admite `null` y hasta 100 caracteres; `details` es opcional, admite `null` y hasta 300 caracteres. Un contacto ajeno o inexistente responde `404 NOT_FOUND`.

## Privacidad y datos personales

Las rutas requieren una sesión válida. La API deriva la identidad de la sesión y nunca acepta un `userId` del cliente. La exportación y eliminación cubren perfil, historial emocional, plan de seguridad, contactos y sesiones actualmente persistidos. Los controles temporales de notificación no se guardan y no aparecen en la exportación; las preferencias y suscripciones de dispositivos se incorporarán cuando se habilite esa capacidad.

### Exportar los datos propios

`GET /api/privacy/export` responde `200` con un JSON privado y encabezados `Cache-Control: private, no-store` y `Content-Disposition` para descargarlo. La respuesta incluye `exportedAt`, `profile`, `emotionalRecords`, `safetyPlan` (puede ser `null`) y `trustedContacts`.

```json
{
  "data": {
    "exportedAt": "2026-10-28T00:00:00.000Z",
    "profile": {
      "id": "<uuid>",
      "name": "Alex",
      "surname": null,
      "email": "alex@example.cl",
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    "emotionalRecords": [
      {
        "id": "<uuid>",
        "mood": "GOOD",
        "emotions": ["CALM"],
        "note": null,
        "otherEmotion": null,
        "recordedAt": "2026-10-28T00:00:00.000Z",
        "createdAt": "2026-10-28T00:00:00.000Z"
      }
    ],
    "safetyPlan": null,
    "trustedContacts": []
  }
}
```

La exportación contiene las notas, plan y datos de contactos propios porque forman parte de los datos solicitados. Nunca incluye hashes de contraseñas, hashes de sesión ni credenciales.

### Eliminar la cuenta

`DELETE /api/privacy/account` exige una confirmación exacta y deliberada. Las solicitudes web requieren además una prueba CSRF válida.

```json
{ "confirmation": "ELIMINAR MI CUENTA" }
```

Una respuesta `204` confirma que se eliminó la cuenta autenticada y, en una transacción, sus sesiones, registros emocionales, plan y contactos. La transacción se revierte ante un error. En web, el backend limpia las cookies de sesión; el cliente nativo debe borrar sus credenciales de Keychain/Keystore tras el `204`. Sin sesión responde `401`; sin confirmación válida responde `400`; un error de persistencia responde `500` y no se debe informar éxito.

Los respaldos SQL están fuera del control de esta API. Una eliminación en los datos activos no purga copias de seguridad existentes; el operador debe definir, documentar y aplicar un período de retención antes de publicar el servicio.

## Salud

- `GET /api/health`: liveness del proceso HTTP; responde `200 { "data": { "status": "ok" } }` sin consultar PostgreSQL.
- `GET /api/ready`: consulta PostgreSQL y responde `200 { "data": { "status": "ready" } }` si está disponible. Si falla la conexión, responde `500 INTERNAL_ERROR` con mensaje genérico, sin credenciales ni detalles de conexión.

## Errores HTTP

| Estado | Código | Significado |
|---|---|---|
| `400` | `VALIDATION_ERROR` | El cuerpo, parámetro o filtro no cumple el esquema. Puede incluir `details` con campos y mensajes de validación. |
| `401` | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` | Sesión ausente, inválida, expirada o credenciales de login incorrectas. |
| `403` | `CSRF_REJECTED` | Origen o prueba CSRF web inválidos/ausentes. |
| `404` | `NOT_FOUND` | Ruta, registro, plan o contacto no encontrado o no perteneciente a la cuenta. |
| `409` | `EMAIL_ALREADY_REGISTERED`, `CONFLICT` | Correo duplicado o conflicto de unicidad. |
| `429` | `RATE_LIMITED` | Se superó el límite de intentos de autenticación. |
| `500` | `INTERNAL_ERROR` | Error interno o dependencia no disponible; no expone detalles sensibles. |

Ejemplo de validación:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los datos ingresados.",
    "details": [
      { "field": "emotionIds", "message": "..." }
    ]
  }
}
```

Las rutas no envuelven errores en `data`. Los cuerpos, notas emocionales, credenciales y detalles de conexión no se incluyen en logs de aplicación.
