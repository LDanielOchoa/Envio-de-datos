import React, { useEffect, useState } from 'react';

interface SendingProgress {
  contactId: string;
  contactName: string;
  phone: string;
  status: 'pending' | 'sending' | 'success' | 'error' | 'invalid_number' | 'verifying_whatsapp' | 'has_whatsapp';
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
  verifiedWhatsappCount: number;
  isComplete: boolean;
  startTime: string;
  lastUpdate: string;
  results: Array<{
    contactId: string;
    contactName: string;
    status: 'pending' | 'sending' | 'success' | 'error' | 'invalid_number' | 'verifying_whatsapp' | 'has_whatsapp';
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
    verifiedWhatsappCount: number;
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
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Estado para controlar los reintentos y backoff exponencial
  const [retryCount, setRetryCount] = useState(0);
  const [pollingInterval, setPollingInterval] = useState(5000); // Intervalo inicial: 5 segundos
  const maxRetries = 5;
  const baseInterval = 5000;

  // Polling para obtener progreso en tiempo real con backoff exponencial
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    console.log(`🔍 [Modal] Iniciando polling para sessionId: ${sessionId} (intervalo: ${pollingInterval}ms)`);
    
    // Agregar log de inicio
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, `${new Date().toLocaleTimeString()} - 🚀 Iniciando monitoreo de progreso...`];
      return newLogs.slice(-10);
    });

    const fetchProgress = async () => {
      try {
        console.log(`🔄 [Modal] Consultando progreso para sessionId: ${sessionId}...`);
        const response = await fetch(`/api/whatsapp/sending-progress?sessionId=${sessionId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            const processedCount = data.data.results ? data.data.results.filter((r: { status: string }) => r.status !== 'pending').length : 0;
            const logMessage = `📊 Progreso: ${processedCount}/${data.data.totalContacts} | ✅ ${data.data.successCount} enviados | ❌ ${data.data.errorCount + data.data.invalidNumbersCount} sin WhatsApp`;
            console.log(`✅ [Modal] ${logMessage}`);
            
            // Agregar log al estado para mostrar en la UI
            setLogs(prevLogs => {
              const newLogs = [...prevLogs, `${new Date().toLocaleTimeString()} - ${logMessage}`];
              return newLogs.slice(-10); // Mantener solo los últimos 10 logs
            });
            
            // Mostrar detalles de los últimos contactos procesados
            if (data.data.results && data.data.results.length > 0) {
              const recentResults = data.data.results.filter((r: { status: string }) => r.status !== 'pending').slice(-3);
              if (recentResults.length > 0) {
                console.log(`📋 [Modal] Últimos contactos procesados:`);
                recentResults.forEach(result => {
                  const statusEmoji = result.status === 'success' ? '✅' : '❌';
                  const statusText = result.status === 'success' ? 'ENVIADO' : 'SIN WHATSAPP';
                  const contactLog = `${statusEmoji} ${result.contactName} (${result.phone}) - ${statusText}`;
                  console.log(`  ${contactLog}`);
                  
                  // Agregar log de contacto individual
                  setLogs(prevLogs => {
                    const newLogs = [...prevLogs, `${new Date().toLocaleTimeString()} - ${contactLog}`];
                    return newLogs.slice(-10);
                  });
                });
              }
            }
            
            setRealTimeProgress(data.data);
            setLastUpdate(new Date());
            
            // Resetear contador de reintentos y volver al intervalo base si hay éxito
            if (retryCount > 0) {
              setRetryCount(0);
              setPollingInterval(baseInterval);
            }
          } else {
            console.log(`❌ [Modal] Error en respuesta del servidor:`, data.error);
            handleRetry();
          }
        } else if (response.status === 404) {
          console.log(`⏳ [Modal] Progreso aún no disponible (404) - esperando inicialización...`);
          
          // Agregar log solo la primera vez que se recibe 404
          setLogs(prevLogs => {
            const lastLog = prevLogs[0];
            if (!lastLog || !lastLog.includes('⏳ Esperando que inicie el envío')) {
              const newLogs = [...prevLogs, `${new Date().toLocaleTimeString()} - ⏳ Esperando que inicie el envío...`];
              return newLogs.slice(-10);
            }
            return prevLogs;
          });
        } else {
          console.log(`❌ [Modal] Error HTTP ${response.status} al consultar progreso`);
          handleRetry();
        }
      } catch (error) {
        console.log('❌ [Modal] Error de red al obtener progreso:', error);
        handleRetry();
      }
    };

    // Función para manejar reintentos con backoff exponencial
    const handleRetry = () => {
      if (retryCount < maxRetries) {
        const newRetryCount = retryCount + 1;
        // Fórmula de backoff exponencial: baseInterval * 2^retryCount
        const newInterval = baseInterval * Math.pow(2, newRetryCount);
        
        console.log(`⚠️ [Modal] Reintentando en ${newInterval}ms (intento ${newRetryCount}/${maxRetries})`);
        
        setRetryCount(newRetryCount);
        setPollingInterval(newInterval);
      } else {
        console.log(`❌ [Modal] Máximo de reintentos alcanzado (${maxRetries}). Usando intervalo base.`);
        setRetryCount(0);
        setPollingInterval(baseInterval);
      }
    };

    const interval = setInterval(fetchProgress, pollingInterval);

    // Ejecutar inmediatamente la primera vez
    fetchProgress();

    return () => {
      console.log(`🔍 [Modal] Deteniendo polling para: ${sessionId}`);
      clearInterval(interval);
    };
  }, [isOpen, sessionId, retryCount, pollingInterval]);

  if (!isOpen) return null;

  // Usar progreso en tiempo real si está disponible, sino usar datos locales
  const currentProgress = realTimeProgress || {
    currentIndex: currentIndex,
    successCount: progress.filter(p => p.status === 'success').length,
    errorCount: progress.filter(p => p.status === 'error').length,
    invalidNumbersCount: progress.filter(p => p.status === 'invalid_number').length,
    verifiedWhatsappCount: progress.filter(p => p.status === 'has_whatsapp').length,
    isComplete: false,
    results: []
  };

  // Calcular el número real de contactos procesados (no pendientes)
  const contactsToShow = realTimeProgress?.results || progress;
  const completedCount = contactsToShow.filter(contact => contact.status !== 'pending').length;
  const progressPercentage = totalContacts > 0 ? (completedCount / totalContacts) * 100 : 0;

  // Usar resultados del servidor si están disponibles - Solo dos estados: enviado y sin WhatsApp
  const finalSuccessCount = results?.successCount ?? currentProgress.successCount;
  const finalFailedCount = (results?.errorCount ?? currentProgress.errorCount) + 
                          (results?.invalidNumbersCount ?? currentProgress.invalidNumbersCount) + 
                          (results?.verifiedWhatsappCount ?? currentProgress.verifiedWhatsappCount);

  // contactsToShow ya está definido arriba para el cálculo del progreso

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
                ✅ {finalSuccessCount} Enviados | ❌ {finalFailedCount} Sin WhatsApp
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
          {/* Botón para mostrar/ocultar logs */}
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Contactos</h3>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              {showLogs ? '🔽 Ocultar Logs' : '📋 Ver Logs'}
            </button>
          </div>
          
          {/* Panel de logs */}
          {showLogs && (
            <div className="mb-4 bg-gray-900 text-green-400 p-3 rounded-lg max-h-32 overflow-y-auto font-mono text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-semibold">📡 Logs de Envío en Tiempo Real</span>
                <button
                  onClick={() => setLogs([])}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  🗑️ Limpiar
                </button>
              </div>
              {logs.length === 0 ? (
                <div className="text-gray-500">Esperando logs...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
          {contactsToShow.length > 0 ? (
            <div className="space-y-3">
              {contactsToShow.map((item, index) => {
                // Obtener nombre del contacto desde los datos del servidor
                const contactName = realTimeProgress?.results?.[index]?.contactName || item.contactName || `Contacto ${index + 1}`;
                
                // Determinar si este contacto se está procesando actualmente
                const processedCount = contactsToShow.filter(contact => contact.status !== 'pending').length;
                const isCurrentlyProcessing = item.status === 'pending' && index === processedCount && !currentProgress.isComplete;
                
                return (
                  <div
                    key={item.contactId}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      isCurrentlyProcessing
                        ? 'border-blue-400 bg-blue-50 shadow-lg scale-105'
                        : item.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : item.status === 'error' || item.status === 'invalid_number' || item.status === 'verifying_whatsapp' || item.status === 'has_whatsapp'
                        ? 'border-red-200 bg-red-50'
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
                            : (item.status === 'error' || item.status === 'invalid_number' || item.status === 'verifying_whatsapp' || item.status === 'has_whatsapp')
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}>
                          <span className="text-white text-lg">
                            {isCurrentlyProcessing ? '📤' : 
                             item.status === 'success' ? '✅' : 
                             (item.status === 'error' || item.status === 'invalid_number' || item.status === 'verifying_whatsapp' || item.status === 'has_whatsapp') ? '❌' : '⏳'}
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
                            : (item.status === 'error' || item.status === 'invalid_number' || item.status === 'verifying_whatsapp' || item.status === 'has_whatsapp')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isCurrentlyProcessing ? 'Enviando...' :
                           item.status === 'success' ? 'Enviado' :
                           (item.status === 'error' || item.status === 'invalid_number' || item.status === 'verifying_whatsapp' || item.status === 'has_whatsapp') ? 'Sin WhatsApp' : 'Pendiente'}
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {item.error && (item.status === 'error' || item.status === 'invalid_number' || item.status === 'verifying_whatsapp' || item.status === 'has_whatsapp') && (
                      <div className="mt-3 p-3 rounded-lg border bg-red-100 border-red-200">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Sin WhatsApp:</span> {item.error || 'Número no registrado en WhatsApp'}
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
                <span>{finalSuccessCount} enviados</span>
              </div>
              <div className="flex items-center text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>{finalFailedCount} sin WhatsApp</span>
              </div>
            </div>
          </div>
          
          {/* Download Button - Only show when sending is complete */}
          {currentProgress.isComplete && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={async () => {
                  try {
                    // Crear objeto de resultados compatible con la API
                    const resultsData = {
                      successCount: finalSuccessCount,
                      errorCount: finalFailedCount,
                      invalidNumbersCount: finalFailedCount,
                      verifiedWhatsappCount: 0,
                      invalidNumbers: [],
                      results: currentProgress.results.map(item => ({
                        contactId: item.contactId,
                        status: item.status,
                        error: item.error,
                        phone: item.phone
                      }))
                    };
                    
                    const response = await fetch('/api/whatsapp/export-results', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ results: resultsData })
                    });
                    
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.style.display = 'none';
                      a.href = url;
                      a.download = `resultados-envio-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } else {
                      console.error('Error al descargar el archivo');
                    }
                  } catch (error) {
                    console.error('Error al descargar:', error);
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm"
              >
                <span className="mr-2">📥</span>
                Descargar Resultados
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}