import React from 'react';
import { Contact, SendResults } from '@/types';
import { messageTemplates, personalizeMessage } from '@/lib/message-templates';

interface MessagesSectionProps {
  message: string;
  setMessage: (message: string) => void;
  contacts: Contact[];
  results: SendResults | null;
  loading: boolean;
  selectedImage: File | null;
  imagePreview: string | null;
  whatsappStatus: any;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onLoadDefaultImage: () => void;
  onTestSend: () => void;
  onSendMessages: () => void;
}

export default function MessagesSection({
  message,
  setMessage,
  contacts,
  results,
  loading,
  selectedImage,
  imagePreview,
  whatsappStatus,
  onImageChange,
  onRemoveImage,
  onLoadDefaultImage,
  onTestSend,
  onSendMessages
}: MessagesSectionProps) {
  const [selectedTemplate, setSelectedTemplate] = React.useState('default');
  const [showTemplatePreview, setShowTemplatePreview] = React.useState(false);

  const handleTemplateChange = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.content);
    }
  };

  const getPreviewMessage = () => {
    if (contacts.length > 0) {
      const sampleContact = contacts[0];
      return personalizeMessage(message, sampleContact);
    }
    return message;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-2xl text-white">💬</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Envío de Mensajes</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Envía el mensaje oficial de Colombia Productiva sobre el curso de Gestión de Sostenibilidad
        </p>
      </div>

      {/* Message Templates Selector */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-blue-900 flex items-center">
            <span className="mr-3">📝</span>
            Plantillas de Mensajes
          </h3>
          <button
            onClick={() => setShowTemplatePreview(!showTemplatePreview)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {showTemplatePreview ? '🙈 Ocultar Vista Previa' : '👁️ Vista Previa'}
          </button>
        </div>
        
        {/* Template Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {messageTemplates.map((template) => (
            <div
              key={template.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
              onClick={() => handleTemplateChange(template.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
                {template.group && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Grupo {template.group}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 line-clamp-3">
                {template.content.substring(0, 100)}...
              </p>
              {selectedTemplate === template.id && (
                <div className="mt-2 flex items-center text-blue-600 text-xs">
                  <span className="mr-1">✅</span>
                  <span>Seleccionado</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Template Preview */}
        {showTemplatePreview && (
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                Vista Previa: {messageTemplates.find(t => t.id === selectedTemplate)?.name}
              </h4>
              {contacts.length > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  📝 Personalizado para: {contacts[0].name}
                </span>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {getPreviewMessage()}
              </p>
            </div>
          </div>
        )}
        
        {/* Template Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center text-sm text-blue-700">
            <span className="mr-2">📝</span>
            <span>{messageTemplates.length} plantillas disponibles</span>
          </div>
          <div className="flex items-center text-sm text-blue-700">
            <span className="mr-2">🎯</span>
            <span>Personalización automática</span>
          </div>
          <div className="flex items-center text-sm text-blue-700">
            <span className="mr-2">🏷️</span>
            <span>Específico por grupo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Message Composition */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Composición del Mensaje
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Message Textarea */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📝 Contenido del Mensaje
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="El mensaje aparecerá aquí al seleccionar una plantilla..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {message.length}/1000 caracteres
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  📱 {contacts.length} contactos listos
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📷 Imagen Adjunta (Opcional)
              </label>

              {!selectedImage ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto">
                          <span className="text-2xl">📷</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 mb-1">
                            Haz clic para subir imagen
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG hasta 5MB
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="text-center">
                    <div className="text-gray-400 text-sm mb-3">o</div>
                    <button
                      onClick={onLoadDefaultImage}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      📷 Cargar Imagen del Curso
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview!}
                      alt="Vista previa"
                      className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      onClick={onRemoveImage}
                      className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <span className="text-sm text-gray-700 font-medium">
                      📷 {selectedImage.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {(selectedImage.size / 1024 / 1024).toFixed(2)}MB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onTestSend}
                disabled={loading || !message.trim() || !whatsappStatus?.isConnected}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {selectedImage ? '🧪📷 Probar Mensaje con Imagen' : '🧪 Probar Mensaje'}
              </button>

              <button
                onClick={onSendMessages}
                disabled={loading || contacts.length === 0 || !message.trim() || !whatsappStatus?.isConnected}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-4 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enviando mensajes...
                  </span>
                ) : (
                  `📤 Enviar a ${contacts.length} contactos`
                )}
              </button>
            </div>

            {/* Message Status */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                <span className="mr-2">✅</span>
                Estado del Mensaje
              </h4>
              <div className="space-y-1 text-sm text-green-800">
                <div className="flex items-center">
                  <span className="mr-2">📝</span>
                  <span>Plantilla: {messageTemplates.find(t => t.id === selectedTemplate)?.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📄</span>
                  <span>Contenido: {message.length > 0 ? 'Listo' : 'Pendiente'}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📱</span>
                  <span>WhatsApp: {whatsappStatus?.isConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">👥</span>
                  <span>Contactos: {contacts.length} cargados</span>
                </div>
                {selectedImage && (
                  <div className="flex items-center">
                    <span className="mr-2">📷</span>
                    <span>Imagen: {selectedImage.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Resultados del Envío
            </h3>
          </div>

          <div className="p-6">
            {results ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 text-center">
                    <p className="text-3xl font-bold text-green-600 mb-1">{results.successCount}</p>
                    <p className="text-sm font-medium text-green-800">Exitosos</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 text-center">
                    <p className="text-3xl font-bold text-red-600 mb-1">{results.errorCount}</p>
                    <p className="text-sm font-medium text-red-800">Fallidos</p>
                  </div>
                </div>

                {/* Success Rate */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Tasa de Éxito</span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round((results.successCount / (results.successCount + results.errorCount)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(results.successCount / (results.successCount + results.errorCount)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Results List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <h4 className="font-medium text-gray-900 mb-3">Detalle de Envíos</h4>
                  {results.results.slice(0, 8).map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-xl text-sm border ${
                        result.status === 'success' 
                          ? 'bg-green-50 text-green-800 border-green-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {result.status === 'success' ? '✅' : '❌'} {result.contactId}
                        </span>
                        <span className="text-xs">
                          {result.status === 'success' ? 'Enviado' : 'Error'}
                        </span>
                      </div>
                      {result.error && (
                        <p className="text-xs mt-1 opacity-75">{result.error}</p>
                      )}
                    </div>
                  ))}
                  
                  {results.results.length > 8 && (
                    <div className="text-center py-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        ... y {results.results.length - 8} resultados más
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-gray-400">📊</span>
                </div>
                <p className="text-gray-500 font-medium mb-2">No hay resultados</p>
                <p className="text-gray-400 text-sm">
                  Los resultados aparecerán aquí después del envío
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}