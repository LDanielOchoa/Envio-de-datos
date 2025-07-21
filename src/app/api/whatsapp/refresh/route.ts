import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp-service';

export async function POST() {
  try {
    console.log('🔄 API: Refrescando cliente WhatsApp...');
    
    const whatsappService = WhatsAppService.getInstance();
    await whatsappService.refreshClient();
    
    // Obtener el estado después del refresh
    const status = whatsappService.getStatus();
    
    console.log('✅ API: Cliente refrescado');
    
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