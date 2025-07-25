// Implementación directa de eventos de conexión para evitar referencias circulares
import { WhatsAppStatus } from '../types';

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
  
  // Lista de conexiones a eliminar
  const connectionsToRemove = new Set<ReadableStreamDefaultController>();
  
  // Enviar a todas las conexiones activas
  connections.forEach(controller => {
    try {
      // Verificar si el controller está cerrado antes de enviar
      if (controller.desiredSize === null) {
        // Controller está cerrado, marcarlo para eliminación
        connectionsToRemove.add(controller);
        return;
      }
      
      controller.enqueue(encodedData);
    } catch (error: any) {
      // Si el error es por controller cerrado, no loguearlo como error
      if (error.code === 'ERR_INVALID_STATE' && error.message.includes('Controller is already closed')) {
        console.log('📡 Conexión SSE cerrada por el cliente, limpiando...');
      } else {
        console.log('❌ Error enviando SSE:', error.message);
      }
      connectionsToRemove.add(controller);
    }
  });
  
  // Limpiar conexiones cerradas
  connectionsToRemove.forEach(controller => {
    connections.delete(controller);
  });
  
  if (connectionsToRemove.size > 0) {
    console.log(`🧹 Limpiadas ${connectionsToRemove.size} conexiones cerradas. Activas: ${connections.size}`);
  }
}