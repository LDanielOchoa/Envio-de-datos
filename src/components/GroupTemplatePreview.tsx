'use client';

import React from 'react';
import { messageTemplates } from '@/lib/message-templates';

interface GroupTemplatePreviewProps {
  group: string;
  onUseTemplate: (content: string) => void;
}

const GroupTemplatePreview: React.FC<GroupTemplatePreviewProps> = ({ group, onUseTemplate }) => {
  // Obtener la plantilla para el grupo especificado
  const template = messageTemplates.find(t => t.group === group);
  
  if (!template) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">No hay plantilla para el Grupo {group}</h3>
        <p className="text-sm text-yellow-700">
          No se encontró una plantilla específica para este grupo.
          Puedes crear una nueva plantilla o usar el mensaje por defecto.
        </p>
      </div>
    );
  }
  
  // Determinar colores según el grupo
  const colors = {
    '29': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-800',
      button: 'bg-green-600 hover:bg-green-700'
    },
    '30': {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      title: 'text-purple-800',
      button: 'bg-purple-600 hover:bg-purple-700'
    }
  };
  
  // Usar colores del grupo o colores por defecto
  const groupColors = colors[group as keyof typeof colors] || {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700'
  };
  
  return (
    <div className={`rounded-lg p-6 ${groupColors.bg} border ${groupColors.border}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${groupColors.title}`}>
          Plantilla para Grupo {group}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${groupColors.bg} ${groupColors.title} border ${groupColors.border}`}>
          {group === '29' ? 'Mañana (7:00 - 9:00 AM)' : 'Tarde (5:00 - 7:00 PM)'}
        </span>
      </div>
      
      <div className="prose prose-sm max-w-none text-gray-600 mb-4">
        <div className="bg-white p-4 rounded-lg my-4 border border-gray-200">
          <pre className="whitespace-pre-wrap text-sm">{template.content}</pre>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => onUseTemplate(template.content)}
          className={`text-white px-4 py-2 rounded-md text-sm ${groupColors.button}`}
        >
          Usar esta plantilla
        </button>
      </div>
    </div>
  );
};

export default GroupTemplatePreview; 