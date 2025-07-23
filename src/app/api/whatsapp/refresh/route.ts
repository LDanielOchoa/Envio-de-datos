import { NextResponse } from 'next/server';
import { WhatsAppService } from '../../../../lib/whatsapp-service';

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Obtener sessionId del header
    const sessionId = request.headers.get('X-Session-Id') || 'default';
    
    console.log(`🔄 API: Refrescando cliente WhatsApp para sesión ${sessionId}...`);
    
    const whatsappService = WhatsAppService.getInstance(sessionId);
    await whatsappService.refreshClient();
    
    // Obtener el estado después del refresh
    const status = whatsappService.getStatus();
    
    console.log(`✅ API: Cliente refrescado para sesión ${sessionId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Cliente WhatsApp refrescado',
      status: {
        isConnected: status.isConnected,
        phoneNumber: status.phoneNumber
      }
    });
    
  } catch (error) {
    console.error('❌ API Error refrescando cliente:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 