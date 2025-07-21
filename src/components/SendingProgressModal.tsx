import React from 'react';

interface SendingProgress {
  contactId: string;
  contactName: string;
  phone: string;
  status: 'pending' | 'sending' | 'success' | 'error';
  error?: string;
  duration?: number;
  timestamp?: Date;
}

interface SendingProgressModalProps {
  isOpen: boolean;
  progress: SendingProgress[];
  currentIndex: number;
  totalContacts: number;
  onClose: () => void;
}

export default function SendingProgressModal({
  isOpen,
  progress,
  currentIndex,
  totalContacts,
  onClose
}: SendingProgressModalProps) {
  if (!isOpen) return null;

  const successCount = progress.filter(p => p.status === 'success').length;
  const errorCount = progress.filter(p => p.status === 'error').length;
  const completedCount = successCount + errorCount;
  const progressPercentage = totalContacts > 0 ? (completedCount / totalContacts) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">📤 Enviando Mensajes</h2>
              <p className="text-blue-100">
                Progreso: {completedCount} de {totalContacts} contactos
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-100">
                {Math.round(progressPercentage)}% completado
              </span>
              <span className="text-sm text-blue-100">
                ✅ {successCount} | ❌ {errorCount}
              </span>
            </div>
            <div className="w-full bg-blue-800 bg-opacity-30 rounded-full h-3">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {progress.length > 0 ? (
            <div className="space-y-3">
              {progress.map((item, index) => (
                <div
                  key={item.contactId}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    index === currentIndex - 1 && item.status === 'sending'
                      ? 'border-blue-400 bg-blue-50 shadow-lg scale-105'
                      : item.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : item.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Status Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        item.status === 'sending'
                          ? 'bg-blue-500 animate-pulse'
                          : item.status === 'success'
                          ? 'bg-green-500'
                          : item.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                      }`}>
                        <span className="text-white text-lg">
                          {item.status === 'sending' ? '📤' : 
                           item.status === 'success' ? '✅' : 
                           item.status === 'error' ? '❌' : '⏳'}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.contactName}
                        </p>
                        <p className="text-sm text-gray-600 font-mono">
                          {item.phone}
                        </p>
                        {item.timestamp && (
                          <p className="text-xs text-gray-500">
                            {item.timestamp.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status and Duration */}
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'sending'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status === 'sending' ? 'Enviando...' :
                         item.status === 'success' ? 'Enviado' :
                         item.status === 'error' ? 'Error' : 'Pendiente'}
                      </div>
                      
                      {item.duration && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.duration}ms
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {item.error && (
                    <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800">
                        <span className="font-medium">Error:</span> {item.error}
                      </p>
                    </div>
                  )}

                  {/* Sending Animation */}
                  {item.status === 'sending' && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm font-medium">Enviando mensaje...</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📤</span>
              </div>
              <p className="text-gray-600 font-medium">Preparando envío...</p>
              <p className="text-gray-500 text-sm mt-1">Los contactos aparecerán aquí</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Estado actual:</span>
              {currentIndex <= totalContacts ? (
                <span className="ml-2 text-blue-600">
                  Procesando contacto {currentIndex} de {totalContacts}
                </span>
              ) : (
                <span className="ml-2 text-green-600">
                  ✅ Envío completado
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>{successCount} exitosos</span>
              </div>
              <div className="flex items-center text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>{errorCount} fallidos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}