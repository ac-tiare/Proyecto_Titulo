# Design

## Context

Véase [proposal.md](./proposal.md) para el motivo y alcance. El repositorio produce una aplicación Angular standalone con Ionic y TypeScript; `ng build` genera los recursos web en `www/`, y `capacitor.config.ts` también declara esa carpeta como `webDir`. El README ya especifica Node.js 24 LTS para desarrollo. No se encontraron archivos Docker existentes, variables `.env`, llamadas HTTP de backend, API, Firebase ni almacenamiento persistente.

La nueva capacidad contractual está definida en [spec](./specs/docker-deployment/spec.md). El shell Angular usa rutas cliente, por lo que el servidor estático debe resolver rutas desconocidas de archivos a `index.html` para que la aplicación maneje deep links y recargas.

## Goals / Non-Goals

**Goals:**

- Entregar una imagen pequeña de producción, reproducible y basada en versiones explícitas compatibles con el proyecto.
- Ejecutar solo el servicio web que existe hoy; publicar HTTP en el host y servir rutas cliente correctamente.
- Facilitar la puesta en marcha y comprobación por parte de un integrante con una copia limpia del repositorio.
- Evitar que secretos locales, dependencias descargadas o archivos de build se incluyan en el contexto Docker.

**Non-Goals:**

- Añadir login real, backend, API, base de datos, almacenamiento persistente o notificaciones.
- Contenerizar un servidor de desarrollo con hot reload como vía de entrega; Docker servirá una compilación de producción.
- Modificar el código, diseño o navegación Angular por motivos ajenos a la configuración del servidor estático.

## Decisions

- **Una imagen multi-stage, un servicio Compose.** La etapa de build usa Node.js 24 LTS y `npm ci` para instalar desde el lockfile y compilar Angular; la etapa final copia solo `www/` a una imagen oficial de Nginx con etiqueta estable y versión explícita. Se evita ejecutar `ng serve` en producción y se mantiene fuera del contenedor final Node, npm y `node_modules`. Alternativa descartada: imagen única de Node con servidor de desarrollo, que expone herramientas de build y no refleja la forma de despliegue web.
- **Nginx con fallback al documento de entrada.** La configuración sirve los archivos existentes y dirige rutas cliente sin archivo físico a `index.html`, conservando el router actual al entrar directamente o refrescar una URL. Los recursos reales deben seguir respondiéndose con sus códigos HTTP correspondientes; no se debe reemplazar indiscriminadamente cualquier error por el HTML.
- **Compose describe solo el frontend.** Un servicio construye la imagen local y publica el puerto HTTP 80 del contenedor en un puerto host documentado, con valor predeterminado 8080. No se declaran `depends_on`, almacenamiento persistente ni red inter-servicio, pues no existen dependencias de runtime. Compose conserva su red de proyecto predeterminada. Un healthcheck debe verificar la respuesta HTTP del servidor sin introducir herramientas innecesarias en la imagen.
- **Etiquetas estables, no `latest`.** Usar Node 24 LTS coherente con el README y seleccionar una etiqueta explícita de versión estable de Nginx disponible y compatible al implementar; verificar la construcción en Docker antes de dar por válida la selección. No fijar una etiqueta `latest` ni una versión especulativa.
- **No crear configuración de entorno innecesaria.** Los archivos `environment.ts` existentes solo marcan el modo Angular y no contienen endpoints ni credenciales. Compose no requiere secretos en el estado actual. `.dockerignore` debe excluir `.git`, `node_modules`, `.angular`, `www`, cobertura y archivos `.env*` locales sin excluir manifests o `src/`.
- **Comandos simples y portables en README.** Documentar Docker Engine/Desktop con Compose, `docker compose up --build -d`, acceso a `http://localhost:8080`, `logs`, `ps`, `down`, y arranque posterior sin rebuild; documentar cómo cambiar el puerto host si está ocupado y los mismos pasos desde clonación limpia.

## Risks / Trade-offs

- [La etiqueta de Nginx debe seguir siendo mantenida y compatible al momento de implementar] → Elegir y probar una versión oficial estable explícita; no usar `latest` y registrar la versión elegida en el Dockerfile.
- [Angular puede añadir recursos compilados con rutas base incorrectas en un futuro cambio] → Probar rutas actuales directamente contra el contenedor y comprobar los assets de la compilación.
- [El puerto host predeterminado podría estar ocupado] → Documentar el cambio del puerto de publicación sin alterar el puerto interno Nginx.
- [La máquina puede no tener Docker Engine instalado o iniciado] → Comprobar `docker version` y `docker compose version` antes de la verificación de imagen; si falta Docker, informar el bloqueo y no afirmar que la ejecución en contenedor fue validada.
- [El frontend actual no persiste datos] → No crear volúmenes para información que no existe; revisar esta decisión si se añade almacenamiento en una tarea futura.

## Migration Plan

1. Añadir Dockerfile multi-stage, configuración Nginx, `.dockerignore` y `compose.yaml`.
2. Construir la imagen y levantar el único servicio; comprobar healthcheck, página inicial y una ruta interna mediante HTTP.
3. Actualizar y revisar las instrucciones del README con comandos equivalentes para clonar, construir, iniciar, ver logs y detener.
4. Si el build o la verificación HTTP falla, detener los contenedores nuevos, corregir el Dockerfile/configuración y repetir la validación. El rollback consiste en retirar los archivos Docker agregados y restaurar el README; no requiere migrar datos ni alterar código Angular.
