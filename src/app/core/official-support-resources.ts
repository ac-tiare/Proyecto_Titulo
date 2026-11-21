export type OfficialSupportResource =
  | {
      id: string;
      title: string;
      description: string;
      availability: string;
      actionLabel: string;
      href: `tel:${string}`;
      officialUrl?: string;
      officialLabel?: string;
      type: 'phone';
    }
  | {
      id: string;
      title: string;
      description: string;
      availability: string;
      actionLabel: string;
      href: `https://${string}`;
      type: 'website';
    };

export const officialSupportResources: readonly OfficialSupportResource[] = [
  {
    id: 'suicide-prevention',
    title: 'Línea de Prevención del Suicidio · MINSAL',
    description:
      'Atención gratuita, confidencial y 24/7 por psicólogos especialistas.',
    availability: 'Gratis · 24/7',
    actionLabel: 'Llamar al *4141',
    href: 'tel:*4141',
    officialUrl: 'https://www.gob.cl/saludablemente/',
    officialLabel: 'Información oficial',
    type: 'phone',
  },
  {
    id: 'salud-responde',
    title: 'Salud Responde · MINSAL',
    description:
      'Orientación profesional en salud y apoyo en crisis emocionales. Opción 2 para salud mental.',
    availability: 'Atención telefónica · 24/7',
    actionLabel: 'Llamar 600 360 7777',
    href: 'tel:6003607777',
    officialUrl: 'https://saludresponde.minsal.cl/',
    officialLabel: 'Información oficial',
    type: 'phone',
  },
  {
    id: 'metro-emergencies',
    title: 'Emergencias en Metro de Santiago',
    description:
      'Canal gratuito para situaciones de seguridad y emergencia, con contención y activación de protocolos.',
    availability: 'Gratis · Emergencias Metro',
    actionLabel: 'Llamar al 1411',
    href: 'tel:1411',
    officialUrl: 'https://www.metro.cl/atencion-cliente/canales-de-contacto',
    officialLabel: 'Canales oficiales de Metro',
    type: 'phone',
  },
  {
    id: 'senda-1412',
    title: 'Fono Drogas y Alcohol · SENDA',
    description:
      'Orientación y apoyo telefónico gratuito y anónimo 24/7. El chat atiende todos los días de 08:00 a 20:00.',
    availability: 'Gratis · 24/7',
    actionLabel: 'Llamar al 1412',
    href: 'tel:1412',
    officialUrl: 'https://www.senda.gob.cl/orientacion/',
    officialLabel: 'Orientación oficial',
    type: 'phone',
  },
  {
    id: 'hora-segura',
    title: 'Fundación Todo Mejora · Hora Segura',
    description:
      'Apoyo gratuito y confidencial para niños, niñas, adolescentes y jóvenes LGBTIQA+.',
    availability: 'Chat · Todos los días 18:00–00:00',
    actionLabel: 'Abrir Hora Segura',
    href: 'https://todomejora.org/hora-segura/',
    type: 'website',
  },
  {
    id: 'fono-mayor',
    title: 'Fono Mayor · MINSAL',
    description:
      'Orientación de especialistas en temáticas relacionadas con personas mayores.',
    availability: 'Orientación especializada',
    actionLabel: 'Llamar 800 400 035',
    href: 'tel:800400035',
    officialUrl: 'https://www.gob.cl/saludablemente/ayudaprofesionales',
    officialLabel: 'Información oficial',
    type: 'phone',
  },
  {
    id: 'samu-131',
    title: 'Emergencia médica · SAMU',
    description: 'Llama ante una urgencia médica grave o riesgo físico inmediato.',
    availability: 'Emergencias · 24/7',
    actionLabel: 'Llamar al 131',
    href: 'tel:131',
    type: 'phone',
  },
];
