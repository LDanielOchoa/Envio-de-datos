import { NextResponse } from 'next/server';
import { read, utils } from 'xlsx';
import { Contact } from '@/types';

export async function POST(request: Request) {
    try {
        console.log('🔍 Iniciando procesamiento de archivo Excel...');
        
        // Obtener el archivo del FormData
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
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
        
        // Obtener la hoja específica
        const sheetName = 'Contacto Col-Productiva07-07-25';
        console.log(`📑 Buscando hoja: ${sheetName}`);
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
            
            console.log(`   Fila ${rowIndex}: Teléfono=${phone}, Estado=${status}`);
            
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
                
                console.log(`✅ Contacto agregado: ${formattedPhone} (Fila ${rowIndex})`);
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
        
    } catch (error) {
        console.error('❌ Error al procesar contactos:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
} 