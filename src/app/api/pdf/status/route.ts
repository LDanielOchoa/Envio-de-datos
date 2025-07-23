import { NextResponse } from 'next/server';
import { PDFService } from '../../../../lib/pdf-service';

export async function GET() {
    try {
        console.log('📄 Verificando estado del PDF por defecto...');
        
        const pdfExists = await PDFService.checkDefaultPDFExists();
        const pdfInfo = await PDFService.getPDFInfo();
        const isValidPDF = await PDFService.validatePDF();
        
        const status = {
            exists: pdfExists,
            info: pdfInfo,
            isValid: isValidPDF,
            config: PDFService.getDefaultPDFConfig()
        };
        
        console.log('✅ Estado del PDF verificado:', {
            exists: status.exists,
            size: status.info.size,
            isValid: status.isValid
        });
        
        return NextResponse.json({
            success: true,
            data: status
        });
        
    } catch (error) {
        console.error('❌ Error verificando estado del PDF:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
} 