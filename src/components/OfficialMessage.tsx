'use client';

import React from 'react';
import { messageTemplates } from '../lib/message-templates';

interface OfficialMessageProps {
  onUseMessage: (message: string) => void;
}

const OfficialMessage: React.FC<OfficialMessageProps> = ({ onUseMessage }) => {
  // Obtener el mensaje oficial por defecto
  const defaultTemplate = messageTemplates.find(t => t.id === 'default');
  
  // Obtener plantillas por grupo
  const grupo29Template = messageTemplates.find(t => t.id === 'grupo_29');
  const grupo30Template = messageTemplates.find(t => t.id === 'grupo_30');
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Mensaje Oficial - Colombia Productiva</h3>
        
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>
            Este es el mensaje oficial para el curso de Gestión de Sostenibilidad de Colombia Productiva.
            Se enviará a todos los contactos cargados desde Google Sheets.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg my-4">
            <pre className="whitespace-pre-wrap text-sm">{defaultTemplate?.content}</pre>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => defaultTemplate && onUseMessage(defaultTemplate.content)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              Usar este mensaje
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grupo 29 */}
        <div className="bg-green-50 rounded-lg border border-green-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Mensaje Grupo 29</h3>
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
              Mañana (7:00 - 9:00 AM)
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none text-gray-600 mb-4">
            <p>
              Este mensaje se enviará a los contactos del <strong>Grupo 29</strong>.
              Incluye información específica sobre horarios y enlaces de registro.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => grupo29Template && onUseMessage(grupo29Template.content)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              Usar mensaje Grupo 29
            </button>
          </div>
        </div>
        
        {/* Grupo 30 */}
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Mensaje Grupo 30</h3>
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
              Tarde (5:00 - 7:00 PM)
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none text-gray-600 mb-4">
            <p>
              Este mensaje se enviará a los contactos del <strong>Grupo 30</strong>.
              Incluye información específica sobre horarios y enlaces de registro.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => grupo30Template && onUseMessage(grupo30Template.content)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
            >
              Usar mensaje Grupo 30
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-2">Información importante</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Al usar la opción "Envío por Grupos", los mensajes se personalizarán automáticamente según el grupo del contacto.</li>
          <li>• Las variables como {'{nombre_apellidos}'} se reemplazarán con los datos reales del contacto.</li>
          <li>• Asegúrate de cargar una hoja de Google Sheets que incluya la columna "Grupo" para usar esta función.</li>
        </ul>
      </div>
    </div>
  );
};

export default OfficialMessage; 