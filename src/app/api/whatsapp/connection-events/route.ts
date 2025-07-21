import { NextRequest } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp-service';

// Store para mantener conexiones SSE activas
const connections = new Set<ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  console.log('🔌 Nueva conexión SSE para eventos de WhatsApp');
  
  // Crear stream para Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      connections.add(controller);
      console.log(`📡 Conexión SSE agregada. Total: ${connections.size}`);
      
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
      connections.delete(controller);
      console.log(`📡 Conexión SSE eliminada. Total: ${connections.size}`);
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

// Función para notificar a todas las conexiones SSE
export function notifyConnectionChange(status: any) {
  console.log('📢 Notificando cambio de conexión a', connections.size, 'clientes');
  
  const eventData = `data: ${JSON.stringify({
    type: 'status_change',
    data: status,
    timestamp: new Date().toISOString()
  })}\n\n`;
  
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(eventData);
  
  // Enviar a todas las conexiones activas
  connections.forEach(controller => {
    try {
      controller.enqueue(encodedData);
    } catch (error) {
      console.log('❌ Error enviando SSE, eliminando conexión:', error);
      connections.delete(controller);
    }
  });
} 