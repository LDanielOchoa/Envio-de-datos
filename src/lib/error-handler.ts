import logger from './logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: Error | AppError): { message: string; statusCode: number } => {
  if (error instanceof AppError) {
    logger.error(`Operational error: ${error.message}`, {
      statusCode: error.statusCode,
      stack: error.stack
    });
    
    return {
      message: error.message,
      statusCode: error.statusCode
    };
  }

  // Error no operacional (error del sistema)
  logger.error(`System error: ${error.message}`, {
    stack: error.stack
  });

  return {
    message: 'Error interno del servidor',
    statusCode: 500
  };
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};

export const validateRequiredFields = (data: any, fields: string[]): void => {
  for (const field of fields) {
    if (!data[field]) {
      throw createError(`Campo requerido faltante: ${field}`, 400);
    }
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Validar formato básico de número de teléfono
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const sanitizePhoneNumber = (phone: string): string => {
  // Eliminar todos los caracteres no numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Si empieza con 0, removerlo
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si no empieza con código de país, agregar +57 (Colombia)
  if (!cleaned.startsWith('57') && cleaned.length === 10) {
    cleaned = '57' + cleaned;
  }
  
  // Agregar el + al inicio
  return '+' + cleaned;
}; 