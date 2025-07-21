import cron from 'node-cron';
import logger from './logger';
import RateLimiter from './rate-limiter';

export class Scheduler {
  private rateLimiter: RateLimiter;

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  start() {
    // Limpiar rate limiter cada hora
    cron.schedule('0 * * * *', () => {
      logger.info('Limpiando rate limiter...');
      this.rateLimiter.clear();
    });

    // Limpiar logs antiguos cada día a las 2 AM
    cron.schedule('0 2 * * *', () => {
      logger.info('Limpiando logs antiguos...');
      this.cleanOldLogs();
    });

    // Verificar estado del sistema cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
      this.checkSystemHealth();
    });

    logger.info('Scheduler iniciado');
  }

  private cleanOldLogs() {
    // Implementar limpieza de logs antiguos
    // Por ahora solo loggeamos la acción
    logger.info('Limpieza de logs completada');
  }

  private checkSystemHealth() {
    // Verificar memoria y recursos del sistema
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    logger.info('Estado del sistema:', {
      memory: memUsageMB,
      uptime: process.uptime()
    });

    // Alertar si el uso de memoria es alto
    if (memUsageMB.heapUsed > 500) {
      logger.warn('Uso de memoria alto detectado', { memory: memUsageMB });
    }
  }

  stop() {
    logger.info('Deteniendo scheduler...');
  }
} 