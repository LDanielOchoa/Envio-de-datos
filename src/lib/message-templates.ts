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
    content: `Buenas Tardes, estimados Extensionistas de Fabricas de Productividad!

Desde Colombia Productiva en Alianza con la Universidad Nacional de Colombia, los invitamos a participar en el curso virtual gratuito en Gestión de la Sostenibilidad en la empresa. El cual estará iniciado en el mes de Junio 2025.

Si estás interesado(a), puedes inscribirte en este link
https://bit.ly/cursofabricas

Para mayor información contactar: karen.mendez@colombiaproductiva.com; andiazce@unal.edu.co`
  },
  {
    id: 'grupo_29',
    name: 'Mensaje Grupo 29',
    group: '29',
    content: `Estimado/a {nombre_apellidos}

Soy XX de la Universidad Nacional de Colombia. 
Me comunico para ofrecer el curso virtual "Gestión de la Sostenibilidad en las Empresas", que podrá realizar sin costo gracias a la alianza entre Colombia Productiva y la Universidad Nacional.
Este curso es completamente gratuito, gracias a la alianza entre Colombia Productiva y la Universidad Nacional de Colombia.
Para inscribirte, por favor seguir estos tres (3) pasos:

1️⃣ Registrarse en la plataforma Hermes a través del siguiente enlace:
👉 Grupo 29
LINK REGISTRO SISTEMA HERMES:
https://hermesextension.unal.edu.co/ords/f?p=116:21::::RP:P21_ID:56222&cs=1dBDBZ-sKUll75rat53uCq_cI9b8

2️⃣Diligencia los documentos adjuntos (formatos requeridos). 
📄 Formatos requeridos: https://forms.gle/7wuVd9bdXomVFh2v5
📁 Docuemnto en pdf se debe descargar para el diligenciamiento del proceso de registro: https://drive.google.com/file/d/1eg8aKCOm_nFHkXjufWEGzGojr18pmSsN/view?usp=sharing

3⃣ Envía el documento completo en PDF (Formatos Requeridos) como archivo adjunto al correo dbarrerapa@unal.edu.co o por este mismo medio (WhatsApp).

📅 Inicio del curso: Martes 15 de Julio
🗓 Finaliza: jueves 12 de agosto 2025
📌 Horario: martes y Jueves de 7:00 a.m. a 9:00 a.m.
📍 Grupo 29

📢 Una vez recibida y procesada su documentación, le daremos la bienvenida al curso (Grupo 29).

🔹 Importante: No es necesario completar los campos de número de pagaré y factura.

¡Esperamos contar con su participación, en esta gran oportunidad de aprendizaje!

Cordialmente,
Nombre Cyndi Guzman Gomez 
Gestor de Beneficiarios – Proyecto Colombia Productiva
(Universidad Nacional y Fiducoldex)
El curso inicia hoy a las 07:00 am
Me informa si está interesada para compartir el link y en la tarde se haría el proceso de registro para que no pierda la clase de hoy.`
  },
  {
    id: 'grupo_30',
    name: 'Mensaje Grupo 30',
    group: '30',
    content: `Estimado/a {nombre_apellidos}
Soy XX de la Universidad Nacional de Colombia. 
Me comunico para ofrecer el curso virtual "Gestión de la Sostenibilidad en las Empresas", que podrá realizar sin costo gracias a la alianza entre Colombia Productiva y la Universidad Nacional.
Este curso es completamente gratuito, gracias a la alianza entre Colombia Productiva y la Universidad Nacional de Colombia.
Te espero para que aproveches esta oportunidad y avances en tu formación Para inscribirte, por favor seguir estos tres (3) pasos:

1️⃣Registrarse en la plataforma Hermes a través del siguiente enlace:
👉 Grupo 30
LINK REGISTRO SISTEMA HERMES:
https://hermesextension.unal.edu.co/ords/f?p=116:21::::RP:P21_ID:56223&cs=1FczQeumzeI-0ysQHywJi_TMWQWo

2️⃣Diligencia los documentos adjuntos (formatos requeridos).
📄 Formatos requeridos: https://forms.gle/7wuVd9bdXomVFh2v5
📁 Docuemnto en pdf se debe descargar para el diligenciamiento del proceso de registro: https://drive.google.com/file/d/1eg8aKCOm_nFHkXjufWEGzGojr18pmSsN/view?usp=sharing

3⃣Envía el documento completo en PDF (Formatos Requeridos) como archivo adjunto al correo dbarrerapa@unal.edu.co o por este mismo medio (WhatsApp).

📅 Inicio del curso: martes 15 de julio
🗓 Finaliza: Jueves 12 de agosto  2025
📌 Horario: Martes y Jueves de 5:00 p.m. a 7:00 p.m.
📍 Grupo 30

📢 Una vez recibida y procesada su documentación, le daremos la bienvenida al curso (Grupo 30).

🔹 Importante: No es necesario completar los campos de número de pagaré y factura.

¡Esperamos contar con su participación, en esta gran oportunidad de aprendizaje!

Cordialmente,
Cyndi Guzman 
Gestor de Beneficiarios – Proyecto Colombia Productiva
(Universidad Nacional y Fiducoldex)`
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