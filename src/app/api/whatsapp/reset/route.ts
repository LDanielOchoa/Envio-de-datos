import { NextResponse } from 'next/server';
import { WhatsAppService } from '../../../../lib/whatsapp-service';

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Obtener sessionId del header
    const sessionId = request.headers.get('X-Session-Id') || 'default';
    
    console.log(`🔄 API: Reiniciando WhatsApp completamente para sesión ${sessionId}...`);
    
    const whatsappService = WhatsAppService.getInstance(sessionId);
    
    // Limpiar completamente el servicio
    await whatsappService.disconnect();
    
    // Limpiar archivos de autenticación específicos de la sesión
    try {
      const fs = require('fs');
      const path = require('path');
      const authPath = path.join(process.cwd(), '.wwebjs_auth', sessionId);
      
      if (fs.existsSync(authPath)) {
        console.log(`🗑️ API: Eliminando datos de autenticación para sesión ${sessionId}...`);
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log(`✅ API: Datos de autenticación eliminados para sesión ${sessionId}`);
      }
    } catch (error) {
      console.log(`⚠️ API: Error limpiando autenticación para sesión ${sessionId}:`, error);
    }
    
    console.log(`✅ API: WhatsApp reiniciado completamente para sesión ${sessionId}`);
    
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