import { MessageTemplate } from '../types';

// Partes no editables de los mensajes
export const READ_ONLY_PARTS = [
  'Estimado/a {nombre_apellidos}',
  'Estimado/a {NOMBRE_APELLIDOS}',
  'Estimado/a {nombre}',
  'Estimado/a {NOMBRE}'
];

// Plantillas de mensajes por grupos
export const messageTemplates: MessageTemplate[] = [
  {
    id: 'default',
    name: 'Mensaje Oficial Colombia Productiva',
    content: `Buenas Tardes, Bienvenidos a la preinscripción de "Curso de Gestión de Sostenibilidad de la empresa". Desde Colombia Productiva- Ministerio de comercio industria y turismos en Alianza con la Universidad Nacional de Colombia, los invitamos a participar en el curso virtual gratuito en Gestión de la Sostenibilidad en la empresa.

El cual estará iniciado en el mes de Agosto 2025. Si estás interesado(a), puedes inscribirte en este link https://bit.ly/cursofabricas

Para mayor información contactar: karen.mendez@colombiaproductiva.com; licamargod@unal.edu.co

Lo que debes saber: Curso es de carácter virtual, dirigido por la Universidad Nacional de Colombia. 19 horas de formación, 4 horas asincrónicas (tiempo autónomo de estudio del estudiante) y 15 horas virtuales sincrónicas o en línea; distribuidas en 7 sesiones (2 sesiones a la semana, cada una de 2 horas) que se desarrollan aproximadamente en un mes.

Los cursos se desarrollarán los martes y jueves de 7:00 am a 9:00 am o de 5:00 pm a 7:00 pm, así como los días miércoles y viernes en los mismos horarios.

El curso es completamente gratuito, no tendrá costo solo para aquellos estudiantes que finalicen el curso. En caso de iniciar y no finalizar el curso habrá una penalidad de $300.000. El curso contempla temáticas como: Nociones y pilares de la sostenibilidad en el sector productivo, Agenda de desarrollo sostenible ODS y su conexión con el sector productivo, Tendencias, prácticas y experiencias de sostenibilidad, Crisis climática, Estrategia de economía circular, entre otros.`
  },
  {
    id: 'grupo_35',
    name: 'Mensaje Grupo 35',
    group: '35',
    content: `Estimada Señor(a) {nombre_apellidos},
Reciba un cordial saludo. Mi nombre es Cyndi Guzman, de la Universidad Nacional de Colombia, y me comunico para agradecerle su inscripción sin costo, beca del 100% de la matrícula, en el curso virtual “Gestión de la Sostenibilidad en las Empresas” que se realiza en el marco del convenio entre la Universidad Nacional y Colombia Productiva del Ministerio de Comercio.

Para formalizar su registro en nuestro sistema y garantizar su cupo, le solicitamos amablemente realizar el siguiente proceso:

⿡ Registro en la plataforma Hermes
Por favor, ingrese al siguiente enlace y complete su inscripción en el Grupo 35:
👉 [LINK DE REGISTRO EN HERMES]
https://hermesextension.unal.edu.co/ords/f?p=116:21::::RP:P21_ID:60416&cs=16Er8i2uKPWS10Rd6L1nGqPoZlzs

⿢ Diligenciamiento y firma del documento: https://drive.google.com/file/d/1Ag05j_lbvlAA441_foQs8JAWupg-emk4/view 
Descargue y complete los formatos adjuntos. Una vez diligenciados y firmados, súbalos a través del siguiente enlace 👉 https://forms.gle/LstmaVE5y7ZA5vKD9         o envíe los documentos al correo dbarrerapa@unal.edu.co 

📅 Inicio del curso: Martes 14 de Octubre
🗓 Finaliza: Jueves 06 de Noviembre 2025
📌 Horario: Martes y Jueves de 7:00 a.m. a 9:00 a.m.
📍 Grupo 35


Una vez recibida y validada su documentación, le confirmaremos oficialmente su inscripción y le daremos la bienvenida al curso.

Cordialmente,
Cyndi
Gestora de Beneficiarios Unal Y Fiducoldex`
  },
  {
    id: 'grupo_36',
    name: 'Mensaje Grupo 36',
    group: '36',
    content: `Estimado(a) señor(a) {nombre_apellidos}, 
Reciba un cordial saludo. Mi nombre es Cyndi Guzman , de la Universidad Nacional de Colombia, y me comunico para agradecerle su inscripción sin costo, beca del 100% de la matrícula, en el curso virtual “Gestión de la Sostenibilidad en las Empresas” que se realiza en el marco del convenio entre la Universidad Nacional y Colombia Productiva del Ministerio de Comercio.

Para formalizar su registro en nuestro sistema y garantizar su cupo, le solicitamos amablemente realizar el siguiente proceso:

⿡ Registro en la plataforma Hermes
Por favor, ingrese al siguiente enlace y complete su inscripción en el Grupo 36:
👉 [LINK DE REGISTRO EN HERMES]
https://hermesextension.unal.edu.co/ords/f?p=116:21::::RP:P21_ID:60417&cs=1LU8ixtJFR0nyvMICp7VVY33T1LA

⿢ Diligenciamiento y firma del documento: https://drive.google.com/file/d/1Ag05j_lbvlAA441_foQs8JAWupg-emk4/view 
Descargue y complete los formatos adjuntos. Una vez diligenciados y firmados, súbalos a través del siguiente enlace 👉 https://forms.gle/jCpp7qPSs2gPe9a16 o envíe los documentos al correo dbarrerapa@unal.edu.co 

📅 Inicio del curso: Martes 14 de Octubre
🗓 Finaliza: Jueves 06 de Noviembre 2025
📌 Horario: Martes y Jueves de 5:00 p.m. a 7:00 p.m.
📍 Grupo 36


Una vez recibida y validada su documentación, le confirmaremos oficialmente su inscripción y le daremos la bienvenida al curso.

Cordialmente,
Cyndi Guzman 
Super Gestora de Beneficiarios Unal Y Fiducoldex`
  }
];

