import React, { useState, useEffect } from 'react';
import { WhatsAppStatus, User } from '../types';
import QRModal from './QRModal';

interface WhatsAppSectionProps {
  whatsappStatus: WhatsAppStatus | null;
  qrLoading: boolean;
  isCheckingStatus: boolean;
  onForceRefresh: () => void;
  onReset: () => void;
  onGenerateQR: () => void;
  onRefreshClient: () => void;
  currentUser: User | null;
}

export default function WhatsAppSection({
  whatsappStatus,
  qrLoading,
  isCheckingStatus,
  onForceRefresh,
  onReset,
  onGenerateQR,
  onRefreshClient,
  currentUser
}: WhatsAppSectionProps) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string>('disconnected');
  const [backendPhoneNumber, setBackendPhoneNumber] = useState<string>('');

  // Update local state when props change (no more duplicate polling)
  useEffect(() => {
    // Use the status passed from parent component to avoid duplicate polling
    setBackendStatus(whatsappStatus?.isConnected ? 'connected' : 'disconnected');
    setBackendPhoneNumber(whatsappStatus?.phoneNumber || '');
  }, [whatsappStatus]);

  const handleGenerateQR = () => {
    setIsQRModalOpen(true);
  };

  // Determine connection state based on backend status
  const isConnected = backendStatus === 'connected';
  const isConnecting = backendStatus === 'connecting';
  const isQrReady = backendStatus === 'QR_READY';
  
  // Get appropriate status display
  const getStatusDisplay = () => {
    switch (backendStatus) {
      case 'connected':
        return {
          text: 'Conectado',
          color: 'green',
          bgClass: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
          dotClass: 'bg-green-500',
          textClass: 'text-green-800'
        };
      case 'connecting':
        return {
          text: 'Conectando...',
          color: 'yellow',
          bgClass: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200',
          dotClass: 'bg-yellow-500',
          textClass: 'text-yellow-800'
        };
      case 'QR_READY':
        return {
          text: 'QR Listo - Escanea con WhatsApp',
          color: 'blue',
          bgClass: 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200',
          dotClass: 'bg-blue-500',
          textClass: 'text-blue-800'
        };
      case 'error':
        return {
          text: 'Error de Conexión',
          color: 'red',
          bgClass: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
          dotClass: 'bg-red-500',
          textClass: 'text-red-800'
        };
      default:
        return {
          text: 'Desconectado',
          color: 'red',
          bgClass: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
          dotClass: 'bg-red-500',
          textClass: 'text-red-800'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-2xl text-white">📱</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Estado de WhatsApp</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Conecta tu WhatsApp para poder enviar mensajes oficiales de Colombia Productiva
        </p>
        {currentUser && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <span className="mr-1">👤</span>
            Sesión personal: {currentUser.name}
          </div>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Connection Status */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Estado de Conexión
            </h3>
          </div>
          
          <div className="p-6">
            <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${statusDisplay.bgClass}`}>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-4 h-4 ${statusDisplay.dotClass} rounded-full mr-3 ${isConnected || isConnecting || isQrReady ? 'animate-pulse' : ''}`}></div>
                  <span className={`font-semibold ${statusDisplay.textClass} text-lg`}>{statusDisplay.text}</span>
                </div>
                
                {isConnected && backendPhoneNumber && (
                  <div className="space-y-2">
                    <p className="flex items-center text-green-700">
                      <span className="font-medium mr-2">📱 Número:</span>
                      <span className="bg-green-100 px-3 py-1 rounded-full text-sm font-mono">
                        {backendPhoneNumber}
                      </span>
                    </p>
                    <p className="flex items-center text-sm text-green-700">
                      <span className="font-medium mr-2">🕒 Última conexión:</span>
                      <span>{new Date().toLocaleString()}</span>
                    </p>
                  </div>
                )}
                
                {isQrReady && (
                  <div className="space-y-2">
                    <p className="text-blue-700">
                      ✨ Código QR generado y listo para escanear
                    </p>
                    <p className="text-sm text-blue-600">
                      Haz clic en "📱 Generar QR" para ver el código
                    </p>
                  </div>
                )}
                
                {isConnecting && (
                  <div className="space-y-2">
                    <p className="text-yellow-700">
                      🔄 Estableciendo conexión con WhatsApp...
                    </p>
                    <p className="text-sm text-yellow-600">
                      Por favor espera un momento
                    </p>
                  </div>
                )}
                
                {!isConnected && !isConnecting && !isQrReady && (
                  <p className="text-red-700">
                    Escanea el código QR para conectar tu WhatsApp
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={onForceRefresh}
                disabled={isCheckingStatus}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isCheckingStatus ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </span>
                ) : (
                  '🔍 Verificar Estado'
                )}
              </button>
              
              <button
                onClick={onRefreshClient}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🔄 Refrescar Cliente
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={onReset}
                disabled={qrLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🔄 Reiniciar WhatsApp
              </button>
              
              <button
                onClick={handleGenerateQR}
                disabled={qrLoading}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {qrLoading ? '⏳ Generando...' : '📱 Generar QR'}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info Section - Only show when disconnected */}
        {!isConnected && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-100 px-6 py-4 border-b border-amber-200">
              <h3 className="text-xl font-semibold text-amber-900 flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                Información de Conexión
              </h3>
            </div>
            
            <div className="p-6">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">📱</div>
                <h4 className="text-lg font-semibold text-gray-900">WhatsApp Desconectado</h4>
                <p className="text-gray-600 mb-6">
                  Para conectar tu WhatsApp, haz clic en el botón "📱 Generar QR" y escanea el código que aparecerá en el modal.
                </p>
                
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="font-semibold text-amber-900 mb-2">
                    💡 Consejo
                  </p>
                  <p className="text-sm text-amber-700">
                    Una vez conectado, tu sesión se mantendrá activa para futuros usos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Info for Connected State */}
      {isConnected && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <h3 className="text-xl font-semibold text-green-900">Conexión Activa</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="font-medium text-green-800">Estado</p>
              <p className="text-green-600">✅ Conectado y listo</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="font-medium text-green-800">Número</p>
              <p className="text-green-600 font-mono">{backendPhoneNumber || 'Conectado'}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="font-medium text-green-800">Verificación</p>
              <p className="text-green-600">✅ Completada</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
          <span className="mr-3">📋</span>
          Instrucciones de Conexión
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
              <div>
                <p className="font-medium text-blue-900">Abre WhatsApp</p>
                <p className="text-blue-700 text-sm">En tu teléfono móvil</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
              <div>
                <p className="font-medium text-blue-900">Ve a Configuración</p>
                <p className="text-blue-700 text-sm">Menú → WhatsApp Web</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
              <div>
                <p className="font-medium text-blue-900">Escanea el QR</p>
                <p className="text-blue-700 text-sm">Apunta la cámara al código</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
              <div>
                <p className="font-medium text-blue-900">Espera la conexión</p>
                <p className="text-blue-700 text-sm">Se conectará automáticamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onGenerateQR={onGenerateQR}
      />
    </div>
  );
}