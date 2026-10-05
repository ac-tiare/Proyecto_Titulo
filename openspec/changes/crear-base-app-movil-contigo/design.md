# Design

## Context

Consulta [proposal.md](./proposal.md) para la motivación y el alcance. El repositorio actualmente solo contiene el README y la configuración de OpenSpec; no hay código de aplicación ni especificaciones existentes. La configuración del proyecto solicita artefactos en español. La arquitectura debe arrancar sin servicios de backend y permitir incorporar integraciones futuras sin incluirlas ahora.

## Goals / Non-Goals

**Goals:**
- Crear una base Ionic + Angular + TypeScript con Capacitor y organización por áreas funcionales.
- Mantener las pantallas y la navegación utilizables sin autenticación, backend ni conexión a servicios remotos.
- Hacer evidente cuándo el contenido o los datos son solo demostrativos.
- Tratar el acceso a ayuda con cuidado: no inventar recursos oficiales ni representar la aplicación como atención clínica o de emergencia.

**Non-Goals:**
- Integrar Firebase, autenticación, persistencia remota, notificaciones push o Chart.js.
- Publicar la aplicación en tiendas, conectar sistemas de Metro o implementar llamadas automáticas a servicios.
- Diagnosticar, puntuar o predecir el riesgo emocional o suicida.

## Decisions

1. **Usar el punto de partida oficial de Ionic para Angular con Capacitor.** Mantiene el stack solicitado y evita reemplazar componentes móviles de Ionic por controles web propios. Se elegirá una plantilla mínima; una plantilla visual con navegación y pantallas predeterminadas podría introducir comportamientos y dependencias innecesarios.
2. **Organizar el código por responsabilidades, con límites ligeros.** Separar la aplicación compartida, la navegación y las áreas de Inicio, bienestar y apoyo en módulos/carpetas fáciles de localizar. Evitar crear abstracciones de repositorios o capas de backend sin una fuente de datos real.
3. **Usar navegación declarativa de Angular e Ionic.** Configurar rutas para cada pantalla y navegación inferior para los destinos principales; Inicio y accesos secundarios ofrecerán entrada a Registro emocional, Necesito ayuda, Información y recursos, y Perfil. La selección final de pestañas no debe ocultar el acceso visible a ayuda.
4. **Mantener los ejemplos locales y explícitamente temporales.** El contenido estático de demostración se separará de la interfaz y se identificará como ejemplo. La selección emocional, los contactos y el plan no se guardarán ni se enviarán a red; no se añadirán servicios vacíos que simulen persistencia.
5. **No publicar recursos de crisis sin verificación.** Antes de incluir teléfonos o servicios concretos para Chile, verificar su vigencia y procedencia oficial. Si esa verificación no está disponible durante la implementación, usar una presentación neutral sin inventar contactos, y dejar claro que la pantalla no sustituye atención profesional.
6. **Mantener las dependencias de la base Ionic.** Añadir solo las dependencias necesarias para Angular, Ionic y Capacitor; posponer Firebase y Chart.js hasta un cambio que los requiera.

## Risks / Trade-offs

- [El contenido de demostración puede confundirse con información personal] → Identificarlo junto al contenido y no describirlo como guardado o real.
- [Una pantalla de ayuda sin recursos locales verificados puede resultar incompleta] → Verificar fuentes oficiales antes de presentar contactos y evitar inventar teléfonos o prometer disponibilidad.
- [El número de pantallas puede sobredimensionar la navegación inicial] → Mantener destinos principales en la navegación inferior y ofrecer accesos secundarios desde Inicio o rutas claras.
- [La configuración local de Capacitor no equivale a validar una compilación nativa] → Verificar compilación web en este cambio y dejar la ejecución en dispositivos para cuando se configuren sus toolchains.

## Migration Plan

1. Crear la aplicación Ionic Angular en la raíz del repositorio preservando README, OpenSpec y la configuración de Git existente.
2. Implementar rutas, navegación y pantallas con contenido local demostrativo.
3. Instalar dependencias declaradas y verificar la compilación y pruebas disponibles.
4. No hay migración de datos ni despliegue: no existe aplicación previa ni almacenamiento real. Los artefactos se incorporarán al historial normal de Git cuando se revisen y publiquen.
