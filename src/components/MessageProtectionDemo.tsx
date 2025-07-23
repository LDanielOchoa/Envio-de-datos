'use client';

import React from 'react';

export default function MessageProtectionDemo() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl mb-3 shadow-lg">
          <span className="text-xl text-white">🔒</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Sistema de Protección de Mensajes</h3>
        <p className="text-gray-600">La primera línea del mensaje está completamente protegida</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Antes */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">❌</span>
            Antes (Sin Protección)
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Usuario podía editar todo el mensaje</p>
            <p>• Riesgo de cambiar el formato oficial</p>
            <p>• Inconsistencias en los saludos</p>
            <p>• Errores accidentales</p>
          </div>
        </div>

        {/* Después */}
        <div className="bg-white rounded-xl p-4 border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">✅</span>
            Ahora (Con Protección)
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Primera línea completamente fija</p>
            <p>• Formato oficial garantizado</p>
            <p>• Personalización automática</p>
            <p>• Consistencia total</p>
          </div>
        </div>
      </div>

      {/* Ejemplo Visual */}
      <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Ejemplo Visual</h4>
        
        <div className="space-y-3">
          {/* Primera línea protegida */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-yellow-800">🔒 Primera línea (PROTEGIDA)</span>
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">NO EDITABLE</span>
            </div>
            <div className="bg-white border border-yellow-300 rounded p-2 text-gray-700 font-medium">
              Estimado/a {`{nombre_apellidos}`}
            </div>
          </div>

          {/* Resto editable */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              📝 Resto del mensaje (EDITABLE)
            </label>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-600 text-sm">
              Soy XX de la Universidad Nacional de Colombia...<br/>
              [El resto del mensaje se puede editar libremente]
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <h5 className="font-semibold text-green-800 text-sm">Consistencia</h5>
            <p className="text-xs text-green-700">Formato oficial garantizado</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <h5 className="font-semibold text-blue-800 text-sm">Eficiencia</h5>
            <p className="text-xs text-blue-700">Personalización automática</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🛡️</div>
            <h5 className="font-semibold text-purple-800 text-sm">Seguridad</h5>
            <p className="text-xs text-purple-700">Sin errores accidentales</p>
          </div>
        </div>
      </div>
    </div>
  );
} 