# home-screen Specification

## Purpose

Inicio ofrece un check-in emocional inmediato, prácticas breves para el trayecto
y accesos a herramientas de apoyo. Explorar reúne ejercicios locales y recursos
oficiales.

## Requirements

### Requirement: La navegación principal contiene cuatro pestañas
La navegación principal MUST mostrar exactamente Inicio, Explorar, Mi Plan y
Bienestar. Mi Plan MUST reunir el plan de seguridad y un resumen accionable de
la Red de Apoyo. Las rutas anteriores de recursos, red de apoyo, plan y avisos
MUST permanecer accesibles.

#### Scenario: La persona navega por las vistas principales
- **WHEN** la aplicación muestra la barra principal
- **THEN** aparecen exactamente las cuatro pestañas y las vistas secundarias siguen disponibles desde enlaces contextuales

### Requirement: Inicio registra el estado emocional en un toque
Inicio MUST mostrar los cinco estados emocionales. Elegir uno MUST registrar el
check-in inmediatamente, sin exigir emociones ni una nota. Las cuentas
autenticadas MUST sincronizarlo con la API cuando haya conexión y las personas
invitadas MUST conservarlo solo en memoria durante la sesión.

#### Scenario: La persona invitada registra su estado
- **WHEN** selecciona uno de los cinco estados en Inicio
- **THEN** el check-in queda disponible en la sesión actual sin crear datos de cuenta

#### Scenario: La cuenta autenticada registra su estado
- **WHEN** selecciona uno de los cinco estados en Inicio con sesión y conexión
- **THEN** la aplicación crea el registro remoto con el estado seleccionado y sin exigir emociones ni nota

#### Scenario: La conexión no está disponible
- **WHEN** la persona registra su estado sin conexión
- **THEN** el check-in permanece disponible durante la sesión y la interfaz comunica que no se sincronizó

### Requirement: Inicio ofrece detalles opcionales y apoyo contextual
Después del check-in, Inicio MUST permitir expandir u ocultar emociones y nota
opcionales. Si el estado seleccionado es Mal o Muy mal, MUST ofrecer una pausa
breve de acceso directo.

#### Scenario: La persona amplía un check-in
- **WHEN** abre «Agregar emociones o nota (opcional)»
- **THEN** puede agregar detalles sin que sean requisito para registrar el estado

#### Scenario: La persona elige un estado de malestar
- **WHEN** selecciona Mal o Muy mal
- **THEN** aparece un acceso directo a una práctica de pausa breve

### Requirement: Inicio propone microprácticas del trayecto
Inicio MUST presentar entre dos y tres prácticas breves con categoría,
duración, indicador pendiente/completada y apertura en un toque. La finalización
MUST durar solo durante la sesión.

#### Scenario: La persona termina una práctica
- **WHEN** cierra una práctica sugerida
- **THEN** Inicio marca esa práctica como completada durante la sesión actual

### Requirement: Explorar ofrece ejercicios y ayuda oficial
Explorar MUST presentar ejercicios visuales disponibles sin conexión y recursos
oficiales claramente distinguidos como enlaces externos.

#### Scenario: La persona abre una práctica sin conexión
- **WHEN** abre un ejercicio local desde Explorar
- **THEN** la guía se muestra sin solicitar datos al backend

#### Scenario: La persona vuelve a la aplicación web sin conexión
- **WHEN** vuelve a abrir la aplicación después de una visita inicial con conexión y de que se hayan precargado las vistas
- **THEN** el service worker sirve las vistas y recursos estáticos de Inicio y Explorar desde caché

### Requirement: La cabecera conserva los accesos globales
Las vistas principales MUST conservar en la cabecera el acceso a Perfil y la
ayuda urgente.

#### Scenario: La persona necesita ayuda desde una pestaña
- **WHEN** se encuentra en cualquiera de las cuatro vistas principales
- **THEN** puede acceder a Perfil y a `/necesito-ayuda` desde la cabecera compartida

### Requirement: La interfaz conserva la identidad visual y es accesible
Las nuevas vistas MUST reutilizar la paleta, tipografía, iconos y tarjetas de
CONTIGO. Los controles MUST ser operables con teclado y tener etiquetas
accesibles; el contenido MUST adaptarse a pantallas móviles estrechas sin
desbordamiento horizontal.

#### Scenario: Se usan Inicio y Explorar en una pantalla móvil
- **WHEN** las vistas se muestran en un dispositivo móvil
- **THEN** sus controles permanecen legibles, táctiles y accesibles sin cambiar la identidad visual de CONTIGO
