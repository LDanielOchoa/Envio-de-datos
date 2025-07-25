import { NextResponse } from 'next/server';
import { read, utils } from 'xlsx';
import { Contact, SheetType } from '../../../../types';

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';
// Configurar timeout más largo para archivos grandes
export const maxDuration = 300; // 5 minutos
// Configurar límites de memoria
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export async function POST(request: Request) {
    try {
        console.log('🔍 Iniciando procesamiento de archivo Excel...');
        
        // Obtener el archivo del FormData
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const sheetType = formData.get('sheetType') as string || 'unitario';
        
        console.log(`📊 Tipo de hoja solicitada: ${sheetType}`);
        
        if (!file) {
            console.log('❌ No se proporcionó ningún archivo');
            return NextResponse.json({
                success: false,
                error: 'No se proporcionó ningún archivo'
            }, { status: 400 });
        }

        console.log(`📁 Archivo recibido: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        // Verificar que sea un archivo Excel
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            console.log('❌ Formato de archivo inválido');
            return NextResponse.json({
                success: false,
                error: 'El archivo debe ser un Excel (.xlsx o .xls)'
            }, { status: 400 });
        }

        // Convertir el archivo a ArrayBuffer
        console.log('📄 Convirtiendo archivo a ArrayBuffer...');
        const arrayBuffer = await file.arrayBuffer();
        
        // Leer el archivo Excel
        console.log('📊 Leyendo archivo Excel...');
        const workbook = read(arrayBuffer);
        
        // Determinar el nombre de la hoja según el tipo
        let sheetName = 'Contacto Col-Productiva07-07-25'; // Hoja por defecto
        
        if (sheetType === 'g29_30') {
            sheetName = 'G29&30'; // Hoja para grupos 29 y 30
            console.log(`📑 Modo GRUPOS activado, buscando hoja: ${sheetName}`);
        } else {
            console.log(`📑 Modo UNITARIO, buscando hoja: ${sheetName}`);
        }
        
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
            console.log(`❌ No se encontró la hoja "${sheetName}"`);
            return NextResponse.json({
                success: false,
                error: `No se encontró la hoja "${sheetName}". Hojas disponibles: ${Object.keys(workbook.Sheets).join(', ')}`
            }, { status: 400 });
        }
        
        // Convertir la hoja a JSON para facilitar el procesamiento
        console.log('🔄 Convirtiendo hoja a formato JSON...');
        const data = utils.sheet_to_json(worksheet, { header: 1 }) as any[];
        
        if (!data || data.length === 0) {
            console.log('❌ La hoja está vacía');
            return NextResponse.json({
                success: false,
                error: 'La hoja no contiene datos'
            }, { status: 400 });
        }

        console.log(`📊 Filas encontradas: ${data.length}`);
        
        // Liberar memoria del workbook
        delete (workbook as any).Sheets;
        
        // Procesar según el tipo de hoja
        if (sheetType === 'g29_30') {
            return processGroupContacts(data);
        } else {
            return processUnitaryContacts(data);
        }
        
    } catch (error) {
        console.error('❌ Error al procesar contactos:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}

// Función para procesar contactos unitarios (formato original)
function processUnitaryContacts(data: any[]) {
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
        return NextResponse.json({
            success: false,
            error: 'No se encontró la columna de teléfono'
        }, { status: 400 });
    }
    
    const contacts: Contact[] = [];
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
    
    return NextResponse.json({
        success: true,
        data: {
            contacts,
            total: contacts.length
        }
    });
}

// Función para procesar contactos por grupos (G29&30)
function processGroupContacts(data: any[]) {
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
        return NextResponse.json({
            success: false,
            error: 'No se encontraron todas las columnas necesarias (nombres beneficiario, apellidos beneficiario, teléfono, grupo)'
        }, { status: 400 });
    }
    
    const contacts: Contact[] = [];
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
        // Si tenemos la columna "Resultado Contacto", solo incluir "Sin contactar"
        // Si no tenemos la columna, incluir todos
        const incluirContacto = resultadoContactoIndex === -1 || resultadoContacto.toLowerCase() === 'sin contactar';
        
        if (incluirContacto) {
            // Formatear teléfono
            let formattedPhone = phone.replace(/\D/g, '');
            if (!formattedPhone.startsWith('57')) {
                formattedPhone = '57' + formattedPhone;
            }
            
            contacts.push({
                id: `contact_${rowIndex}`,
                name: nombres,
                lastName: apellidos,
                phone: formattedPhone,
                status: 'pending',
                group: group
            });
        }
        
        // Limitar a 500 contactos para evitar problemas de memoria
        if (contacts.length >= 500) {
            console.log('⚠️ [GRUPOS] Limitando a 500 contactos para evitar problemas de memoria');
            break;
        }
    }
    
    console.log(`📱 [GRUPOS] Total de contactos encontrados: ${contacts.length}`);
    
    return NextResponse.json({
        success: true,
        data: {
            contacts,
            total: contacts.length
        }
    });
}