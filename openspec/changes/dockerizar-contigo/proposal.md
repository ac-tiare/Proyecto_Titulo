# Proposal

## Why

CONTIGO hoy se ejecuta como una aplicación Angular/Ionic desde Node.js, pero no ofrece una forma reproducible de construirla y servirla mediante Docker para la entrega Capstone. La configuración debe permitir que el equipo y un compañero levanten la misma interfaz con comandos simples, sin incorporar un backend o una base de datos que el proyecto aún no utiliza.

## What Changes

- Añadir una imagen multi-stage para compilar Angular con Node.js 24 LTS y servir los archivos estáticos con una versión estable explícita de Nginx.
- Añadir configuración Compose para el único servicio frontend, publicado en un puerto local documentado, con comprobación de salud y sin secretos ni persistencia de datos ficticia.
- Configurar el servidor para que las rutas de Angular funcionen al abrirlas directamente o recargar el navegador.
- Añadir exclusiones Docker para evitar copiar dependencias, artefactos de compilación, secretos locales y metadatos innecesarios al contexto de build.
- Actualizar el README con prerrequisitos, comandos de build/ejecución, acceso desde navegador, logs, detención/reinicio y pasos de clonación para otro integrante.
- Verificar la compilación de la imagen, el estado del servicio y una respuesta HTTP de la aplicación dentro del contenedor.

## Capabilities

### New Capabilities
- `docker-deployment`: construir, ejecutar y comprobar la aplicación frontend CONTIGO como un servicio de contenedor reproducible.

### Modified Capabilities

## Impact

- Añade Dockerfile, `compose.yaml`, configuración de Nginx y `.dockerignore`, y actualiza `README.md`.
- Usa únicamente el frontend estático ya producido por Angular en `www`; no añade API, backend, base de datos, red interna entre servicios, volúmenes persistentes ni variables sensibles.
- Conserva el código, las rutas, el diseño y las interacciones actuales de Ionic/Angular.
- La verificación del entorno Docker depende de que Docker Engine/Desktop esté disponible en la máquina durante la implementación.
