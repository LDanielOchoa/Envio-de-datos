import React from 'react';
import { Contact } from '../types';
import ContactsPreviewModal from './ContactsPreviewModal';

interface ContactsSectionProps {
  contacts: Contact[];
  loading: boolean;
  onLoadContacts: (file: File) => void;
  onLoadGroupContacts: (file: File) => void;
  onClearContacts: () => void;
  onFilterContacts: (filteredContacts: Contact[]) => void;
}

export default function ContactsSection({
  contacts,
  loading,
  onLoadContacts,
  onLoadGroupContacts,
  onClearContacts,
  onFilterContacts
}: ContactsSectionProps) {
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [loadingType, setLoadingType] = React.useState<'individual' | 'groups' | null>(null);
  const [selectedGroup, setSelectedGroup] = React.useState<string>('all');

  const handleIndividualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoadingType('individual');
      onLoadContacts(file);
    }
  };

  const handleGroupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoadingType('groups');
      onLoadGroupContacts(file);
    }
  };

  React.useEffect(() => {
    if (!loading) {
      setLoadingType(null);
    }
  }, [loading]);

  // Filtrar contactos por grupo seleccionado
  React.useEffect(() => {
    if (selectedGroup === 'all') {
      onFilterContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => contact.group === selectedGroup);
      onFilterContacts(filtered);
    }
  }, [selectedGroup, contacts, onFilterContacts]);

  const getContactStats = () => {
    const total = contacts.length;
    const grupo29 = contacts.filter(c => c.group === '29').length;
    const grupo30 = contacts.filter(c => c.group === '30').length;
    const unique = new Set(contacts.map(c => c.phone)).size;
    
    return { total, grupo29, grupo30, unique };
  };

  const stats = getContactStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-2xl text-white">📊</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Contactos</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Carga y gestiona los contactos desde archivos Excel para el envío de mensajes
        </p>
      </div>

      {/* Stats Cards */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Contactos</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Grupo 29</p>
                <p className="text-3xl font-bold text-green-900">{stats.grupo29}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏷️</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Grupo 30</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.grupo30}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏷️</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Únicos</p>
                <p className="text-3xl font-bold text-purple-900">{stats.unique}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📱</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtro por grupo */}
      {contacts.length > 0 && stats.grupo29 + stats.grupo30 > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
            <h3 className="text-xl font-semibold text-purple-900 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Filtrar por Grupo
            </h3>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedGroup === 'all'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👥 Todos los Contactos ({stats.total})
              </button>
              
              {stats.grupo29 > 0 && (
                <button
                  onClick={() => setSelectedGroup('29')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedGroup === '29'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏷️ Grupo 29 ({stats.grupo29})
                </button>
              )}
              
              {stats.grupo30 > 0 && (
                <button
                  onClick={() => setSelectedGroup('30')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedGroup === '30'
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏷️ Grupo 30 ({stats.grupo30})
                </button>
              )}
            </div>
            
            <div className="mt-4 text-center text-gray-600">
              <p>
                {selectedGroup === 'all' 
                  ? 'Mostrando todos los contactos' 
                  : `Mostrando solo contactos del grupo ${selectedGroup}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Individual Contacts Upload */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Carga Individual
            </h3>
          </div>

          <div className="p-6">
            <div className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden ${
              loading && loadingType === 'individual'
                ? 'border-yellow-300 bg-yellow-50' 
                : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
            }`}>
              {loading && loadingType === 'individual' && (
                <div className="absolute inset-0 bg-yellow-50 bg-opacity-95 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-yellow-800 font-medium">Procesando archivo...</p>
                    <p className="text-yellow-600 text-sm mt-1">Por favor espera</p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleIndividualFileChange}
                className="hidden"
                id="individual-excel-upload"
                disabled={loading && loadingType === 'individual'}
              />
              
              <label htmlFor="individual-excel-upload" className="cursor-pointer block">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-3xl text-white">📊</span>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-blue-900 mb-2">
                      {loading && loadingType === 'individual' ? 'Procesando archivo...' : 'Carga Individual'}
                    </p>
                    <p className="text-blue-700 mb-4">
                      Hoja: "Contacto Col-Productiva07-07-25"
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200">
                      📁 Examinar archivos
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* File Requirements */}
            <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Requisitos - Carga Individual
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Hoja: "Contacto Col-Productiva07-07-25"</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Gestor: "Cyndi"</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Estado: "Sin contactar"</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Formato: .xlsx o .xls</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Group Contacts Upload */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
            <h3 className="text-xl font-semibold text-green-900 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Carga por Grupos
            </h3>
          </div>

          <div className="p-6">
            <div className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden ${
              loading && loadingType === 'groups'
                ? 'border-yellow-300 bg-yellow-50' 
                : 'border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-100'
            }`}>
              {loading && loadingType === 'groups' && (
                <div className="absolute inset-0 bg-yellow-50 bg-opacity-95 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-yellow-800 font-medium">Procesando archivo por grupos...</p>
                    <p className="text-yellow-600 text-sm mt-1">Por favor espera</p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleGroupFileChange}
                className="hidden"
                id="group-excel-upload"
                disabled={loading && loadingType === 'groups'}
              />
              
              <label htmlFor="group-excel-upload" className="cursor-pointer block">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-3xl text-white">🏷️</span>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-green-900 mb-2">
                      {loading && loadingType === 'groups' ? 'Procesando archivo...' : 'Carga por Grupos'}
                    </p>
                    <p className="text-green-700 mb-4">
                      Hoja: "G29&30" - Grupos 29 y 30
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors duration-200">
                      🏷️ Examinar archivos
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Group File Requirements */}
            <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Requisitos - Carga por Grupos
              </h4>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Hoja: "G29&30"</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Columnas: Nombres, Apellidos, Teléfono, Grupo, Gestor, Resultado Contacto</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Grupos: 29 y 30</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Formato: .xlsx o .xls</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Button */}
      {contacts.length > 0 && (
        <div className="text-center">
          <button
            onClick={onClearContacts}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            🧹 Limpiar Lista de Contactos
          </button>
        </div>
      )}
      {/* Contacts Preview */}
      {contacts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Vista Previa de Contactos
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {contacts.slice(0, 10).map((contact, index) => (
                    <div key={contact.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {contact.name} {contact.lastName || ''}
                              </p>
                              <p className="text-sm text-gray-600 font-mono">{contact.phone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
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
                        
                        <div className="ml-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Válido
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {contacts.length > 10 && (
                    <div className="text-center py-4 border-t border-gray-200">
                      <p className="text-gray-500 font-medium mb-3">
                        ... y {contacts.length - 10} contactos más
                      </p>
                      <button
                        onClick={() => setShowPreviewModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        👁️ Ver Todos los Contactos
                      </button>
                    </div>
                  )}
                </div>
                
                {/* View All Button for smaller lists */}
                {contacts.length > 0 && contacts.length <= 10 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      👁️ Vista Detallada
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Column Format Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Individual Format */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <span className="mr-3">📋</span>
            Formato Individual
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-blue-100 rounded-lg">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900 rounded-l-lg">Nombres</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Apellidos</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Teléfono</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900 rounded-r-lg">Grupo</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b border-blue-200">
                  <td className="px-3 py-2 text-xs text-gray-900">Juan Carlos</td>
                  <td className="px-3 py-2 text-xs text-gray-900">Pérez López</td>
                  <td className="px-3 py-2 text-xs text-gray-900 font-mono">3001234567</td>
                  <td className="px-3 py-2 text-xs text-gray-900">29</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Group Format */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200 p-6">
          <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
            <span className="mr-3">🏷️</span>
            Formato por Grupos (G29&30)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-green-100 rounded-lg">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900 rounded-l-lg">Nombres</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900">Apellidos</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900">Teléfono</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900">Grupo</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900">Gestor</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900 rounded-r-lg">Resultado</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b border-green-200">
                  <td className="px-2 py-2 text-xs text-gray-900">Gloria Beatriz</td>
                  <td className="px-2 py-2 text-xs text-gray-900">Noguera</td>
                  <td className="px-2 py-2 text-xs text-gray-900 font-mono">3207207924</td>
                  <td className="px-2 py-2 text-xs text-gray-900">29</td>
                  <td className="px-2 py-2 text-xs text-gray-900">Cyndi</td>
                  <td className="px-2 py-2 text-xs text-gray-900">Se envía mensaje</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contacts Preview Modal */}
      <ContactsPreviewModal
        isOpen={showPreviewModal}
        contacts={contacts}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
}