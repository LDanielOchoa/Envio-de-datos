import React from 'react';

export default function InstructionsSection() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border border-blue-200 p-8 mb-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-2xl text-white">📚</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Guía de Uso del Sistema</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Sigue estos pasos para enviar mensajes de manera efectiva a los beneficiarios del programa
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pasos principales */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">🎯</span>
            Pasos Principales
          </h3>

          <div className="space-y-4">
            {/* Paso 1 */}
            <div className="flex items-start space-x-4 bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📱 Conectar WhatsApp</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Ve a la pestaña "WhatsApp" y escanea el código QR con tu teléfono
                </p>
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1">
                  <span className="mr-1">💡</span>
                  Asegúrate de mantener WhatsApp Web activo
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex items-start space-x-4 bg-white rounded-2xl p-6 shadow-lg border border-green-100">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📊 Cargar Contactos</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Sube el archivo Excel con los datos de los beneficiarios
                </p>
                <div className="flex items-center text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1">
                  <span className="mr-1">📋</span>
                  Formato: "Contacto Col-Productiva07-07-25"
                </div>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex items-start space-x-4 bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💬 Configurar Mensaje</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Selecciona la plantilla apropiada según el grupo de destino
                </p>
                <div className="flex items-center text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1">
                  <span className="mr-1">🎯</span>
                  Grupo 29: 7:00-9:00 AM | Grupo 30: 5:00-7:00 PM
                </div>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex items-start space-x-4 bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🚀 Enviar Mensajes</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Haz una prueba primero, luego envía a todos los contactos
                </p>
                <div className="flex items-center text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1">
                  <span className="mr-1">⚡</span>
                  Monitorea el progreso en tiempo real
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">ℹ️</span>
            Información Importante
          </h3>

          {/* Requisitos del archivo */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📋</span>
              Requisitos del Archivo Excel
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
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
                <span>Columnas requeridas: Nombres, Apellidos, Teléfono, Grupo</span>
              </div>
            </div>
          </div>

          {/* Grupos disponibles */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🏷️</span>
              Grupos de Cursos
            </h4>
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-green-900">Grupo 29</span>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Matutino</span>
                </div>
                <p className="text-sm text-green-700">
                  📅 Martes y Jueves | 🕖 7:00 AM - 9:00 AM
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-purple-900">Grupo 30</span>
                  <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">Vespertino</span>
                </div>
                <p className="text-sm text-purple-700">
                  📅 Martes y Jueves | 🕔 5:00 PM - 7:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* Consejos */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Consejos de Uso
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="text-yellow-500 mr-2 mt-0.5">⚡</span>
                <span>Siempre haz una prueba antes del envío masivo</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">📱</span>
                <span>Mantén WhatsApp Web activo durante el envío</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-0.5">👥</span>
                <span>Verifica que los contactos tengan el grupo correcto</span>
              </div>
              <div className="flex items-start">
                <span className="text-purple-500 mr-2 mt-0.5">📊</span>
                <span>Monitorea los logs para detectar problemas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">¿Listo para comenzar?</h3>
          <p className="text-blue-100 mb-4">
            Sigue los pasos anteriores para enviar mensajes de manera efectiva
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="mr-1">📱</span>
              <span>Conecta WhatsApp</span>
            </div>
            <div className="text-blue-300">→</div>
            <div className="flex items-center">
              <span className="mr-1">📊</span>
              <span>Carga contactos</span>
            </div>
            <div className="text-blue-300">→</div>
            <div className="flex items-center">
              <span className="mr-1">💬</span>
              <span>Envía mensajes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}