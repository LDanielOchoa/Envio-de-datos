import React, { useEffect, useState } from 'react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateQR: () => void;
}

export default function QRModal({ isOpen, onClose, onGenerateQR }: QRModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrTimestamp, setQrTimestamp] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const fetchQRCode = async (forceRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (isRequestInProgress) {
      console.log('QR request already in progress, skipping...');
      return;
    }

    // Rate limiting: minimum 3 seconds between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (!forceRefresh && timeSinceLastRequest < 3000) {
      console.log(`Rate limiting: ${3000 - timeSinceLastRequest}ms remaining`);
      return;
    }

    setIsRequestInProgress(true);
    setLastRequestTime(now);
    setLoading(true);
    setError(null);
    
    try {
      // First try to generate QR through the main app's API
      await onGenerateQR();
      
      // Wait a moment for the backend to generate the QR
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Single request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`https://envio-de-datos-hl8g.onrender.com/api/qr?t=${now}`, {
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.qr) {
        setQrCode(data.qr);
        setQrTimestamp(now);
        setError(null);
      } else {
        setError('QR no disponible. El backend está procesando la conexión.');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Timeout: El servidor tardó demasiado en responder');
      } else {
        setError('Error al obtener el código QR');
      }
      console.error('Error fetching QR:', err);
    } finally {
      setLoading(false);
      setIsRequestInProgress(false);
    }
  };

  // Monitor connection status when modal is open
  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setQrCode(null);
      setError(null);
      setIsConnecting(false);
      setIsRequestInProgress(false);
      
      // Fetch QR code only once when opening
      fetchQRCode();
      
      // Start monitoring connection status with reduced frequency
      let isComponentMounted = true;
      
      const checkConnectionStatus = async () => {
        if (!isComponentMounted) return;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch('https://envio-de-datos-hl8g.onrender.com/api/status', {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!isComponentMounted) return;
          
          const data = await response.json();
          
          if (data.status === 'connected') {
            setIsConnecting(true);
            setError(null);
            
            // Close modal after showing success message
            setTimeout(() => {
              if (isComponentMounted) {
                onClose();
              }
            }, 2000);
          }
        } catch (error) {
          // Silently ignore connection errors during polling
        }
      };

      // Check connection status less frequently (every 5 seconds)
      const interval = setInterval(checkConnectionStatus, 5000);
      
      return () => {
        isComponentMounted = false;
        clearInterval(interval);
      };
    } else {
      // Reset state when closing
      setQrCode(null);
      setError(null);
      setQrTimestamp(null);
      setIsConnecting(false);
      setIsRequestInProgress(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <span className="mr-3">📱</span>
              Código QR de WhatsApp
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors duration-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isConnecting ? (
            <div className="text-center py-12">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <p className="text-green-600 mb-4 text-lg font-semibold">¡WhatsApp Conectado Exitosamente!</p>
              <div className="animate-pulse bg-green-100 rounded-xl p-4">
                <p className="text-green-700 text-sm">
                  Cerrando automáticamente en unos segundos...
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
              <p className="text-gray-600 mb-4">Generando código QR...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => fetchQRCode(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-colors duration-200 font-medium"
              >
                🔄 Reintentar
              </button>
            </div>
          ) : qrCode ? (
            <div className="text-center space-y-6">
              {/* QR Code */}
              <div className="relative inline-block">
                <img
                  src={qrCode}
                  alt="Código QR de WhatsApp"
                  className="w-64 h-64 mx-auto border-4 border-blue-200 rounded-2xl shadow-lg"
                />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                {qrTimestamp && (
                  <div className="absolute -bottom-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-lg">
                    {new Date(qrTimestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="font-semibold text-blue-900 mb-3">
                  📱 Escanea este código con WhatsApp
                </p>
                <div className="text-sm text-blue-700 space-y-2 text-left">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                    <span>Abre WhatsApp en tu teléfono</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                    <span>Ve a Menú → Dispositivos vinculados</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                    <span>Toca "Vincular un dispositivo"</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</span>
                    <span>Escanea este código QR</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => fetchQRCode(true)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl transition-colors duration-200 font-medium"
                >
                  🔄 Actualizar QR
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl transition-colors duration-200 font-medium"
                >
                  ✅ Cerrar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📱</div>
              <p className="text-gray-600 mb-6">No hay código QR disponible</p>
              <button
                onClick={() => fetchQRCode(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-colors duration-200 font-medium"
              >
                📱 Generar QR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
