import React, { useEffect, useState } from 'react';

interface SendingProgress {
  contactId: string;
  contactName: string;
  phone: string;
  status: 'pending' | 'sending' | 'success' | 'error' | 'invalid_number';
  error?: string;
  duration?: number;
  timestamp?: Date;
}

interface RealTimeProgress {
  sessionId: string;
  totalContacts: number;
  currentIndex: number;
  successCount: number;
  errorCount: number;
  invalidNumbersCount: number;
  isComplete: boolean;
  startTime: string;
  lastUpdate: string;
  results: Array<{
    contactId: string;
    contactName: string;
    status: 'pending' | 'sending' | 'success' | 'error' | 'invalid_number';
    phone: string;
    error?: string;
    timestamp: string;
  }>;
}

interface SendingProgressModalProps {
  isOpen: boolean;
  progress: SendingProgress[];
  currentIndex: number;
  totalContacts: number;
  onClose: () => void;
  results?: {
    successCount: number;
    errorCount: number;
    invalidNumbersCount: number;
    invalidNumbers: string[];
  } | null;
  sessionId?: string;
}

export default function SendingProgressModal({
  isOpen,
  progress,
  currentIndex,
  totalContacts,
  onClose,
  results,
  sessionId
}: SendingProgressModalProps) {
  const [realTimeProgress, setRealTimeProgress] = useState<RealTimeProgress | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Polling para obtener progreso en tiempo real
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    console.log(`🔍 [Modal] Iniciando polling para sessionId: ${sessionId}`);

    const interval = setInterval(async () => {
      try {
        console.log(`🔍 [Modal] Consultando progreso para: ${sessionId}`);
        const response = await fetch(`/api/whatsapp/sending-progress?sessionId=${sessionId}`);
        console.log(`🔍 [Modal] Respuesta del servidor:`, response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`🔍 [Modal] Datos recibidos:`, data);
          
          if (data.success) {
            console.log(`✅ [Modal] Progreso actualizado:`, {
              currentIndex: data.data.currentIndex,
              totalContacts: data.data.totalContacts,
              resultsCount: data.data.results.length
            });
            setRealTimeProgress(data.data);
            setLastUpdate(new Date());
          } else {
            console.log(`❌ [Modal] Error en respuesta:`, data.error);
          }
        } else {
          console.log(`❌ [Modal] Error HTTP:`, response.status);
        }
      } catch (error) {
        console.log('❌ [Modal] Error obteniendo progreso en tiempo real:', error);
      }
    }, 1000); // Actualizar cada segundo

    return () => {
      console.log(`🔍 [Modal] Deteniendo polling para: ${sessionId}`);
      clearInterval(interval);
    };
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  // Usar progreso en tiempo real si está disponible, sino usar datos locales
  const currentProgress = realTimeProgress || {
    currentIndex: currentIndex,
    successCount: progress.filter(p => p.status === 'success').length,
    errorCount: progress.filter(p => p.status === 'error').length,
    invalidNumbersCount: progress.filter(p => p.status === 'invalid_number').length,
    isComplete: false,
    results: []
  };

  const completedCount = currentProgress.currentIndex;
  const progressPercentage = totalContacts > 0 ? (completedCount / totalContacts) * 100 : 0;

  // Usar resultados del servidor si están disponibles
  const finalSuccessCount = results?.successCount ?? currentProgress.successCount;
  const finalErrorCount = results?.errorCount ?? currentProgress.errorCount;
  const finalInvalidCount = results?.invalidNumbersCount ?? currentProgress.invalidNumbersCount;

  // Crear lista de contactos para mostrar
  const contactsToShow = realTimeProgress?.results || progress;

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
                {realTimeProgress && (
                  <span className="ml-2 text-xs">
                    (Actualizado: {lastUpdate.toLocaleTimeString()})
                  </span>
                )}
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
                ✅ {finalSuccessCount} | ❌ {finalErrorCount} | ⚠️ {finalInvalidCount}
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
          {contactsToShow.length > 0 ? (
            <div className="space-y-3">
              {contactsToShow.map((item, index) => {
                // Obtener nombre del contacto desde los datos del servidor
                const contactName = realTimeProgress?.results?.[index]?.contactName || item.contactName || `Contacto ${index + 1}`;
                const isCurrentlyProcessing = index === completedCount - 1 && !currentProgress.isComplete;
                
                return (
                  <div
                    key={item.contactId}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      isCurrentlyProcessing
                        ? 'border-blue-400 bg-blue-50 shadow-lg scale-105'
                        : item.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : item.status === 'error'
                        ? 'border-red-200 bg-red-50'
                        : item.status === 'invalid_number'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Status Icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isCurrentlyProcessing
                            ? 'bg-blue-500 animate-pulse'
                            : item.status === 'success'
                            ? 'bg-green-500'
                            : item.status === 'error'
                            ? 'bg-red-500'
                            : item.status === 'invalid_number'
                            ? 'bg-orange-500'
                            : 'bg-gray-400'
                        }`}>
                          <span className="text-white text-lg">
                            {isCurrentlyProcessing ? '📤' : 
                             item.status === 'success' ? '✅' : 
                             item.status === 'error' ? '❌' : 
                             item.status === 'invalid_number' ? '⚠️' : '⏳'}
                          </span>
                        </div>

                        {/* Contact Info */}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {contactName}
                          </p>
                          <p className="text-sm text-gray-600 font-mono">
                            {item.phone}
                          </p>
                          {item.timestamp && (
                            <p className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status and Duration */}
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          isCurrentlyProcessing
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : item.status === 'invalid_number'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isCurrentlyProcessing ? 'Enviando...' :
                           item.status === 'success' ? 'Enviado' :
                           item.status === 'error' ? 'Error' :
                           item.status === 'invalid_number' ? 'Sin WhatsApp' : 'Pendiente'}
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {item.error && (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        item.status === 'invalid_number' 
                          ? 'bg-orange-100 border-orange-200' 
                          : 'bg-red-100 border-red-200'
                      }`}>
                        <p className={`text-sm ${
                          item.status === 'invalid_number' ? 'text-orange-800' : 'text-red-800'
                        }`}>
                          <span className="font-medium">
                            {item.status === 'invalid_number' ? 'Número no válido:' : 'Error:'}
                          </span> {item.error}
                        </p>
                      </div>
                    )}

                    {/* Sending Animation */}
                    {isCurrentlyProcessing && (
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
                );
              })}
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
              {currentProgress.isComplete ? (
                <span className="ml-2 text-green-600">
                  ✅ Envío completado
                </span>
              ) : (
                <span className="ml-2 text-blue-600">
                  Procesando contacto {completedCount} de {totalContacts}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>{finalSuccessCount} exitosos</span>
              </div>
              <div className="flex items-center text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>{finalErrorCount} fallidos</span>
              </div>
              <div className="flex items-center text-orange-600">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span>{finalInvalidCount} sin WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}