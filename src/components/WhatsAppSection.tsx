import React from 'react';
import { WhatsAppStatus, User } from '../types';

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
            <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
              whatsappStatus?.isConnected 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
            }`}>
              {whatsappStatus?.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="font-semibold text-green-800 text-lg">Conectado</span>
                  </div>
                  <div className="space-y-2 text-green-700">
                    <p className="flex items-center">
                      <span className="font-medium mr-2">📱 Número:</span>
                      <span className="bg-green-100 px-3 py-1 rounded-full text-sm font-mono">
                        {whatsappStatus.phoneNumber}
                      </span>
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="font-medium mr-2">🕒 Última conexión:</span>
                      <span>{whatsappStatus.lastSeen?.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                    <span className="font-semibold text-red-800 text-lg">Desconectado</span>
                  </div>
                  <p className="text-red-700">
                    Escanea el código QR para conectar tu WhatsApp
                  </p>
                </div>
              )}
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
                onClick={onGenerateQR}
                disabled={qrLoading}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {qrLoading ? '⏳ Generando...' : '📱 Generar QR'}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {!whatsappStatus?.isConnected && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
              <h3 className="text-xl font-semibold text-blue-900 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Código QR
              </h3>
            </div>
            
            <div className="p-6">
              <div className="text-center">
                {whatsappStatus?.qrCode ? (
                  <div className="space-y-6">
                    <div className="relative inline-block">
                      <img
                        src={whatsappStatus.qrCode}
                        alt="QR Code"
                        className="w-64 h-64 mx-auto border-4 border-blue-200 rounded-2xl shadow-2xl"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="font-semibold text-blue-900 mb-2">
                        📱 Escanea este código con WhatsApp
                      </p>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>1. Abre WhatsApp en tu teléfono</p>
                        <p>2. Toca Menú → WhatsApp Web</p>
                        <p>3. Escanea este código QR</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
                    <p className="text-gray-600 mb-4">Generando código QR...</p>
                    <button
                      onClick={onGenerateQR}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      ↻ Reintentar generación
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Info for Connected State */}
      {whatsappStatus?.isConnected && (
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
              <p className="text-green-600 font-mono">{whatsappStatus.phoneNumber}</p>
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
    </div>
  );
}