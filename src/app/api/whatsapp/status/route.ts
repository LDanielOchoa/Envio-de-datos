import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '../../../../lib/whatsapp-service';

// Simple rate limiter
const lastCalls = new Map<string, number>();
const RATE_LIMIT_MS = 2000; // 2 segundos entre llamadas

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastCall = lastCalls.get(ip) || 0;
  
  if (now - lastCall < RATE_LIMIT_MS) {
    return false;
  }
  
  lastCalls.set(ip, now);
  return true;
}

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar rate limit
    const ip = request.ip || 'localhost';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Obtener parámetros de forma segura
    const forceQR = request.nextUrl.searchParams.get('forceQR') === 'true';
    // Priorizar sessionId del header, luego del query parameter
    const sessionId = request.headers.get('X-Session-Id') || 
                     request.nextUrl.searchParams.get('sessionId') || 
                     'default';
    
    console.log(`📱 OBTENIENDO ESTADO para sesión ${sessionId}...`);
    
    const whatsappService = WhatsAppService.getInstance(sessionId);
    
    if (forceQR) {
      console.log(`🔄 Forzando generación de QR para sesión ${sessionId}...`);
      await whatsappService.forceQRGeneration();
    } else {
      console.log(`📱 OBTENIENDO ESTADO SIN TOCAR QR para sesión ${sessionId}...`);
      // NO llamar refreshStatus - solo obtener estado actual
    }
    
    const status = whatsappService.getStatus();
    console.log(`📊 Estado PURO retornado para sesión ${sessionId}:`, {
      qrLength: status.qrCode?.length || 0,
      isConnected: status.isConnected
    });
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Error al obtener estado de WhatsApp:', error);
    
    // Aún así, intentar obtener el estado actual
    try {
      const sessionId = request.headers.get('X-Session-Id') || 
                       request.nextUrl.searchParams.get('sessionId') || 
                       'default';
      const whatsappService = WhatsAppService.getInstance(sessionId);
      const status = whatsappService.getStatus();
      
      return NextResponse.json({
        success: true,
        data: status,
        warning: 'Error en actualización, pero estado disponible'
      });
    } catch (statusError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener estado de WhatsApp'
        },
        { status: 500 }
      );
    }
  }
} 