// Función para obtener una plantilla por ID
export function getTemplateById(id: string): MessageTemplate | undefined {
  return messageTemplates.find(template => template.id === id);
}

// Función para obtener una plantilla por grupo
export function getTemplateByGroup(group: string): MessageTemplate | undefined {
  console.log(`🔧 Buscando plantilla para grupo: "${group}"`);
  
  // Normalizar el grupo (puede venir como "Grupo 29", "29", etc.)
  const normalizedGroup = group.toLowerCase().trim();
  const groupNumber = normalizedGroup.replace(/grupo\s*/, ''); // Remover "grupo " si existe
  
  console.log(`🔧 Grupo normalizado: "${groupNumber}"`);
  
  // Buscar coincidencia exacta primero
  let template = messageTemplates.find(template => template.group === group);
  if (template) {
    console.log(`🔧 Plantilla encontrada por coincidencia exacta: ${template.name}`);
    return template;
  }
  
  // Buscar por número de grupo
  template = messageTemplates.find(template => template.group === groupNumber);
  if (template) {
    console.log(`🔧 Plantilla encontrada por número de grupo: ${template.name}`);
    return template;
  }
  
  // Buscar por cualquier formato que contenga el número
  template = messageTemplates.find(template => 
    template.group && (
      normalizedGroup.includes(template.group) || 
      template.group.includes(groupNumber)
    )
  );
  
  if (template) {
    console.log(`🔧 Plantilla encontrada por coincidencia parcial: ${template.name}`);
    return template;
  }
  
  console.log(`🔧 No se encontró plantilla para grupo: "${group}"`);
  return undefined;
}

// Función para personalizar un mensaje con los datos del contacto
export function personalizeMessage(template: string, contact: any): string {
  console.log('🔧 personalizeMessage llamado con:', {
    templateLength: template.length,
    contact: contact,
    hasName: !!contact.name,
    hasLastName: !!contact.lastName
  });
  
  let message = template;
  
  // Reemplazar nombre y apellido juntos si están disponibles
  if (contact.name) {
    // Asegurarse de que ambos campos estén definidos antes de combinarlos
    const fullName = contact.lastName 
      ? `${contact.name} ${contact.lastName}` 
      : contact.name;
    
    // Versión en mayúsculas para {nombre_apellidos}
    const fullNameUpperCase = fullName.toUpperCase();
    console.log('🔧 Reemplazando {nombre_apellidos} con:', fullNameUpperCase);
    
    message = message.replace(/{nombre_apellidos}/g, fullNameUpperCase);
    
    // También reemplazar {NOMBRE_APELLIDOS} (ya en mayúsculas)
    message = message.replace(/{NOMBRE_APELLIDOS}/g, fullNameUpperCase);
  }
  
  // Reemplazar solo nombre si está disponible
  if (contact.name) {
    message = message.replace(/{nombre}/g, contact.name);
    message = message.replace(/{NOMBRE}/g, contact.name.toUpperCase());
  }
  
  // Reemplazar solo apellido si está disponible
  if (contact.lastName) {
    message = message.replace(/{apellido}/g, contact.lastName);
    message = message.replace(/{APELLIDO}/g, contact.lastName.toUpperCase());
  }
  
  // Reemplazar grupo si está disponible
  if (contact.group) {
    message = message.replace(/{grupo}/g, contact.group);
    message = message.replace(/{GRUPO}/g, contact.group.toUpperCase());
  }
  
  // Reemplazar gestor si está disponible
  if (contact.gestor) {
    message = message.replace(/{gestor}/g, contact.gestor);
    message = message.replace(/{GESTOR}/g, contact.gestor.toUpperCase());
  }
  
  console.log('🔧 Mensaje final personalizado:', message.substring(0, 100) + '...');
  return message;
}
