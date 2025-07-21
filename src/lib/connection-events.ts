// Implementación directa de eventos de conexión para evitar referencias circulares
import { WhatsAppStatus } from '@/types';

// Store para mantener conexiones SSE activas
const connections = new Set<ReadableStreamDefaultController>();

// Función para agregar una nueva conexión
export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);
  console.log(`📡 Conexión SSE agregada. Total: ${connections.size}`);
}

// Función para eliminar una conexión
export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);
  console.log(`📡 Conexión SSE eliminada. Total: ${connections.size}`);
}

// Función para notificar a todas las conexiones SSE
export function notifyConnectionChange(status: WhatsAppStatus) {
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