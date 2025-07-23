import { NextResponse } from 'next/server';
import { WhatsAppService } from '../../../../lib/whatsapp-service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId') || 'default';
        
        console.log(`🔍 [${sessionId}] Iniciando diagnóstico de sesión`);
        
        const whatsappService = WhatsAppService.getInstance(sessionId);
        const status = whatsappService.getStatus();
        
        // Información detallada del estado
        const diagnosis = {
            sessionId,
            timestamp: new Date().toISOString(),
            status: {
                isConnected: status.isConnected,
                phoneNumber: status.phoneNumber,
                lastSeen: status.lastSeen,
                hasQR: !!status.qrCode,
                qrLength: status.qrCode?.length || 0
            },
            client: {
                exists: !!whatsappService['client'],
                hasInfo: !!whatsappService['client']?.info,
                phoneNumber: whatsappService['client']?.info?.wid?.user || null,
                isReady: whatsappService['client']?.pupPage ? true : false
            },
            session: {
                isConnected: whatsappService['isConnected'],
                phoneNumber: whatsappService['phoneNumber'],
                lastSeen: whatsappService['lastSeen']
            }
        };
        
        console.log(`📊 [${sessionId}] Diagnóstico completado:`, diagnosis);
        
        return NextResponse.json({
            success: true,
            data: diagnosis
        });
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
} 