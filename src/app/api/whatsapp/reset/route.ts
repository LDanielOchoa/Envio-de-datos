import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp-service';

export async function POST() {
  try {
    console.log('🔄 API: Reiniciando WhatsApp completamente...');
    
    const whatsappService = WhatsAppService.getInstance();
    
    // Limpiar completamente el servicio
    await whatsappService.disconnect();
    
    // Limpiar archivos de autenticación
    try {
      const fs = require('fs');
      const path = require('path');
      const authPath = path.join(process.cwd(), '.wwebjs_auth');
      
      if (fs.existsSync(authPath)) {
        console.log('🗑️ API: Eliminando datos de autenticación...');
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('✅ API: Datos de autenticación eliminados');
      }
    } catch (error) {
      console.log('⚠️ API: Error limpiando autenticación:', error);
    }
    
    console.log('✅ API: WhatsApp reiniciado completamente');
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp reiniciado completamente - listo para nuevo QR'
    });
    
  } catch (error) {
    console.error('❌ API Error reiniciando WhatsApp:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 