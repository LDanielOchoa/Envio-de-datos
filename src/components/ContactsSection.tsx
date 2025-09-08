import React from 'react';
import { Contact } from '../types';
import ContactsPreviewModal from './ContactsPreviewModal';
import SheetSelectorModal from './SheetSelectorModal';
import ErrorNotification from './ErrorNotification';

interface ContactsSectionProps {
  contacts: Contact[];
  loading: boolean;
  onContactsLoaded: (contacts: Contact[]) => void;
  onClearContacts: () => void;
  onFilterContacts: (filteredContacts: Contact[]) => void;
  onLoadError?: (error: string) => void; // Nueva prop para manejar errores desde el padre
}

export default function ContactsSection({
  contacts,
  loading,
  onContactsLoaded,
  onClearContacts,
  onFilterContacts,
  onLoadError
}: ContactsSectionProps) {
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [loadingType, setLoadingType] = React.useState<'individual' | 'groups' | null>(null);
  const [selectedGroup, setSelectedGroup] = React.useState<string>('all');
  const [showSheetSelector, setShowSheetSelector] = React.useState(false);
  const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingLoadType, setPendingLoadType] = React.useState<'individual' | 'groups' | null>(null);
  const [errorNotification, setErrorNotification] = React.useState<{
    isVisible: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
  }>({ isVisible: false, title: '', message: '', type: 'error' });
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);
  const [lastProcessedSheet, setLastProcessedSheet] = React.useState<string | null>(null);

  // Función para mostrar notificaciones de error
  const showError = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    setErrorNotification({
      isVisible: true,
      title,
      message,
      type
    });
    
    // Notificar al componente padre si es un error crítico
    if (type === 'error' && onLoadError) {
      onLoadError(`${title}: ${message}`);
    }
  };

  const hideError = () => {
    setErrorNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Función para procesar archivo Excel usando la API
  const processExcelFile = async (file: File, sheetName: string, sheetType: 'unitario' | 'g29_30') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheetType', sheetType);
      formData.append('selectedSheet', sheetName);

      const response = await fetch('http://localhost:3001/api/excel/process', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al procesar el archivo');
      }

      // Llamar al callback con los contactos procesados
      if (result.data && result.data.contacts) {
        onContactsLoaded(result.data.contacts);
        hideError(); // Ocultar cualquier error anterior
        setIsProcessingFile(false);
      } else {
        throw new Error('No se encontraron contactos válidos en el archivo');
      }

    } catch (error) {
      console.error('Error al procesar archivo Excel:', error);
      const { title, message } = getSpecificErrorMessage(error);
      showError(title, message, 'error');
      setIsProcessingFile(false);
      throw error;
    }
  };

  // Función para obtener mensajes de error específicos
  const getSpecificErrorMessage = (error: any): { title: string; message: string } => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Errores específicos de formato
    if (errorMessage.includes('no contiene hojas')) {
      return {
        title: 'Archivo Excel vacío',
        message: 'El archivo seleccionado no contiene hojas válidas. Asegúrese de que el archivo Excel tenga al menos una hoja con datos.'
      };
    }
    
    if (errorMessage.includes('no contiene hojas con datos')) {
      return {
        title: 'Sin datos válidos',
        message: 'Las hojas del archivo Excel están vacías. Asegúrese de que al menos una hoja contenga datos en las columnas requeridas (Nombre, Teléfono, etc.).'
      };
    }
    
    if (errorMessage.includes('corrupto') || errorMessage.includes('dañado')) {
      return {
        title: 'Archivo corrupto',
        message: 'El archivo parece estar corrupto o dañado. Intente guardar el archivo nuevamente desde Excel o use una copia de respaldo.'
      };
    }
    
    if (errorMessage.includes('Formato de archivo no válido')) {
      return {
        title: 'Formato incorrecto',
        message: errorMessage + '. Por favor, use únicamente archivos de Excel (.xlsx o .xls).'
      };
    }
    
    if (errorMessage.includes('demasiado grande')) {
      return {
        title: 'Archivo muy grande',
        message: errorMessage + '. Considere dividir los datos en archivos más pequeños o eliminar columnas innecesarias.'
      };
    }
    
    // Errores de red o servidor
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor. Verifique su conexión a internet e intente nuevamente.'
      };
    }
    
    // Errores de columnas faltantes
     if (errorMessage.includes('columna') || errorMessage.includes('campo')) {
       return {
         title: 'Datos incompletos',
         message: errorMessage + '. Verifique que el archivo contenga las columnas requeridas: Nombre, Teléfono, y opcionalmente Gestor y Estado.'
       };
     }
     
     // Errores de datos no encontrados
     if (errorMessage.includes('no se encontr') || errorMessage.includes('sin datos') || errorMessage.includes('vacío')) {
       return {
         title: 'No se encontraron datos',
         message: 'No se encontraron contactos válidos en el archivo. Verifique que: 1) La hoja seleccionada contenga datos, 2) Las columnas "Nombre" y "Teléfono" tengan información válida, 3) No haya filas completamente vacías.'
       };
     }
     
     // Errores de formato de teléfono
     if (errorMessage.includes('teléfono') || errorMessage.includes('número')) {
       return {
         title: 'Formato de teléfono inválido',
         message: 'Se encontraron números de teléfono con formato incorrecto. Asegúrese de que los teléfonos estén en formato válido (ej: +57 300 123 4567 o 3001234567).'
       };
     }
     
     // Errores de nombres vacíos
     if (errorMessage.includes('nombre') || errorMessage.includes('contacto')) {
       return {
         title: 'Nombres faltantes',
         message: 'Se encontraron contactos sin nombre válido. Verifique que la columna "Nombre" contenga información para todos los contactos.'
       };
     }
    
    // Error genérico
     return {
       title: 'Error al procesar archivo',
       message: `Se produjo un error inesperado: ${errorMessage}. Si el problema persiste, contacte al administrador del sistema.`
     };
   };

   // Función para mostrar consejos útiles
   const showHelpTip = (type: 'format' | 'data' | 'size') => {
      let title = '';
      let message = '';
      
      switch (type) {
        case 'format':
          title = '💡 Consejo: Formato de archivo';
          message = 'Para mejores resultados, asegúrese de que su archivo Excel tenga las columnas: "Nombre" (obligatorio), "Teléfono" (obligatorio), "Gestor" (opcional), "Estado" (opcional).';
          break;
        case 'data':
          title = '💡 Consejo: Estructura de datos';
          message = 'Verifique que la primera fila contenga los encabezados de las columnas y que no haya filas completamente vacías entre los datos.';
          break;
        case 'size':
          title = '💡 Consejo: Tamaño de archivo';
          message = 'Para archivos grandes, considere dividir los contactos en múltiples archivos de máximo 1000 contactos cada uno para un mejor rendimiento.';
          break;
      }
      
      showError(title, message, 'info');
    };

    // Función para mostrar errores específicos de carga vacía
     const showNoDataFoundError = (sheetName?: string, loadType: 'individual' | 'groups' = 'individual') => {
       const sheetInfo = sheetName ? ` en la hoja "${sheetName}"` : '';
       const typeText = loadType === 'individual' ? 'contactos individuales' : 'grupos de contactos';
       
       showError(
         '❌ No se encontraron datos',
         `No se pudieron cargar ${typeText}${sheetInfo}. Posibles causas:\n\n` +
         '• La hoja seleccionada está vacía\n' +
         '• Faltan las columnas requeridas (Nombre, Teléfono)\n' +
         '• Los datos no tienen el formato correcto\n' +
         '• Todas las filas están vacías\n\n' +
         'Verifique el archivo y vuelva a intentar.',
         'error'
       );
       setIsProcessingFile(false);
     };

     // Función para verificar si se cargaron datos después del procesamiento
     const checkDataLoaded = (sheetName: string, loadType: 'individual' | 'groups', delay: number = 2000) => {
       setTimeout(() => {
         if (isProcessingFile && lastProcessedSheet === sheetName && contacts.length === 0) {
           showNoDataFoundError(sheetName, loadType);
         } else if (contacts.length > 0) {
           hideError(); // Ocultar mensaje de carga si fue exitoso
           setIsProcessingFile(false);
         }
       }, delay);
     };

  // Función para validar archivos Excel
  const validateExcelFile = (file: File): { isValid: boolean; error?: string } => {
    // Validar extensión
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls). Archivo seleccionado: ${fileExtension}`
      };
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Tamaño máximo permitido: 10MB. Tamaño del archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    return { isValid: true };
  };

  // Función para leer las hojas disponibles del archivo Excel
  const readExcelSheets = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          
          // Verificar que el archivo no esté vacío
          if (data.length === 0) {
            reject(new Error('El archivo está vacío o corrupto'));
            return;
          }
          
          // Importar XLSX dinámicamente
          import('xlsx').then((XLSX) => {
            try {
              const workbook = XLSX.read(data, { type: 'array' });
              
              // Verificar que el workbook tenga hojas
              if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                reject(new Error('El archivo Excel no contiene hojas válidas'));
                return;
              }
              
              // Verificar que las hojas no estén vacías
              const validSheets = workbook.SheetNames.filter(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
                return range.e.r > 0 || range.e.c > 0; // Tiene al menos una celda con datos
              });
              
              if (validSheets.length === 0) {
                reject(new Error('El archivo Excel no contiene hojas con datos válidos'));
                return;
              }
              
              resolve(workbook.SheetNames);
            } catch (xlsxError) {
              reject(new Error(`Error al procesar el archivo Excel: ${xlsxError instanceof Error ? xlsxError.message : 'Formato no válido'}`));
            }
          }).catch((importError) => {
            reject(new Error(`Error al cargar la librería Excel: ${importError instanceof Error ? importError.message : 'Error desconocido'}`));
          });
        } catch (error) {
          reject(new Error(`Error al leer el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo. El archivo puede estar corrupto o dañado.'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const handleIndividualFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar archivo
      const validation = validateExcelFile(file);
      if (!validation.isValid) {
        showError('Archivo no válido', validation.error || 'Error desconocido', 'error');
        e.target.value = ''; // Limpiar el input
        return;
      }

      try {
        showError('Procesando archivo...', 'Leyendo hojas disponibles del archivo Excel', 'info');
        const sheets = await readExcelSheets(file);
        hideError();
        
        if (sheets.length === 1) {
          // Si solo hay una hoja, usarla directamente
          setIsProcessingFile(true);
          setLastProcessedSheet(sheets[0]);
          showError('Cargando contactos...', `Procesando hoja: ${sheets[0]}`, 'info');
          setLoadingType('individual');
          try {
            processExcelFile(file, sheets[0], 'unitario');
            checkDataLoaded(sheets[0], 'individual');
          } catch (loadError) {
            const { title, message } = getSpecificErrorMessage(loadError);
            showError(title, `${message} (Hoja: "${sheets[0]}")`, 'error');
            setIsProcessingFile(false);
          }
        } else {
          // Si hay múltiples hojas, mostrar selector
          setAvailableSheets(sheets);
          setPendingFile(file);
          setPendingLoadType('individual');
          setShowSheetSelector(true);
        }
      } catch (error) {
        console.error('Error al leer las hojas del archivo:', error);
        const { title, message } = getSpecificErrorMessage(error);
        showError(title, message, 'error');
      }
    }
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  const handleGroupFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar archivo
      const validation = validateExcelFile(file);
      if (!validation.isValid) {
        showError('Archivo no válido', validation.error || 'Error desconocido', 'error');
        e.target.value = ''; // Limpiar el input
        return;
      }

      try {
        showError('Procesando archivo...', 'Leyendo hojas disponibles del archivo Excel', 'info');
        const sheets = await readExcelSheets(file);
        hideError();
        
        if (sheets.length === 1) {
          // Si solo hay una hoja, usarla directamente
          setIsProcessingFile(true);
          setLastProcessedSheet(sheets[0]);
          showError('Cargando contactos por grupos...', `Procesando hoja: ${sheets[0]}`, 'info');
          setLoadingType('groups');
          try {
            processExcelFile(file, sheets[0], 'g29_30');
            checkDataLoaded(sheets[0], 'groups');
          } catch (loadError) {
            const { title, message } = getSpecificErrorMessage(loadError);
            showError(title, `${message} (Hoja: "${sheets[0]}")`, 'error');
            setIsProcessingFile(false);
          }
        } else {
          // Si hay múltiples hojas, mostrar selector
          setAvailableSheets(sheets);
          setPendingFile(file);
          setPendingLoadType('groups');
          setShowSheetSelector(true);
        }
      } catch (error) {
        console.error('Error al leer las hojas del archivo:', error);
        const { title, message } = getSpecificErrorMessage(error);
        showError(title, message, 'error');
      }
    }
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  const handleSheetSelection = async (sheetName: string) => {
    if (pendingFile && pendingLoadType) {
      try {
        setLoadingType(pendingLoadType);
        setIsProcessingFile(true);
        setLastProcessedSheet(sheetName);
        if (pendingLoadType === 'individual') {
          showError('Cargando contactos...', `Procesando hoja seleccionada: ${sheetName}`, 'info');
          processExcelFile(pendingFile, sheetName, 'unitario');
          checkDataLoaded(sheetName, 'individual', 2500);
        } else {
          showError('Cargando contactos por grupos...', `Procesando hoja seleccionada: ${sheetName}`, 'info');
          processExcelFile(pendingFile, sheetName, 'g29_30');
          checkDataLoaded(sheetName, 'groups', 2500);
        }
      } catch (error) {
        const { title, message } = getSpecificErrorMessage(error);
        showError(
          title,
          `${message} (Hoja: "${sheetName}")`,
          'error'
        );
        setIsProcessingFile(false);
      }
    }
    // Limpiar estado del modal
    setShowSheetSelector(false);
    setAvailableSheets([]);
    setPendingFile(null);
    setPendingLoadType(null);
  };

  const handleSheetSelectorClose = () => {
    setShowSheetSelector(false);
    setAvailableSheets([]);
    setPendingFile(null);
    setPendingLoadType(null);
  };

  React.useEffect(() => {
    if (!loading) {
      setLoadingType(null);
    }
  }, [loading]);

  // Filtrar contactos por grupo seleccionado
  React.useEffect(() => {
    if (selectedGroup === 'all') {
      onFilterContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => contact.group === selectedGroup);
      onFilterContacts(filtered);
    }
  }, [selectedGroup, contacts, onFilterContacts]);

  const getContactStats = () => {
    const total = contacts.length;
    const grupo29 = contacts.filter(c => c.group === '29').length;
    const grupo30 = contacts.filter(c => c.group === '30').length;
    const unique = new Set(contacts.map(c => c.phone)).size;
    
    return { total, grupo29, grupo30, unique };
  };

  const stats = getContactStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-2xl text-white">📊</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Contactos</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Carga y gestiona los contactos desde archivos Excel para el envío de mensajes
        </p>
      </div>

      {/* Stats Cards */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Contactos</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Grupo 29</p>
                <p className="text-3xl font-bold text-green-900">{stats.grupo29}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏷️</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Grupo 30</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.grupo30}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏷️</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Únicos</p>
                <p className="text-3xl font-bold text-purple-900">{stats.unique}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📱</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtro por grupo */}
      {contacts.length > 0 && stats.grupo29 + stats.grupo30 > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
            <h3 className="text-xl font-semibold text-purple-900 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Filtrar por Grupo
            </h3>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedGroup === 'all'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👥 Todos los Contactos ({stats.total})
              </button>
              
              {stats.grupo29 > 0 && (
                <button
                  onClick={() => setSelectedGroup('29')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedGroup === '29'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏷️ Grupo 29 ({stats.grupo29})
                </button>
              )}
              
              {stats.grupo30 > 0 && (
                <button
                  onClick={() => setSelectedGroup('30')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedGroup === '30'
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏷️ Grupo 30 ({stats.grupo30})
                </button>
              )}
            </div>
            
            <div className="mt-4 text-center text-gray-600">
              <p>
                {selectedGroup === 'all' 
                  ? 'Mostrando todos los contactos' 
                  : `Mostrando solo contactos del grupo ${selectedGroup}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Individual Contacts Upload */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Carga Individual
            </h3>
          </div>

          <div className="p-6">
            <div className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden ${
              loading && loadingType === 'individual'
                ? 'border-yellow-300 bg-yellow-50' 
                : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
            }`}>
              {loading && loadingType === 'individual' && (
                <div className="absolute inset-0 bg-yellow-50 bg-opacity-95 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-yellow-800 font-medium">Procesando archivo...</p>
                    <p className="text-yellow-600 text-sm mt-1">Por favor espera</p>
                    
                    {/* Barra de progreso animada */}
                    <div className="mt-4 w-48 bg-yellow-200 rounded-full h-2 mx-auto">
                      <div className="bg-yellow-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    
                    <div className="mt-2 text-xs text-yellow-600">
                      💡 Tip: Los archivos grandes pueden tomar más tiempo
                    </div>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleIndividualFileChange}
                className="hidden"
                id="individual-excel-upload"
                disabled={loading && loadingType === 'individual'}
              />
              
              <label htmlFor="individual-excel-upload" className="cursor-pointer block">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-3xl text-white">📊</span>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-blue-900 mb-2">
                      {loading && loadingType === 'individual' ? 'Procesando archivo...' : 'Carga Individual'}
                    </p>
                    <p className="text-blue-700 mb-4">
                      Selecciona archivo Excel y elige la hoja
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200">
                      📁 Examinar archivos
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* File Requirements */}
            <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Requisitos - Carga Individual
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Selecciona cualquier hoja del archivo</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Gestor: "Cyndi" (opcional)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Estado: "Sin contactar" (opcional)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Formato: .xlsx o .xls</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => showHelpTip('format')}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  💡 Formato
                </button>
                <button
                  type="button"
                  onClick={() => showHelpTip('data')}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                >
                  📊 Estructura
                </button>
                <button
                  type="button"
                  onClick={() => showHelpTip('size')}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                >
                  📏 Tamaño
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Group Contacts Upload */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
            <h3 className="text-xl font-semibold text-green-900 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Carga por Grupos
            </h3>
          </div>

          <div className="p-6">
            <div className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden ${
              loading && loadingType === 'groups'
                ? 'border-yellow-300 bg-yellow-50' 
                : 'border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-100'
            }`}>
              {loading && loadingType === 'groups' && (
                <div className="absolute inset-0 bg-yellow-50 bg-opacity-95 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-yellow-800 font-medium">Procesando archivo por grupos...</p>
                    <p className="text-yellow-600 text-sm mt-1">Por favor espera</p>
                    
                    {/* Barra de progreso animada */}
                    <div className="mt-4 w-48 bg-yellow-200 rounded-full h-2 mx-auto">
                      <div className="bg-yellow-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                    </div>
                    
                    <div className="mt-2 text-xs text-yellow-600">
                      💡 Tip: Procesando grupos y validando datos
                    </div>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleGroupFileChange}
                className="hidden"
                id="group-excel-upload"
                disabled={loading && loadingType === 'groups'}
              />
              
              <label htmlFor="group-excel-upload" className="cursor-pointer block">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-3xl text-white">🏷️</span>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-green-900 mb-2">
                      {loading && loadingType === 'groups' ? 'Procesando archivo...' : 'Carga por Grupos'}
                    </p>
                    <p className="text-green-700 mb-4">
                      Selecciona archivo Excel y elige la hoja
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors duration-200">
                      🏷️ Examinar archivos
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Group File Requirements */}
            <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Requisitos - Carga por Grupos
              </h4>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Selecciona cualquier hoja del archivo</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Columnas: Nombres, Apellidos, Teléfono, Grupo, Gestor, Resultado Contacto</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Grupos: Cualquier grupo disponible</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Formato: .xlsx o .xls</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => showHelpTip('format')}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                >
                  💡 Formato
                </button>
                <button
                  type="button"
                  onClick={() => showHelpTip('data')}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  📊 Estructura
                </button>
                <button
                  type="button"
                  onClick={() => showHelpTip('size')}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                >
                  📏 Tamaño
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Button */}
      {contacts.length > 0 && (
        <div className="text-center">
          <button
            onClick={onClearContacts}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            🧹 Limpiar Lista de Contactos
          </button>
        </div>
      )}
      {/* Contacts Preview */}
      {contacts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Vista Previa de Contactos
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {contacts.slice(0, 10).map((contact, index) => (
                    <div key={contact.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {contact.name} {contact.lastName || ''}
                              </p>
                              <p className="text-sm text-gray-600 font-mono">{contact.phone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {contact.group && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🏷️ Grupo {contact.group}
                              </span>
                            )}
                            {contact.gestor && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                👤 {contact.gestor}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Válido
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {contacts.length > 10 && (
                    <div className="text-center py-4 border-t border-gray-200">
                      <p className="text-gray-500 font-medium mb-3">
                        ... y {contacts.length - 10} contactos más
                      </p>
                      <button
                        onClick={() => setShowPreviewModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        👁️ Ver Todos los Contactos
                      </button>
                    </div>
                  )}
                </div>
                
                {/* View All Button for smaller lists */}
                {contacts.length > 0 && contacts.length <= 10 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      👁️ Vista Detallada
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Column Format Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Individual Format */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <span className="mr-3">📋</span>
            Formato Individual
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-blue-100 rounded-lg">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900 rounded-l-lg">Nombres</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Apellidos</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Teléfono</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900 rounded-r-lg">Grupo</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b border-blue-200">
                  <td className="px-3 py-2 text-xs text-gray-900">Juan Carlos</td>
                  <td className="px-3 py-2 text-xs text-gray-900">Pérez López</td>
                  <td className="px-3 py-2 text-xs text-gray-900 font-mono">3001234567</td>
                  <td className="px-3 py-2 text-xs text-gray-900">29</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Group Format */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200 p-6">
          <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
            <span className="mr-3">🏷️</span>
            Formato por Grupos (G29&30)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-green-100 rounded-lg">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900 rounded-l-lg">Nombres</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900">Apellidos</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900">Teléfono</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900">Grupo</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900">Gestor</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-green-900 rounded-r-lg">Resultado</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b border-green-200">
                  <td className="px-2 py-2 text-xs text-gray-900">Gloria Beatriz</td>
                  <td className="px-2 py-2 text-xs text-gray-900">Noguera</td>
                  <td className="px-2 py-2 text-xs text-gray-900 font-mono">3207207924</td>
                  <td className="px-2 py-2 text-xs text-gray-900">29</td>
                  <td className="px-2 py-2 text-xs text-gray-900">Cyndi</td>
                  <td className="px-2 py-2 text-xs text-gray-900">Se envía mensaje</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Error Notification */}
      <ErrorNotification
        isVisible={errorNotification.isVisible}
        title={errorNotification.title}
        message={errorNotification.message}
        type={errorNotification.type}
        onClose={hideError}
      />

      {/* Contacts Preview Modal */}
      <ContactsPreviewModal
        isOpen={showPreviewModal}
        contacts={contacts}
        onClose={() => setShowPreviewModal(false)}
      />

      {/* Sheet Selector Modal */}
      <SheetSelectorModal
        isOpen={showSheetSelector}
        sheets={availableSheets}
        onClose={handleSheetSelectorClose}
        onSelectSheet={handleSheetSelection}
        title={pendingLoadType === 'individual' ? '📊 Seleccionar Hoja - Carga Individual' : '🏷️ Seleccionar Hoja - Carga por Grupos'}
        description={pendingLoadType === 'individual' 
          ? 'Elige la hoja que contiene los contactos individuales'
          : 'Elige la hoja que contiene los contactos organizados por grupos'
        }
      />
    </div>
  );
}