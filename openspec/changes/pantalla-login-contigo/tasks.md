# Tasks

## 1. Ruta inicial y flujo de demostración

- [x] 1.1 Añadir Login como página independiente del shell, redirigir la ruta raíz a Login y conservar `/inicio`; verificar con pruebas de rutas que la entrada muestra Login y que las rutas existentes continúan disponibles.
- [x] 1.2 Conectar «Iniciar sesión» con `/inicio` sin validar ni persistir los campos; verificar mediante pruebas que la navegación ocurre con campos vacíos o llenos y no anuncia autenticación real.

## 2. Interfaz del Login

- [x] 2.1 Crear la interfaz Ionic con bienvenida, marca CONTIGO, campos etiquetados de correo y contraseña, selector de visibilidad, ayuda de validación visual y nota explícita de modo demostración; verificar los textos, etiquetas, tipo inicial password y alternancia accesible con pruebas del componente.
- [x] 2.2 Aplicar estilos encapsulados en azul suave, celeste, menta, beige y azul oscuro, con controles táctiles y foco perceptible; verificar visualmente en 320 px y alturas reducidas que no haya desplazamiento horizontal y que el formulario pueda desplazarse junto al teclado.
- [x] 2.3 Implementar avisos locales para «¿Olvidaste tu contraseña?» y «Crear cuenta» sin navegación ni servicios reales; verificar que cada acción muestra que aún no está disponible y permanece en Login.

## 3. Verificación integrada

- [x] 3.1 Ejecutar las pruebas, el lint y la compilación de producción; comprobar que no se modificó el shell, el tema global ni las pantallas existentes y que el flujo visual de Login funciona de extremo a extremo.
