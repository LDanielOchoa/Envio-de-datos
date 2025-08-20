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
  return `📢 Invitación especial
Estimados(as) empresarios(as), de acuerdo al correo enviado para su participación en el Curso gratuito en Gestión de la Sostenibilidad Empresarial, gracias al Ministerio de comercio, Colombia Productiva y la Universidad Nacional de Colombia.

👉 Si desean participar, pueden realizar su registro tambien  en línea en el siguiente enlace:
https://forms.office.com/Pages/ResponsePage.aspx?id=sOVj3WZsZU2ZdZ3njXPiCCbikQh6l4lMsSyo4toFLnVUOUFISjlVTU5HVjRWWFo5TjFYUlVYNllPTC4u 

Formulario de Preinscripción Curso de Sostenibilidad Empresarial (Página 1 de 6).

🗓Este curso inicia mensualmente (según demanda)
•	Grupo A: Martes y jueves 7:00 a 9:00 a.m.
•	Grupo B: Martes y jueves 5:00 a 7:00 p.m.
Esperamos contar con su participación.`;
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
