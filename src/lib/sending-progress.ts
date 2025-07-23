interface SendingProgress {
  sessionId: string;
  totalContacts: number;
  currentIndex: number;
  successCount: number;
  errorCount: number;
  invalidNumbersCount: number;
  isComplete: boolean;
  startTime: Date;
  lastUpdate: Date;
  results: Array<{
    contactId: string;
    contactName: string;
    status: 'pending' | 'sending' | 'success' | 'error' | 'invalid_number';
    phone: string;
    error?: string;
    timestamp: Date;
  }>;
}

class SendingProgressManager {
  private static instances: { [sessionId: string]: SendingProgress } = {};

  static initializeProgress(sessionId: string, totalContacts: number): void {
    console.log(`📊 [${sessionId}] Inicializando progreso para ${totalContacts} contactos`);
    this.instances[sessionId] = {
      sessionId,
      totalContacts,
      currentIndex: 0,
      successCount: 0,
      errorCount: 0,
      invalidNumbersCount: 0,
      isComplete: false,
      startTime: new Date(),
      lastUpdate: new Date(),
      results: []
    };
    console.log(`📊 [${sessionId}] Progreso inicializado. Instancias activas:`, Object.keys(this.instances));
  }

  static updateProgress(
    sessionId: string, 
    contactId: string, 
    contactName: string,
    phone: string, 
    status: 'success' | 'error' | 'invalid_number',
    error?: string
  ): void {
    const progress = this.instances[sessionId];
    if (!progress) {
      console.log(`⚠️ [${sessionId}] No se encontró progreso para actualizar. Instancias disponibles:`, Object.keys(this.instances));
      return;
    }

    console.log(`📊 [${sessionId}] Actualizando progreso para ${contactName} (${phone}) - Estado: ${status}`);

    // Actualizar contadores
    switch (status) {
      case 'success':
        progress.successCount++;
        break;
      case 'error':
        progress.errorCount++;
        break;
      case 'invalid_number':
        progress.invalidNumbersCount++;
        break;
    }

    // Agregar resultado
    progress.results.push({
      contactId,
      contactName,
      status,
      phone,
      error,
      timestamp: new Date()
    });

    progress.currentIndex++;
    progress.lastUpdate = new Date();

    // Verificar si está completo
    if (progress.currentIndex >= progress.totalContacts) {
      progress.isComplete = true;
    }

    console.log(`📊 [${sessionId}] Progreso actualizado: ${progress.currentIndex}/${progress.totalContacts} | ✅ ${progress.successCount} | ❌ ${progress.errorCount} | ⚠️ ${progress.invalidNumbersCount}`);
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

  static getAllProgress(): { [sessionId: string]: SendingProgress } {
    return this.instances;
  }
}

export { SendingProgressManager };
export type { SendingProgress }; 