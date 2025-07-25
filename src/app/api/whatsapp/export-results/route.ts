import { NextResponse } from 'next/server';
import { utils, write } from 'xlsx';
import { SendResults } from '../../../../types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        console.log('📊 Iniciando exportación de resultados a Excel...');
        
        const body = await request.json();
        const { results }: { results: SendResults } = body;
        
        if (!results || !results.results) {
            return NextResponse.json({
                success: false,
                error: 'No se proporcionaron resultados para exportar'
            }, { status: 400 });
        }
        
        console.log(`📈 Exportando ${results.results.length} resultados...`);
        
        // Preparar los datos para el Excel con estados simplificados
        const excelData = results.results.map((result, index) => {
            let statusText = '';
            
            switch (result.status) {
                case 'success':
                    statusText = 'Enviado';
                    break;
                case 'error':
                case 'invalid_number':
                case 'verifying_whatsapp':
                case 'has_whatsapp':
                    statusText = 'Sin WhatsApp';
                    break;
                default:
                    statusText = 'Sin WhatsApp';
            }
            
            return {
                'No.': index + 1,
                'ID Contacto': result.contactId,
                'Número de Teléfono': result.phone || 'No disponible',
                'Estado del Envío': statusText,
                'Error': result.error || (statusText === 'Sin WhatsApp' ? 'Número no registrado en WhatsApp' : 'N/A'),
                'Fecha de Procesamiento': new Date().toLocaleString('es-CO', {
                    timeZone: 'America/Bogota',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })
            };
        });
        
        // Agregar resumen simplificado al final
        const totalFailed = results.errorCount + results.invalidNumbersCount + results.verifiedWhatsappCount;
        const summaryData = [
            {},
            { 'No.': 'RESUMEN', 'ID Contacto': '', 'Número de Teléfono': '', 'Estado del Envío': '', 'Error': '', 'Fecha de Procesamiento': '' },
            { 'No.': 'Total de contactos:', 'ID Contacto': results.results.length, 'Número de Teléfono': '', 'Estado del Envío': '', 'Error': '', 'Fecha de Procesamiento': '' },
            { 'No.': 'Mensajes enviados:', 'ID Contacto': results.successCount, 'Número de Teléfono': '', 'Estado del Envío': '', 'Error': '', 'Fecha de Procesamiento': '' },
            { 'No.': 'Sin WhatsApp:', 'ID Contacto': totalFailed, 'Número de Teléfono': '', 'Estado del Envío': '', 'Error': '', 'Fecha de Procesamiento': '' }
        ];
        
        const finalData = [...excelData, ...summaryData];
        
        // Crear el libro de trabajo
        const worksheet = utils.json_to_sheet(finalData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Resultados de Envío');
        
        // Configurar el ancho de las columnas
        const columnWidths = [
            { wch: 5 },   // No.
            { wch: 20 },  // ID Contacto
            { wch: 18 },  // Número de Teléfono
            { wch: 25 },  // Estado del Envío
            { wch: 30 },  // Error
            { wch: 20 }   // Fecha de Procesamiento
        ];
        worksheet['!cols'] = columnWidths;
        
        // Generar el archivo Excel
        const excelBuffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Crear el nombre del archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `resultados-envio-${timestamp}.xlsx`;
        
        console.log(`✅ Archivo Excel generado: ${filename}`);
        
        // Retornar el archivo como respuesta
        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': excelBuffer.length.toString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error al generar archivo Excel:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido al generar Excel'
        }, { status: 500 });
    }
}