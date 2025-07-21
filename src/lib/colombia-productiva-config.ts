export const COLOMBIA_PRODUCTIVA_CONFIG = {
  ORGANIZATION: 'Colombia Productiva',
  PARTNER: 'Universidad Nacional de Colombia',
  COURSE_NAME: 'Gestión de la Sostenibilidad en la empresa',
  START_DATE: 'Junio 2025',
  REGISTRATION_LINK: 'https://bit.ly/cursofabricas',
  CONTACTS: {
    KAREN: 'karen.mendez@colombiaproductiva.com',
    ANDREA: 'andiazce@unal.edu.co'
  },
  COURSE_DETAILS: {
    DURATION: '19 horas de formación',
    MODALITY: 'Virtual (sincrónico y asincrónico)',
    SCHEDULE: 'Martes y jueves 7:00-9:00 AM o 5:00-7:00 PM',
    COST: 'Completamente gratuito',
    PENALTY: '$300.000 si no completa el curso',
    SESSIONS: '7 sesiones (2 sesiones por semana)',
    TOPICS: [
      'Nociones y pilares de la sostenibilidad en el sector productivo',
      'Agenda de desarrollo sostenible ODS y su conexión con el sector productivo',
      'Tendencias, prácticas y experiencias de sostenibilidad',
      'Crisis climática',
      'Estrategia de economía circular'
    ]
  }
};

export const getOfficialMessage = (): string => {
  return `Buenas Tardes, estimados Extensionistas de Fabricas de Productividad!

Desde ${COLOMBIA_PRODUCTIVA_CONFIG.ORGANIZATION} en Alianza con la ${COLOMBIA_PRODUCTIVA_CONFIG.PARTNER}, los invitamos a participar en el curso virtual gratuito en ${COLOMBIA_PRODUCTIVA_CONFIG.COURSE_NAME}. El cual estará iniciado en el mes de ${COLOMBIA_PRODUCTIVA_CONFIG.START_DATE}.

Si estás interesado(a), puedes inscribirte en este link
${COLOMBIA_PRODUCTIVA_CONFIG.REGISTRATION_LINK}

Para mayor información contactar: ${COLOMBIA_PRODUCTIVA_CONFIG.CONTACTS.KAREN}; ${COLOMBIA_PRODUCTIVA_CONFIG.CONTACTS.ANDREA}`;
};

export const getCourseInfo = () => {
  return {
    ...COLOMBIA_PRODUCTIVA_CONFIG.COURSE_DETAILS,
    contactEmails: Object.values(COLOMBIA_PRODUCTIVA_CONFIG.CONTACTS)
  };
};

// Google Sheets Configuration
export const GOOGLE_SHEETS_CONFIG = {
  // URL por defecto del Google Sheet publicado
  defaultSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTijCKZ6riWFEAQXdlHdiM4ElGYmskwigWIbM68wgpOzEzoUwwk7553wQDl7WWCE33xFhmcwiPcYzIQ/pubhtml?gid=0&single=true',
}; 