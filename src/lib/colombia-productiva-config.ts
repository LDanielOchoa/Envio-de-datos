export const COLOMBIA_PRODUCTIVA_CONFIG = {
  ORGANIZATION: 'Colombia Productiva- Ministerio de comercio industria y turismos',
  PARTNER: 'Universidad Nacional de Colombia',
  COURSE_NAME: 'Gestión de la Sostenibilidad en la empresa',
  START_DATE: 'Agosto 2025',
  REGISTRATION_LINK: 'https://bit.ly/cursofabricas',
  CONTACTS: {
    KAREN: 'karen.mendez@colombiaproductiva.com',
    ANDREA: 'licamargod@unal.edu.co'
  },
  COURSE_DETAILS: {
    DURATION: '19 horas de formación, 4 horas asincrónicas (tiempo autónomo de estudio del estudiante) y 15 horas virtuales sincrónicas o en línea',
    MODALITY: 'Virtual, dirigido por la Universidad Nacional de Colombia',
    SCHEDULE: 'Martes y jueves de 7:00 am a 9:00 am o de 5:00 pm a 7:00 pm, así como los días miércoles y viernes en los mismos horarios',
    COST: 'Completamente gratuito, no tendrá costo solo para aquellos estudiantes que finalicen el curso',
    PENALTY: 'En caso de iniciar y no finalizar el curso habrá una penalidad de $300.000',
    SESSIONS: '7 sesiones (2 sesiones a la semana, cada una de 2 horas) que se desarrollan aproximadamente en un mes',
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
  return `Buenas Tardes, Bienvenidos a la preinscripción de "Curso de Gestión de Sostenibilidad de la empresa". Desde ${COLOMBIA_PRODUCTIVA_CONFIG.ORGANIZATION} en Alianza con la ${COLOMBIA_PRODUCTIVA_CONFIG.PARTNER}, los invitamos a participar en el curso virtual gratuito en ${COLOMBIA_PRODUCTIVA_CONFIG.COURSE_NAME}.

El cual estará iniciado en el mes de ${COLOMBIA_PRODUCTIVA_CONFIG.START_DATE}. Si estás interesado(a), puedes inscribirte en este link ${COLOMBIA_PRODUCTIVA_CONFIG.REGISTRATION_LINK}

Para mayor información contactar: ${COLOMBIA_PRODUCTIVA_CONFIG.CONTACTS.KAREN}; ${COLOMBIA_PRODUCTIVA_CONFIG.CONTACTS.ANDREA}

Lo que debes saber: Curso es de carácter virtual, dirigido por la Universidad Nacional de Colombia. ${COLOMBIA_PRODUCTIVA_CONFIG.COURSE_DETAILS.DURATION}; distribuidas en ${COLOMBIA_PRODUCTIVA_CONFIG.COURSE_DETAILS.SESSIONS}.

Los cursos se desarrollarán los ${COLOMBIA_PRODUCTIVA_CONFIG.COURSE_DETAILS.SCHEDULE}.

El curso es ${COLOMBIA_PRODUCTIVA_CONFIG.COURSE_DETAILS.COST}. ${COLOMBIA_PRODUCTIVA_CONFIG.COURSE_DETAILS.PENALTY}. El curso contempla temáticas como: ${COLOMBIA_PRODUCTIVA_CONFIG.COURSE_DETAILS.TOPICS.join(', ')}, entre otros.`;
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