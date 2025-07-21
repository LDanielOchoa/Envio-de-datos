'use client';

import React from 'react';
import { Contact, WhatsAppStatus } from '../types';
import GroupInfo from './GroupInfo';

interface DashboardProps {
  whatsappStatus: WhatsAppStatus | null;
  contacts: Contact[];
  results: any;
}

const Dashboard: React.FC<DashboardProps> = ({ whatsappStatus, contacts, results }) => {
  // Verificar si hay contactos con información de grupo
  const hasGroupInfo = contacts.some(contact => contact.group);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Panel de Control</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WhatsApp Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Estado de WhatsApp</h3>
          <div className={`flex items-center space-x-2 ${whatsappStatus?.isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-3 h-3 rounded-full ${whatsappStatus?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {whatsappStatus?.isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {whatsappStatus?.isConnected && (
            <p className="text-xs text-gray-500 mt-1">
              {whatsappStatus.phoneNumber}
            </p>
          )}
        </div>
        
        {/* Contacts Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Contactos</h3>
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="font-medium">
              {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {hasGroupInfo ? 'Con información de grupo' : 'Sin información de grupo'}
          </p>
        </div>
        
        {/* Results Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Resultados</h3>
          {results ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">{results.successCount} exitosos</span>
              </div>
              <div className="flex items-center space-x-1 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">{results.errorCount} fallidos</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay resultados disponibles</p>
          )}
        </div>
      </div>
      
      {/* Group Information (only show if there are contacts with group info) */}
      {hasGroupInfo && contacts.length > 0 && (
        <div className="mt-6">
          <GroupInfo contacts={contacts} />
        </div>
      )}
    </div>
  );
};

export default Dashboard; 