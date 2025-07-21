'use client';

import React from 'react';
import { messageTemplates } from '../lib/message-templates';

interface MessageTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

const MessageTemplates: React.FC<MessageTemplatesProps> = ({ onSelectTemplate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Plantillas de Mensajes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {messageTemplates.map((template) => (
          <div 
            key={template.id}
            className={`p-3 rounded-lg border cursor-pointer hover:bg-blue-50 transition-colors ${
              template.group ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'
            }`}
            onClick={() => onSelectTemplate(template.content)}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{template.name}</h4>
              {template.group && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Grupo {template.group}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 line-clamp-3">
              {template.content.substring(0, 150)}...
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageTemplates; 