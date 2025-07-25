export const APP_CONFIG = {
  NAME: 'WhatsApp Sheets Integration',
  VERSION: '1.0.0',
  DESCRIPTION: 'Envía mensajes de WhatsApp desde Google Sheets de forma profesional',
  AUTHOR: 'Tu Nombre',
  LICENSE: 'MIT'
};

export const WHATSAPP_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  DELAY_BETWEEN_MESSAGES: 3000, // 3 segundos
  MAX_CONTACTS_PER_BATCH: 500,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
  QR_CODE_SIZE: 256
};

export const GOOGLE_SHEETS_CONFIG = {
  DEFAULT_RANGE: 'A:C',
  MAX_ROWS: 2000,
  REQUIRED_COLUMNS: ['Nombre', 'Teléfono'],
  OPTIONAL_COLUMNS: ['Email']
};

export const API_CONFIG = {
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: 100,
  CORS_ORIGINS: ['*'],
  MAX_BODY_SIZE: '10mb'
};

export const VALIDATION_CONFIG = {
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 15,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 1000
};

export const ERROR_MESSAGES = {
  WHATSAPP_NOT_CONNECTED: 'WhatsApp no está conectado. Por favor, escanea el código QR primero.',
  INVALID_PHONE_NUMBER: 'Número de teléfono inválido',
  INVALID_SPREADSHEET_ID: 'ID de hoja de cálculo inválido',
  INVALID_CREDENTIALS: 'Credenciales de Google inválidas',
  NO_CONTACTS_FOUND: 'No se encontraron contactos válidos',
  MESSAGE_TOO_LONG: 'El mensaje es demasiado largo (máximo 1000 caracteres)',
  TOO_MANY_CONTACTS: 'Demasiados contactos (máximo 500)',
  RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
  GOOGLE_SHEETS_ERROR: 'Error al acceder a Google Sheets',
  WHATSAPP_SEND_ERROR: 'Error al enviar mensaje de WhatsApp'
};

export const SUCCESS_MESSAGES = {
  CONTACTS_LOADED: 'Contactos cargados exitosamente',
  MESSAGES_SENT: 'Mensajes enviados exitosamente',
  WHATSAPP_CONNECTED: 'WhatsApp conectado exitosamente',
  SHEET_ACCESS_VALIDATED: 'Acceso a Google Sheets validado'
};

export const LOG_CONFIG = {
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  },
  FILES: {
    ERROR: 'logs/error.log',
    COMBINED: 'logs/combined.log'
  }
};

export const PHONE_NUMBER_CONFIG = {
  DEFAULT_COUNTRY_CODE: '57', // Colombia
  FORMATS: {
    COLOMBIA: {
      LENGTH: 10,
      CODE: '57',
      PATTERN: /^(\+?57)?(\d{10})$/
    }
  }
};

export const MESSAGE_TEMPLATES = {
  WELCOME: 'Hola {nombre}, bienvenido a nuestro servicio.',
  REMINDER: 'Hola {nombre}, te recordamos tu cita programada.',
  PROMOTION: 'Hola {nombre}, tenemos una oferta especial para ti.',
  CUSTOM: 'Hola {nombre}, {mensaje_personalizado}.'
};

export const CRON_SCHEDULES = {
  CLEAN_RATE_LIMITER: '0 * * * *', // Cada hora
  CLEAN_LOGS: '0 2 * * *', // Cada día a las 2 AM
  SYSTEM_HEALTH_CHECK: '*/5 * * * *' // Cada 5 minutos
};