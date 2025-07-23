import { NextResponse } from 'next/server';
import { WhatsAppService } from '../../../../lib/whatsapp-service';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const phone = formData.get('phone') as string;
        const message = formData.get('message') as string;
        
        // Obtener sessionId del header
        const sessionId = request.headers.get('X-Session-Id') || 'default';
        
        if (!phone || !message) {
            return NextResponse.json({
                success: false,
                error: 'Faltan datos requeridos (phone, message)'
            }, { status: 400 });
        }

        console.log(`🧪 [${sessionId}] Iniciando prueba de envío a ${phone}`);
        
        const whatsappService = WhatsAppService.getInstance(sessionId);
        
        // Verificar estado antes del envío
        const status = whatsappService.getStatus();
        console.log(`📊 [${sessionId}] Estado antes del envío:`, {
            isConnected: status.isConnected,
            phoneNumber: status.phoneNumber,
            hasQR: !!status.qrCode
        });
        
        if (!status.isConnected) {
            return NextResponse.json({
                success: false,
                error: 'WhatsApp no está conectado'
            }, { status: 400 });
        }

        // Intentar enviar el mensaje
        const success = await whatsappService.sendMessage(phone, message);
        
        if (success) {
            console.log(`✅ [${sessionId}] Mensaje de prueba enviado exitosamente`);
            return NextResponse.json({
                success: true,
                data: {
                    message: 'Mensaje enviado correctamente',
                    phone, 
                    sessionId
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Error al enviar mensaje'
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error('❌ Error en test-send:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
} 