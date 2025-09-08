import express from 'express';
import multer from 'multer';
import { read, utils } from 'xlsx';

const router = express.Router();

// Configurar multer para manejar archivos
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

// Endpoint para procesar archivos Excel
router.post('/process', upload.single('file'), async (req, res) => {
    try {
        console.log('🔍 Iniciando procesamiento de archivo Excel...');
        
        const file = req.file;
        const sheetType = req.body.sheetType || 'unitario';
        const selectedSheet = req.body.selectedSheet;
        
        console.log(`📊 Tipo de hoja solicitada: ${sheetType}`);
        console.log(`📋 Hoja seleccionada: ${selectedSheet}`);
        
        if (!file) {
            console.log('❌ No se proporcionó ningún archivo');
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo'
            });
        }

        console.log(`📁 Archivo recibido: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        // Verificar que sea un archivo Excel
        if (!file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
            console.log('❌ Formato de archivo inválido');
            return res.status(400).json({
                success: false,
                error: 'El archivo debe ser un Excel (.xlsx o .xls)'
            });
        }

        // Leer el archivo Excel desde el buffer
        console.log('📊 Leyendo archivo Excel...');
        const workbook = read(file.buffer);
        
        // Determinar el nombre de la hoja
        let sheetName;
        
        if (selectedSheet) {
            // Usar la hoja seleccionada por el usuario
            sheetName = selectedSheet;
            console.log(`📑 Usando hoja seleccionada: ${sheetName}`);
        } else {
            // Usar hojas por defecto si no se especifica
            if (sheetType === 'g29_30') {
                sheetName = 'G29&30'; // Hoja por defecto para grupos
                console.log(`📑 Modo GRUPOS (por defecto), buscando hoja: ${sheetName}`);
            } else {
                sheetName = 'Contacto Col-Productiva07-07-25'; // Hoja por defecto unitaria
                console.log(`📑 Modo UNITARIO (por defecto), buscando hoja: ${sheetName}`);
            }
        }
        
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
            console.log(`❌ No se encontró la hoja "${sheetName}"`);
            return res.status(400).json({
                success: false,
                error: `No se encontró la hoja "${sheetName}". Hojas disponibles: ${Object.keys(workbook.Sheets).join(', ')}`
            });
        }
        
        // Convertir la hoja a JSON para facilitar el procesamiento
        console.log('🔄 Convirtiendo hoja a formato JSON...');
        const data = utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!data || data.length === 0) {
            console.log('❌ La hoja está vacía');
            return res.status(400).json({
                success: false,
                error: 'La hoja no contiene datos'
            });
        }

        console.log(`📊 Filas encontradas: ${data.length}`);
        
        // Procesar según el tipo de hoja
        if (sheetType === 'g29_30') {
            return res.json(processGroupContacts(data));
        } else {
            return res.json(processUnitaryContacts(data));
        }
        
    } catch (error) {
        console.error('❌ Error al procesar contactos:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Error desconocido'
        });
    }
});

// Función para procesar contactos unitarios (formato original)
function processUnitaryContacts(data) {
    // Encontrar las columnas necesarias
    let phoneIndex = -1;
    let statusIndex = -1;
    
    // Buscar las columnas en las primeras filas
    console.log('🔍 Buscando columnas necesarias...');
    for (let rowIndex = 0; rowIndex < Math.min(5, data.length); rowIndex++) {
        const row = data[rowIndex];
        if (!Array.isArray(row)) continue;
        
        console.log(`📋 Analizando fila ${rowIndex}:`, row);
        
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const value = String(row[colIndex] || '').toLowerCase();
            console.log(`   Columna ${colIndex}: "${value}"`);
            
            if (value.includes('teléfonobeneficiario') || value.includes('telefonobeneficiario')) {
                phoneIndex = colIndex;
                statusIndex = colIndex + 2; // El estado está dos columnas después del teléfono
                console.log(`✅ Encontrada columna teléfono en posición ${colIndex} y estado en ${statusIndex}`);
            }
        }
        if (phoneIndex >= 0) break;
    }
    
    if (phoneIndex === -1) {
        console.log('❌ No se encontraron todas las columnas necesarias');
        return {
            success: false,
            error: 'No se encontró la columna de teléfono'
        };
    }
    
    const contacts = [];
    console.log('👥 Procesando contactos...');
    
    // Procesar las filas
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!Array.isArray(row) || !row[phoneIndex]) continue;
        
        const phone = String(row[phoneIndex]).trim();
        const status = row[statusIndex] ? String(row[statusIndex]).trim() : '';
        
        // Log de progreso cada 50 filas para archivos grandes
        if (rowIndex % 50 === 0) {
            console.log(`📊 Procesando fila ${rowIndex} de ${data.length} (${contacts.length} contactos válidos encontrados)`);
        }
        
        // Solo incluir si está sin contactar
        if (status === 'Sin contactar') {
            // Formatear teléfono
            let formattedPhone = phone.replace(/\D/g, '');
            if (!formattedPhone.startsWith('57')) {
                formattedPhone = '57' + formattedPhone;
            }
            
            contacts.push({
                id: `contact_${rowIndex}`,
                name: `Contacto ${rowIndex}`,
                phone: formattedPhone,
                status: 'pending'
            });
        }
        
        // Limitar a 500 contactos para evitar problemas de memoria
        if (contacts.length >= 500) {
            console.log('⚠️ Limitando a 500 contactos para evitar problemas de memoria');
            break;
        }
    }
    
    console.log(`📱 Total de contactos encontrados: ${contacts.length}`);
    
    return {
        success: true,
        data: {
            contacts,
            total: contacts.length
        }
    };
}

// Función para procesar contactos por grupos (G29&30)
function processGroupContacts(data) {
    // Encontrar las columnas necesarias para grupos
    let nombresIndex = -1;
    let apellidosIndex = -1;
    let phoneIndex = -1;
    let groupIndex = -1;
    let resultadoContactoIndex = -1;
    
    // Buscar las columnas en las primeras filas
    console.log('🔍 [GRUPOS] Buscando columnas necesarias...');
    for (let rowIndex = 0; rowIndex < Math.min(5, data.length); rowIndex++) {
        const row = data[rowIndex];
        if (!Array.isArray(row)) continue;
        
        console.log(`📋 [GRUPOS] Analizando fila ${rowIndex}:`, row);
        
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const value = String(row[colIndex] || '').toLowerCase().trim();
            console.log(`   [GRUPOS] Columna ${colIndex}: "${value}"`);
            
            if (value.includes('nombres beneficiario') || value === 'nombres beneficiario') {
                nombresIndex = colIndex;
                console.log(`✅ [GRUPOS] Encontrada columna "Nombres Beneficiario" en posición ${colIndex}`);
            } else if (value.includes('apellidos beneficiario') || value === 'apellidos beneficiario') {
                apellidosIndex = colIndex;
                console.log(`✅ [GRUPOS] Encontrada columna "Apellidos Beneficiario" en posición ${colIndex}`);
            } else if (value.includes('teléfono') || value.includes('telefono') || value === 'telefono') {
                phoneIndex = colIndex;
                console.log(`✅ [GRUPOS] Encontrada columna teléfono en posición ${colIndex}`);
            } else if (value.includes('grupo') || value === 'grupo') {
                groupIndex = colIndex;
                console.log(`✅ [GRUPOS] Encontrada columna grupo en posición ${colIndex}`);
            } else if (value.includes('resultado contacto') || value === 'resultado contacto') {
                resultadoContactoIndex = colIndex;
                console.log(`✅ [GRUPOS] Encontrada columna resultado contacto en posición ${colIndex}`);
            }
        }
        if (nombresIndex >= 0 && apellidosIndex >= 0 && phoneIndex >= 0 && groupIndex >= 0) break;
    }
    
    if (nombresIndex === -1 || apellidosIndex === -1 || phoneIndex === -1 || groupIndex === -1) {
        console.log('❌ [GRUPOS] No se encontraron todas las columnas necesarias');
        return {
            success: false,
            error: 'No se encontraron todas las columnas necesarias (nombres beneficiario, apellidos beneficiario, teléfono, grupo)'
        };
    }
    
    const contacts = [];
    console.log('👥 [GRUPOS] Procesando contactos por grupos...');
    
    // Procesar las filas
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!Array.isArray(row) || !row[phoneIndex]) continue;
        
        const nombres = row[nombresIndex] ? String(row[nombresIndex]).trim() : '';
        const apellidos = row[apellidosIndex] ? String(row[apellidosIndex]).trim() : '';
        const phone = String(row[phoneIndex]).trim();
        const group = row[groupIndex] ? String(row[groupIndex]).trim() : '';
        const resultadoContacto = resultadoContactoIndex >= 0 && row[resultadoContactoIndex] 
            ? String(row[resultadoContactoIndex]).trim() 
            : '';
        
        // Log de progreso cada 50 filas para archivos grandes
        if (rowIndex % 50 === 0) {
            console.log(`📊 [GRUPOS] Procesando fila ${rowIndex} de ${data.length} (${contacts.length} contactos válidos encontrados)`);
        }
        
        // Verificar si debemos incluir este contacto
        const resultadoLower = resultadoContacto.toLowerCase();
        const incluirContacto = resultadoContactoIndex === -1 || 
                               resultadoLower === 'sin contactar';
        
        // Verificar que tengamos datos mínimos válidos
        const tieneNombre = nombres && nombres.length > 0;
        const tieneApellido = apellidos && apellidos.length > 0;
        const tieneTelefono = phone && phone.length > 0;
        
        if (incluirContacto && tieneNombre && tieneTelefono) {
            // Formatear teléfono
            let formattedPhone = phone.replace(/\D/g, '');
            if (!formattedPhone.startsWith('57')) {
                formattedPhone = '57' + formattedPhone;
            }
            
            // Verificar que el teléfono tenga una longitud válida
            if (formattedPhone.length >= 10) {
                contacts.push({
                    id: `contact_${rowIndex}`,
                    name: nombres,
                    lastName: apellidos || '',
                    phone: formattedPhone,
                    status: 'pending',
                    group: group
                });
            }
        }
        
        // Limitar a 500 contactos para evitar problemas de memoria
        if (contacts.length >= 500) {
            console.log('⚠️ [GRUPOS] Limitando a 500 contactos para evitar problemas de memoria');
            break;
        }
    }
    
    console.log(`📱 [GRUPOS] Total de contactos encontrados: ${contacts.length}`);
    
    return {
        success: true,
        data: {
            contacts,
            total: contacts.length
        }
    };
}

export default router;
