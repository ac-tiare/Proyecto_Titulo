# Spec Delta

## Purpose

La capacidad de despliegue Docker permite que el equipo construya, ejecute y compruebe la interfaz web actual de CONTIGO en un entorno reproducible. Solo empaqueta los recursos estáticos existentes y no presupone servicios de servidor o datos que todavía no forman parte del proyecto.

## ADDED Requirements

### Requirement: La aplicación web se ejecuta como un servicio de contenedor
El proyecto MUST proporcionar una imagen reproducible que construya y sirva la aplicación Angular/Ionic existente sin alterar su interfaz, funcionalidades o rutas.

#### Scenario: Construcción de la imagen de producción
- **WHEN** un integrante construye la imagen desde la raíz del repositorio
- **THEN** obtiene una imagen ejecutable que sirve la compilación de producción de CONTIGO por HTTP sin necesitar Node.js en el contenedor de ejecución

#### Scenario: Se conservan las rutas de la aplicación
- **WHEN** una persona abre o recarga directamente una ruta válida de Angular servida por el contenedor
- **THEN** recibe la aplicación CONTIGO y el router puede resolver esa ruta

### Requirement: Compose coordina únicamente los servicios existentes
La configuración Compose MUST levantar los componentes que existen realmente en el proyecto y publicar la interfaz en un puerto local documentado.

#### Scenario: Inicio de los servicios
- **WHEN** un integrante inicia el proyecto mediante Compose
- **THEN** el único servicio necesario actualmente, el frontend web, queda disponible en el puerto publicado y su estado puede comprobarse

#### Scenario: No existe backend ni persistencia configurada
- **WHEN** el proyecto se levanta en su estado actual
- **THEN** la configuración no inicia un backend o una base de datos inexistentes ni declara volúmenes para datos que la aplicación no persiste

### Requirement: La imagen y el contexto de construcción no exponen secretos locales
La configuración Docker MUST excluir archivos de entorno locales y credenciales del contexto de construcción, y MUST NOT incluir secretos dentro de la imagen ni exigir variables secretas para la aplicación actual.

#### Scenario: Construcción sin archivos locales confidenciales
- **WHEN** se construye la imagen en una copia de trabajo que contiene archivos locales ignorables
- **THEN** esos archivos y las dependencias instaladas localmente no se incorporan a la imagen

### Requirement: La ejecución Docker puede ser reproducida por otro integrante
El README MUST documentar prerrequisitos, clonación, construcción, inicio, acceso HTTP, inspección de logs, detención, reinicio y comprobación del servicio.

#### Scenario: Un compañero prepara una copia limpia
- **WHEN** un compañero clona el repositorio y sigue los pasos Docker documentados
- **THEN** puede construir e iniciar CONTIGO y verificar desde el navegador que la aplicación responde
