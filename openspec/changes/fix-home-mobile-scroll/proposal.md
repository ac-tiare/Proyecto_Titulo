# Proposal

## Why

En la pantalla Inicio sigue siendo posible que el contenido inferior quede inaccesible al usar la vista móvil del navegador, pese a que `ion-content` declara el desplazamiento habilitado y existe una solución adicional basada en eventos de mouse. La causa debe localizarse en el contenedor y la cadena real de alturas/eventos del shell Ionic antes de cambiar estilos, para que el arreglo funcione de forma verificable y no dependa de una corrección superficial.

## What Changes

- Diagnosticar el flujo de layout de `ion-app`, el shell de pestañas, `ion-router-outlet`, la cabecera, `ion-content` y la barra inferior en anchos y alturas móviles y de escritorio; registrar dimensiones, overflow, propietario del scroll y eventos recibidos.
- Corregir el contenedor responsable para que exista una sola zona central desplazable, con altura limitada al espacio entre la cabecera y la barra inferior. Ajustar `min-height: 0` en los ancestros flex/grid que lo necesiten y evitar bloquear el scroll mediante overflow o alturas incorrectas.
- Mantener visibles en sus posiciones actuales el encabezado y la navegación inferior; añadir al contenido el espacio final necesario, incluidos los insets seguros, para que la última sección no quede tapada.
- Revisar y conservar el desplazamiento por rueda, barra de scroll, gesto táctil y arrastre con mouse en vista móvil. Evitar áreas de scroll anidadas y retirar o adaptar la lógica de arrastre solo si el diagnóstico demuestra que interfiere con el desplazamiento único.
- Verificar el ajuste tras cambiar tamaño y al navegar entre Inicio, Mi bienestar, Plan y Red de apoyo, sin rediseñar ni eliminar contenido.

## Capabilities

### New Capabilities

### Modified Capabilities
- `home-screen`: garantizar desplazamiento vertical completo en Inicio con el encabezado y la barra inferior fijos, contenido final visible, compatibilidad con modalidades de entrada y diseño móvil accesible.

## Impact

- Afecta a los estilos y la plantilla de Inicio, el shell compartido de `MainTabsComponent` y las pruebas de layout/navegación relacionadas.
- No requiere dependencias nuevas ni cambios de backend.
- Los estilos globales de Ionic fijan `body` y ocultan su overflow como parte del shell de la aplicación; el diagnóstico debe distinguir ese comportamiento del scroll interno esperado y no modificarlo salvo que se demuestre que bloquea el gesto.
- La verificación cubrirá wheel, scrollbar, arrastre con mouse a ancho móvil y emulación táctil, además de tamaños de ventana y navegación por las pestañas existentes.
