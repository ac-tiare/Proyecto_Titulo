# Tasks

## 1. Diagnóstico reproducible

- [x] 1.1 Reproducir el fallo antes de editar y registrar en 320×568, 375×667 y escritorio las alturas/bounds, overflow, posición y min-height de ion-app, MainTabsComponent, ion-tabs, ion-router-outlet, ion-header, ion-tab-bar, ion-content y su scroller; trazar eventos wheel, pointer y touch para identificar el nodo exacto que limita o intercepta el scroll, y confirmar si body/html usan solo el bloqueo estándar de Ionic.

## 2. Corrección del contenedor

- [x] 2.1 Corregir únicamente los ancestros y la zona de contenido que el diagnóstico identifique: dejar un solo propietario del scroll vertical con altura disponible entre encabezado y barra inferior, mantener ambas barras visibles y reservar padding inferior/safe-area para la última tarjeta; retirar o adaptar el arrastre manual de mouse si interfiere, y comprobar con pruebas enfocadas que el scroll llega al final sin overflow horizontal ni scroll anidado.

## 3. Verificación integrada

- [ ] 3.1 Validar en navegador a 320×568, 375×667 y escritorio el recorrido completo de Inicio con rueda, scrollbar, arrastre con mouse en ancho móvil y gesto táctil/emulado cuando lo soporte el entorno; confirmar que la última tarjeta queda por encima de la barra inferior, el header y tabs permanecen fijos, hay una sola zona vertical y los controles siguen activándose.
- [x] 3.2 Cambiar tamaños de ventana y navegar entre Inicio, Mi bienestar, Plan y Red de apoyo; confirmar que cada ruta conserva su scroll y diseño, y ejecutar la suite de pruebas, lint y build de producción.
