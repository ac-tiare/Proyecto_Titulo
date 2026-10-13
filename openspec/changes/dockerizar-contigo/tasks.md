# Tasks

## 1. Configuración de la imagen y Compose

- [x] 1.1 Crear un Dockerfile multi-stage con Node.js 24 LTS para instalar con `npm ci` y compilar producción, y una etapa Nginx con una etiqueta oficial estable explícita (no `latest`) que copie únicamente `www/`; añadir configuración Nginx para rutas de Angular y `.dockerignore` para dependencias, builds previos, `.git` y archivos `.env*`; verificar con `docker build` que la imagen se construye y contiene los archivos web esperados.
- [x] 1.2 Crear `compose.yaml` con solo el servicio frontend, publicación host configurable con valor predeterminado 8080, healthcheck HTTP y sin secretos, volúmenes de datos o dependencias inexistentes; verificar la sintaxis e interpolación del puerto con `docker compose config`.

## 2. Instrucciones para el equipo

- [x] 2.1 Actualizar README con requisitos de Docker Engine/Desktop y Compose, clonación en una copia nueva, build e inicio, URL del navegador, comprobación, logs, parada, reinicio y cambio del puerto si está ocupado; verificar que los comandos documentados coinciden con `compose.yaml` y ejecutarlos en la copia actual cuando Docker esté disponible.

## 3. Validación integrada

- [x] 3.1 Comprobar disponibilidad con `docker version` y `docker compose version`; construir e iniciar con los comandos del README, verificar `docker compose ps` y el healthcheck, pedir por HTTP Inicio y una ruta Angular profunda directamente, recargarla en navegador y comprobar que la interfaz y navegación se mantienen.
- [x] 3.2 Revisar los logs, detener y volver a levantar el servicio según el README; confirmar que solo se ejecuta el frontend, que la imagen final no requiere Node.js ni secretos y que no se declara persistencia de datos inexistentes; si Docker no está instalado o disponible, registrar el bloqueo y dejar explícito que la ejecución en contenedor no quedó validada.
