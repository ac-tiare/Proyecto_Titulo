import { Prisma, PrismaClient, ResourceCategory } from '@prisma/client';

const prisma = new PrismaClient();

const resources = [
  {
    id: 'respiracion',
    category: ResourceCategory.WELLBEING,
    title: 'Haz una pausa y respira a tu ritmo',
    summary: 'Un ejercicio breve para volver la atención al momento presente.',
    content: [
      'Si te resulta cómodo, apoya los pies y nota cómo se siente tu cuerpo. No necesitas cambiar tu respiración ni hacerlo de una forma perfecta.',
      'Puedes inhalar suavemente y dejar salir el aire sin apuro. Repite unas veces, o detente si este ejercicio no te hace sentir bien.',
      'También puedes elegir otra acción sencilla: mirar a tu alrededor, tomar agua o acercarte a alguien de confianza.',
    ] satisfies Prisma.InputJsonArray,
    links: [] satisfies Prisma.InputJsonArray,
    imageUrl: null,
  },
  {
    id: 'descanso',
    category: ResourceCategory.SELF_CARE,
    title: 'Cuidar el descanso también cuenta',
    summary: 'Ideas pequeñas para darte un momento de recuperación.',
    content: [
      'Si está a tu alcance, elige una pausa breve y un lugar donde te sientas con más tranquilidad.',
      'Puedes bajar estímulos, estirarte suavemente o hacer algo cotidiano que te resulte reconfortante. No hay una única manera correcta de cuidarte.',
      'Si el malestar persiste o te dificulta tus actividades, considera pedir apoyo a alguien de confianza o a un profesional.',
    ] satisfies Prisma.InputJsonArray,
    links: [] satisfies Prisma.InputJsonArray,
    imageUrl: null,
  },
  {
    id: 'senales',
    category: ResourceCategory.WARNING_SIGNS,
    title: 'Observa cambios que te preocupan',
    summary:
      'Una señal aislada no es un diagnóstico; los cambios sostenidos merecen atención.',
    content: [
      'Presta atención si notas cambios persistentes en el ánimo, el sueño, la energía, el interés por actividades o el vínculo con otras personas.',
      'También importa cómo lo vive la persona. Escucha sin juzgar y pregunta qué tipo de apoyo le serviría.',
      'Si existe riesgo inmediato para su seguridad, acompáñala y busca ayuda urgente. No es necesario esperar a tener una explicación completa para pedir orientación.',
    ] satisfies Prisma.InputJsonArray,
    links: [] satisfies Prisma.InputJsonArray,
    imageUrl: null,
  },
  {
    id: 'conversacion',
    category: ResourceCategory.WARNING_SIGNS,
    title: 'Acércate con una pregunta sencilla',
    summary:
      'Una conversación respetuosa puede ayudar a que alguien no enfrente el malestar en soledad.',
    content: [
      'Busca un momento tranquilo y pregunta con claridad cómo se ha sentido. Escucha con calma y evita minimizar lo que te cuenta.',
      'Puedes decir: “Me importa cómo estás. ¿Quieres que te acompañe o busquemos apoyo juntos?”.',
      'Si no sabes qué hacer, pide orientación a un servicio de salud o a otra persona adulta de confianza.',
    ] satisfies Prisma.InputJsonArray,
    links: [] satisfies Prisma.InputJsonArray,
    imageUrl: null,
  },
  {
    id: 'pedir-ayuda',
    category: ResourceCategory.HELP_AND_PREVENTION,
    title: 'Pedir apoyo es un paso válido',
    summary: 'No tienes que resolver todo antes de hablar con alguien.',
    content: [
      'Puedes empezar con una frase corta: “No me he sentido bien y necesito compañía”. También puedes escribirlo si te cuesta decirlo en voz alta.',
      'Cuenta qué está pasando, qué te preocupa y qué te ayudaría ahora. Está bien pedir que la otra persona te escuche o te acompañe a buscar orientación.',
      'Buscar apoyo no es una señal de debilidad. Si la primera persona no está disponible, intenta con otra persona o un servicio de ayuda.',
    ] satisfies Prisma.InputJsonArray,
    links: [] satisfies Prisma.InputJsonArray,
    imageUrl: null,
  },
  {
    id: 'red-apoyo',
    category: ResourceCategory.HELP_AND_PREVENTION,
    title: 'Prepara una red de apoyo',
    summary: 'Identifica personas y lugares a los que puedas recurrir.',
    content: [
      'Piensa en una o más personas con quienes te sientas en confianza, y acuerda cómo contactarlas cuando necesites compañía.',
      'Puedes anotar profesionales, centros de salud o servicios públicos de tu zona. Verifica sus horarios y formas de atención directamente.',
      'Si una persona no responde, intenta con otra opción de tu lista. Si hay peligro inmediato, busca atención de urgencia.',
    ] satisfies Prisma.InputJsonArray,
    links: [] satisfies Prisma.InputJsonArray,
    imageUrl: null,
  },
  {
    id: 'canales-chile',
    category: ResourceCategory.HELP_AND_PREVENTION,
    title: 'Canales de orientación en Chile',
    summary:
      'Servicios públicos y organizaciones para pedir información o apoyo.',
    content: [
      'Línea *4141 “No estás solo, no estás sola”: orientación telefónica de prevención del suicidio. Si estás en una situación de riesgo inmediato, busca también atención de urgencia y procura no quedarte sin compañía.',
      'Salud Responde entrega orientación en salud por teléfono. Confirma la disponibilidad y el tipo de atención en su sitio oficial.',
      'SENDA orienta sobre consumo de alcohol y otras drogas, para ti o para acompañar a otra persona. Su sitio informa el horario del teléfono y del chat.',
      'Las organizaciones sociales pueden ofrecer apoyo comunitario y recursos especializados. Revisa directamente su alcance, horarios y condiciones de atención.',
    ] satisfies Prisma.InputJsonArray,
    links: [
      { label: 'Llamar al *4141', url: 'tel:*4141' },
      { label: 'Salud Responde · 600 360 7777', url: 'tel:6003607777' },
      { label: 'SENDA · Fono Drogas y Alcohol 1412', url: 'tel:1412' },
      {
        label: 'Sitio de Salud Responde (MINSAL)',
        url: 'https://web.minsal.cl/salud-responde/',
      },
      {
        label: 'Orientación de SENDA',
        url: 'https://www.senda.gob.cl/orientacion/',
      },
      { label: 'Fundación Todo Mejora', url: 'https://todomejora.org/' },
      {
        label: 'Fundación Míranos',
        url: 'https://www.fundacionmiranos.org/',
      },
    ] satisfies Prisma.InputJsonArray,
    imageUrl: null,
  },
] satisfies Array<{
  id: string;
  category: ResourceCategory;
  title: string;
  summary: string;
  content: Prisma.InputJsonArray;
  links: Prisma.InputJsonArray;
  imageUrl: string | null;
}>;

try {
  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { id: resource.id },
      create: resource,
      update: {},
    });
  }
} finally {
  await prisma.$disconnect();
}
