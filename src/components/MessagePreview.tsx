'use client';

import React from 'react';
import { Contact } from '../types';


interface MessagePreviewProps {
  message: string;
  contact: Contact | null;
  showPersonalization?: boolean;
}

export default function MessagePreview({ 
  message, 
  contact, 
  showPersonalization = true 
}: MessagePreviewProps) {


  return (
    <div className="bg-white rounded-xl p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">
          Vista Previa del Mensaje
        </h4>
        {contact && showPersonalization && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            📝 Personalizado para: <strong>{contact.name} {contact.lastName || ''}</strong> 
            {contact.group && ` (Grupo ${contact.group})`}
          </span>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          {message}
        </div>
      </div>
      

    </div>
  );
} 