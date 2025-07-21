'use client';

import React from 'react';
import { Contact } from '@/types';

interface GroupInfoProps {
  contacts: Contact[];
}

const GroupInfo: React.FC<GroupInfoProps> = ({ contacts }) => {
  // Contar contactos por grupo
  const groupCounts: Record<string, number> = {};
  
  contacts.forEach(contact => {
    const group = contact.group || 'Sin grupo';
    groupCounts[group] = (groupCounts[group] || 0) + 1;
  });
  
  // Ordenar grupos por cantidad de contactos
  const sortedGroups = Object.entries(groupCounts)
    .sort(([, countA], [, countB]) => countB - countA);
  
  // Colores para los grupos
  const groupColors: Record<string, { bg: string, text: string, border: string }> = {
    '29': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    '30': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'Sin grupo': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
  };
  
  // Función para obtener colores para un grupo
  const getGroupColors = (group: string) => {
    return groupColors[group] || { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Distribución por Grupos</h3>
      
      {sortedGroups.length > 0 ? (
        <div className="space-y-3">
          {sortedGroups.map(([group, count]) => {
            const colors = getGroupColors(group);
            return (
              <div 
                key={group}
                className={`rounded-lg p-4 border ${colors.border} ${colors.bg}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <span className="text-lg">👥</span>
                    </div>
                    <div>
                      <h4 className={`font-medium ${colors.text}`}>
                        {group === 'Sin grupo' ? 'Sin grupo asignado' : `Grupo ${group}`}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {count} {count === 1 ? 'contacto' : 'contactos'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {Math.round((count / contacts.length) * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">No hay contactos con información de grupo</p>
          <p className="text-xs text-gray-400 mt-1">
            Carga contactos con grupos asignados para ver esta información
          </p>
        </div>
      )}
    </div>
  );
};

export default GroupInfo; 