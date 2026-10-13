# Proposal

## Why

Inicio ya ofrece una selección rápida del estado emocional, pero el estado solo se mantiene temporalmente y el registro carece de emociones adicionales, nota, fecha y confirmación. Login también presenta «Crear cuenta» como una acción no disponible; completar ambos recorridos permitirá probar el flujo frontend de CONTIGO manteniendo las pantallas dentro de su estilo visual actual.

## What Changes

- Mantener la composición visual de Inicio y usar la emoción elegida allí como selección previa en Registro Emocional, sin crear un registro al navegar.
- Completar Registro Emocional con selección única de estado, emociones de selección múltiple, nota opcional, fecha actual del dispositivo, validaciones y confirmación al guardar.
- Simular el guardado solo en memoria de la sesión; crear el registro únicamente al activar «Guardar registro», sin persistencia ni servicios externos.
- Añadir Crear Cuenta con nombre, correo, contraseña y confirmación de contraseña, validaciones claras, visibilidad de contraseña y navegación de regreso a Login.
- Sustituir el aviso de «Crear cuenta» en Login por navegación a la nueva pantalla.
- Mantener la continuidad visual contextual: Registro Emocional reutilizará la referencia de Inicio; Crear Cuenta reutilizará la de Login. No rediseñar las pantallas existentes salvo los enlaces necesarios.
- No implementar Firebase Authentication, Firestore, backend ni almacenamiento persistente.

## Capabilities

### New Capabilities
- `emotional-entry`: Completar y confirmar un registro emocional con datos temporales, sin persistencia externa.
- `user-registration`: Presentar y validar el formulario de creación de cuenta de demostración y su navegación con Login.

### Modified Capabilities
- `home-screen`: Al elegir un estado, Inicio lo preselecciona en Registro Emocional sin guardar un registro.

## Impact

- Afecta las páginas, estilos, rutas y pruebas de Inicio, Registro Emocional y Login; añade la pantalla Crear Cuenta y sus pruebas.
- Reutiliza el estado emocional en memoria existente y componentes de Ionic, sin dependencias nuevas.
- La confirmación de guardado y el alta de cuenta son demostraciones locales; no se transmiten ni se conservan datos personales después de la sesión.
