import { NextRequest } from 'next/server';
import { WhatsAppService } from '../../../../lib/whatsapp-service';
import { addConnection, removeConnection } from '../../../../lib/connection-events';

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('🔌 Nueva conexión SSE para eventos de WhatsApp');
  
  // Crear stream para Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Usar la función del módulo connection-events
      addConnection(controller);
      
      // Enviar estado inicial
      const whatsappService = WhatsAppService.getInstance();
      const status = whatsappService.getStatus();
      
      const eventData = `data: ${JSON.stringify({
        type: 'status',
        data: status,
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(eventData));
    },
    
    cancel(controller) {
      // Usar la función del módulo connection-events
      removeConnection(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
} 