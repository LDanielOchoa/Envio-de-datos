import React from 'react';

interface SheetSelectorModalProps {
  isOpen: boolean;
  sheets: string[];
  onClose: () => void;
  onSelectSheet: (sheetName: string) => void;
  title: string;
  description: string;
}

export default function SheetSelectorModal({
  isOpen,
  sheets,
  onClose,
  onSelectSheet,
  title,
  description
}: SheetSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-blue-100 text-sm mt-1">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {sheets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">📄</span>
              </div>
              <p className="text-gray-600">No se encontraron hojas en el archivo</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-700 mb-4">
                Selecciona la hoja que deseas usar:
              </p>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {sheets.map((sheet, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectSheet(sheet)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200">
                        <span className="text-white text-sm font-bold">
                          {(index + 1).toString()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-900">
                          {sheet}
                        </p>
                        <p className="text-sm text-gray-500">
                          Hoja {index + 1}
                        </p>
                      </div>
                      <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-lg">→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-xl hover:bg-gray-600 transition-colors duration-200 font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}