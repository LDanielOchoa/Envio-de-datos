import { NextResponse } from 'next/server';
import { WhatsAppService } from '../../../../lib/whatsapp-service';

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';

// Rate limiter específico para QR
const qrLastCalls = new Map<string, number>();
const QR_RATE_LIMIT_MS = 10000; // 10 segundos entre llamadas de QR

function checkQRRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastCall = qrLastCalls.get(ip) || 0;
  
  if (now - lastCall < QR_RATE_LIMIT_MS) {
    return false;
  }
  
  qrLastCalls.set(ip, now);
  return true;
}

export async function POST(request: Request) {
  try {
    // Verificar rate limit específico para QR
    const ip = (request as any).ip || 'localhost';
    if (!checkQRRateLimit(ip)) {
      console.log('⚠️ Rate limit de QR alcanzado');
      return NextResponse.json(
        { success: false, error: 'Demasiadas peticiones de QR. Espera 10 segundos.' },
        { status: 429 }
      );
    }

    console.log('🚀 API: Generando código QR DEFINITIVO...');
    
    const whatsappService = WhatsAppService.getInstance();
    
    try {
      // Usar el método DEFINITIVO que retorna el QR directamente
      const qrCode = await whatsappService.forceQRGeneration();
      
      console.log('🎉 API: QR recibido del servicio, longitud:', qrCode.length);
      
      // Obtener estado completo
      const status = whatsappService.getStatus();
      
      console.log('✅ API: Estado final confirmado:', {
        qrLength: status.qrCode ? status.qrCode.length : 0,
        isConnected: status.isConnected,
        hasQR: !!status.qrCode
      });
      
      return NextResponse.json({
        success: true,
        data: {
          isConnected: status.isConnected,
          qrCode: qrCode, // Usar QR directamente retornado
          phoneNumber: status.phoneNumber,
          lastSeen: status.lastSeen
        },
        message: 'Código QR generado exitosamente'
      });
      
    } catch (qrError) {
      // Si el error es que ya está conectado, es buena noticia
      if (qrError instanceof Error && qrError.message.includes('ya está conectado')) {
        console.log('✅ API: WhatsApp ya conectado, no necesita QR');
        
        const status = whatsappService.getStatus();
        return NextResponse.json({
          success: true,
          data: {
            isConnected: true,
            qrCode: '',
            phoneNumber: status.phoneNumber,
            lastSeen: status.lastSeen
          },
          message: 'WhatsApp ya está conectado - no necesita QR'
        });
      }
      
      // Re-lanzar otros errores
      throw qrError;
    }
  } catch (error) {
    console.error('❌ API ERROR:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al generar QR'
      },
      { status: 500 }
    );
  }
} 