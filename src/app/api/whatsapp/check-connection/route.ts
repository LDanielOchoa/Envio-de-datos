import { NextResponse } from 'next/server';
import { WhatsAppService } from '../../../../lib/whatsapp-service';

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🔍 Forzando verificación de conexión...');
    
    const whatsappService = WhatsAppService.getInstance();
    
    // Usar el método específico para verificar conexión
    const status = await whatsappService.forceConnectionCheck();
    
    console.log('📊 Estado después de verificación:', status);
    
    return NextResponse.json({
      success: true,
      data: status,
      message: status.isConnected ? 'WhatsApp conectado' : 'WhatsApp no conectado'
    });
  } catch (error) {
    console.error('❌ Error al verificar conexión:', error);
    
    // Aún así, intentar obtener el estado actual
    try {
      const whatsappService = WhatsAppService.getInstance();
      const status = whatsappService.getStatus();
      
      return NextResponse.json({
        success: true,
        data: status,
        message: 'Verificación completada con advertencias'
      });
    } catch (statusError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al verificar conexión'
        },
        { status: 500 }
      );
    }
  }
} 