# Tasks

## 1. Estado temporal y acceso desde Inicio

- [x] 1.1 Extender el flujo del borrador para que elegir una emoción en Inicio solo precargue Registro Emocional y no cree registros; verificar con pruebas que se conserva la selección, se puede sustituir y no se guarda al navegar.

## 2. Formulario de Registro Emocional

- [x] 2.1 Completar la pantalla con selector único de estado, selección múltiple de las ocho emociones, nota opcional y fecha local actual, manteniendo el estilo de Inicio; verificar contenido, marcado accesible y presentación móvil.
- [x] 2.2 Implementar validación, creación temporal solo al guardar y confirmación sin duplicar envíos; probar estado/emociones faltantes, nota vacía, confirmación válida y abandono sin guardado.

## 3. Crear Cuenta y navegación desde Login

- [x] 3.1 Añadir la ruta y pantalla Crear Cuenta con campos requeridos, formato de correo, coincidencia de contraseñas, mensajes de error y controles para mostrar/ocultar, manteniendo el diseño de Login; verificar el render y la adaptación con teclado en pantallas móviles.
- [x] 3.2 Cambiar «Crear cuenta» en Login a navegación y ofrecer desde Crear Cuenta el retorno a Login; verificar ambos destinos, validaciones y confirmación de demostración sin persistir datos.

## 4. Verificación integrada y documentación

- [x] 4.1 Actualizar el README para describir el flujo de registro emocional y Crear Cuenta como demostraciones sin persistencia; verificar que no prometa autenticación ni almacenamiento real.
- [x] 4.2 Ejecutar pruebas completas, lint y compilación de producción; comprobar el flujo Login → Crear cuenta → Login → Inicio → Registro Emocional → confirmación y confirmar que Login e Inicio conservan su apariencia actual.
