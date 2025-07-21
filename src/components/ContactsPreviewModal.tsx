import React, { useState } from 'react';
import { Contact } from '@/types';

interface ContactsPreviewModalProps {
  isOpen: boolean;
  contacts: Contact[];
  onClose: () => void;
}

export default function ContactsPreviewModal({
  isOpen,
  contacts,
  onClose
}: ContactsPreviewModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 20;

  if (!isOpen) return null;

  // Filtrar contactos
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchTerm === '' || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm);
    
    const matchesGroup = filterGroup === '' || contact.group === filterGroup;
    
    return matchesSearch && matchesGroup;
  });

  // Paginación
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + contactsPerPage);

  // Obtener grupos únicos
  const uniqueGroups = Array.from(
    new Set(contacts.map(c => c.group).filter(Boolean as unknown as (x: string | undefined) => x is string))
  ).sort();

  // Estadísticas
  const stats = {
    total: contacts.length,
    filtered: filteredContacts.length,
    groups: uniqueGroups.length,
    withGroup: contacts.filter(c => c.group).length,
    unique: new Set(contacts.map(c => c.phone)).size
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">👥 Vista Completa de Contactos</h2>
              <p className="text-blue-100">
                Gestiona y visualiza todos los contactos cargados
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-blue-50 px-8 py-4 border-b border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-blue-800">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.filtered}</p>
              <p className="text-sm text-green-800">Filtrados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.groups}</p>
              <p className="text-sm text-purple-800">Grupos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.withGroup}</p>
              <p className="text-sm text-orange-800">Con Grupo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.unique}</p>
              <p className="text-sm text-indigo-800">Únicos</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Buscar contacto
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nombre, apellido o teléfono..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏷️ Filtrar por grupo
              </label>
              <select
                value={filterGroup}
                onChange={(e) => {
                  setFilterGroup(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los grupos</option>
                {uniqueGroups.map(group => (
                  <option key={group} value={group}>Grupo {group}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterGroup('');
                  setCurrentPage(1);
                }}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 px-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium"
              >
                🧹 Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="px-8 py-6 max-h-96 overflow-y-auto">
          {paginatedContacts.length > 0 ? (
            <div className="space-y-3">
              {paginatedContacts.map((contact, index) => (
                <div key={contact.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-900">
                            {contact.name} {contact.lastName || ''}
                          </p>
                          <span className="text-sm text-gray-500">
                            #{startIndex + index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 font-mono">{contact.phone}</p>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {contact.group && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              🏷️ Grupo {contact.group}
                            </span>
                          )}
                          {contact.gestor && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              👤 {contact.gestor}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Válido
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Listo para envío
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-gray-400">🔍</span>
              </div>
              <p className="text-gray-500 font-medium mb-2">No se encontraron contactos</p>
              <p className="text-gray-400 text-sm">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} - {Math.min(startIndex + contactsPerPage, filteredContacts.length)} de {filteredContacts.length} contactos
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          currentPage === totalPages
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}