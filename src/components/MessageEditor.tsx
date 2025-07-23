'use client';

import React, { useState, useEffect } from 'react';

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnlyParts?: string[];
}

export default function MessageEditor({
  value,
  onChange,
  placeholder = "Escribe tu mensaje aquí...",
  rows = 10,
  readOnlyParts = []
}: MessageEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  // Función para dividir el texto en partes editables y no editables
  const renderMessageParts = () => {
    if (!isEditing) {
      // Modo de visualización - mostrar partes no editables resaltadas
      let text = value;
      let parts = [];
      let lastIndex = 0;

      // Buscar y resaltar las partes no editables
      readOnlyParts.forEach(part => {
        const index = text.indexOf(part, lastIndex);
        if (index !== -1) {
          // Agregar texto antes de la parte no editable
          if (index > lastIndex) {
            parts.push({
              text: text.substring(lastIndex, index),
              editable: true
            });
          }
          // Agregar la parte no editable
          parts.push({
            text: part,
            editable: false
          });
          lastIndex = index + part.length;
        }
      });

      // Agregar el texto restante
      if (lastIndex < text.length) {
        parts.push({
          text: text.substring(lastIndex),
          editable: true
        });
      }

      // Si no se encontraron partes no editables, mostrar todo como editable
      if (parts.length === 0) {
        parts.push({
          text: text,
          editable: true
        });
      }

      return (
        <div className="relative">
          <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white min-h-[120px] whitespace-pre-wrap">
            {parts.map((part, index) => (
              <span
                key={index}
                className={part.editable ? 'text-gray-900' : 'bg-yellow-100 text-gray-700 font-medium px-1 rounded'}
              >
                {part.text}
              </span>
            ))}
          </div>
          <div className="absolute top-2 right-2">
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              ✏️ Editar
            </button>
          </div>
        </div>
      );
    }

    // Modo de edición - con partes fijas no editables
    const renderEditableTextarea = () => {
      // Encontrar la primera línea (saludo)
      const lines = editValue.split('\n');
      const firstLine = lines[0];
      const remainingLines = lines.slice(1).join('\n');

      // Verificar si la primera línea contiene una parte protegida
      const hasProtectedFirstLine = readOnlyParts.some(part => firstLine.includes(part));

      if (hasProtectedFirstLine) {
        return (
          <div className="space-y-3">
            {/* Primera línea fija (no editable) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="bg-white border border-gray-300 rounded p-2 text-gray-700 font-medium">
                {firstLine}
              </div>
            </div>

            {/* Resto del mensaje editable */}
            <div>
              <textarea
                value={remainingLines}
                onChange={(e) => {
                  const newRemainingLines = e.target.value;
                  setEditValue(firstLine + '\n' + newRemainingLines);
                }}
                placeholder="Escribe el resto del mensaje aquí..."
                rows={rows - 1}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              />
            </div>
          </div>
        );
      }

      // Si no hay primera línea protegida, mostrar textarea normal
      return (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
        />
      );
    };

    return (
      <div className="space-y-3">
        {renderEditableTextarea()}
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
            >
              💾 Guardar
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              ❌ Cancelar
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {editValue.length}/1000 caracteres
          </div>
        </div>
        

      </div>
    );
  };

  return (
    <div>
      {renderMessageParts()}
    </div>
  );
} 