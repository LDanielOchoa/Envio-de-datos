interface SendingProgress {
  sessionId: string;
  totalContacts: number;
  currentIndex: number;
  successCount: number;
  errorCount: number;
  invalidNumbersCount: number;
  verifiedWhatsappCount: number;
  isComplete: boolean;
  startTime: Date;
  lastUpdate: Date;
  results: Array<{
    contactId: string;
    contactName: string;
    status: 'pending' | 'sending' | 'success' | 'error' | 'invalid_number' | 'verifying_whatsapp' | 'has_whatsapp';
    phone: string;
    error?: string;
    timestamp: Date;
  }>;
}

class SendingProgressManager {
  private static instances: { [sessionId: string]: SendingProgress } = {};

  static initializeProgress(sessionId: string, totalContacts: number, contacts?: Array<{id: string, name: string, lastName: string, phone: string}>): void {
    console.log(`📊 [${sessionId}] Inicializando progreso para ${totalContacts} contactos`);
    
    // Crear lista inicial de contactos con estado 'pending'
    const initialResults = contacts ? contacts.map(contact => ({
      contactId: contact.id,
      contactName: `${contact.name} ${contact.lastName}`.trim(),
      status: 'pending' as const,
      phone: contact.phone,
      timestamp: new Date()
    })) : [];
    
    this.instances[sessionId] = {
      sessionId,
      totalContacts,
      currentIndex: 0,
      successCount: 0,
      errorCount: 0,
      invalidNumbersCount: 0,
      verifiedWhatsappCount: 0,
      isComplete: false,
      startTime: new Date(),
      lastUpdate: new Date(),
      results: initialResults
    };
    console.log(`📊 [${sessionId}] Progreso inicializado con ${initialResults.length} contactos en estado 'pending'. Instancias activas:`, Object.keys(this.instances));
  }

  static updateProgress(
    sessionId: string, 
    contactId: string, 
    contactName: string,
    phone: string, 
    status: 'success' | 'error' | 'invalid_number' | 'verifying_whatsapp' | 'has_whatsapp',
    error?: string
  ): void {
    const progress = this.instances[sessionId];
    if (!progress) {
      console.log(`⚠️ [${sessionId}] No se encontró progreso para actualizar. Instancias disponibles:`, Object.keys(this.instances));
      return;
    }

    console.log(`📊 [${sessionId}] Actualizando progreso para ${contactName} (${phone}) - Estado: ${status}`);

    // Buscar si el contacto ya existe en los resultados
    const existingIndex = progress.results.findIndex(result => result.contactId === contactId);
    
    if (existingIndex !== -1) {
      // Actualizar contacto existente
      const oldStatus = progress.results[existingIndex].status;
      progress.results[existingIndex] = {
        contactId,
        contactName,
        status,
        phone,
        error,
        timestamp: new Date()
      };
      
      // Solo incrementar currentIndex si el contacto estaba en 'pending'
      if (oldStatus === 'pending') {
        progress.currentIndex++;
      }
      
      console.log(`📊 [${sessionId}] Contacto actualizado de '${oldStatus}' a '${status}'`);
    } else {
      // Agregar nuevo resultado (caso de respaldo)
      progress.results.push({
        contactId,
        contactName,
        status,
        phone,
        error,
        timestamp: new Date()
      });
      progress.currentIndex++;
      console.log(`📊 [${sessionId}] Nuevo contacto agregado con estado '${status}'`);
    }

    // Actualizar contadores
    // Recalcular contadores basándose en el estado actual de todos los resultados
    progress.successCount = progress.results.filter(r => r.status === 'success').length;
    progress.errorCount = progress.results.filter(r => r.status === 'error').length;
    progress.invalidNumbersCount = progress.results.filter(r => r.status === 'invalid_number').length;
    progress.verifiedWhatsappCount = progress.results.filter(r => r.status === 'has_whatsapp').length;

    progress.lastUpdate = new Date();

    // Verificar si está completo (todos los contactos han sido procesados)
    const processedCount = progress.results.filter(r => r.status !== 'pending').length;
    if (processedCount >= progress.totalContacts) {
      progress.isComplete = true;
    }

    console.log(`📊 [${sessionId}] Progreso actualizado: ${processedCount}/${progress.totalContacts} | ✅ ${progress.successCount} | ❌ ${progress.errorCount} | ⚠️ ${progress.invalidNumbersCount} | 📱 ${progress.verifiedWhatsappCount}`);
    console.log(`📊 [${sessionId}] Total de resultados guardados: ${progress.results.length}`);
  }

  static getProgress(sessionId: string): SendingProgress | null {
    console.log(`🔍 [${sessionId}] Buscando progreso. Instancias disponibles:`, Object.keys(this.instances));
    const progress = this.instances[sessionId] || null;
    if (progress) {
      console.log(`✅ [${sessionId}] Progreso encontrado con ${progress.results.length} resultados`);
    } else {
      console.log(`❌ [${sessionId}] Progreso no encontrado`);
    }
    return progress;
  }

  static clearProgress(sessionId: string): void {
    delete this.instances[sessionId];
    console.log(`🗑️ [${sessionId}] Progreso eliminado`);
  }

  static markAsComplete(sessionId: string): void {
    const progress = this.instances[sessionId];
    if (progress) {
      progress.isComplete = true;
      progress.lastUpdate = new Date();
      console.log(`✅ [${sessionId}] Progreso marcado como completado`);
      
      // Programar limpieza automática después de 5 minutos
      setTimeout(() => {
        if (this.instances[sessionId]) {
          console.log(`🧹 [${sessionId}] Limpieza automática del progreso después de 5 minutos`);
          this.clearProgress(sessionId);
        }
      }, 5 * 60 * 1000); // 5 minutos
    }
  }

  static getAllProgress(): { [sessionId: string]: SendingProgress } {
    return this.instances;
  }
}

export { SendingProgressManager };
export type { SendingProgress };