import { Contact } from '../types';

// Definir el tipo WhatsAppMessage localmente ya que no existe en @/types
interface WhatsAppMessage {
  to: string;
  message: string;
}

export class Validators {
  static validateSpreadsheetId(spreadsheetId: string): boolean {
    // Validar formato básico de ID de Google Sheets
    const spreadsheetIdRegex = /^[a-zA-Z0-9-_]+$/;
    return spreadsheetIdRegex.test(spreadsheetId) && spreadsheetId.length > 0;
  }

  static validateRange(range: string): boolean {
    // Validar formato de rango de Google Sheets
    const rangeRegex = /^[A-Z]+:[A-Z]+$/;
    return rangeRegex.test(range);
  }

  static validateContact(contact: any): contact is Contact {
    return (
      contact &&
      typeof contact.name === 'string' &&
      contact.name.length > 0 &&
      typeof contact.phone === 'string' &&
      this.validatePhoneNumber(contact.phone)
    );
  }

  static validateContacts(contacts: any[]): contacts is Contact[] {
    return Array.isArray(contacts) && contacts.every(contact => this.validateContact(contact));
  }

  static validatePhoneNumber(phone: string): boolean {
    // Eliminar caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Validar longitud mínima (10 dígitos para Colombia)
    if (cleaned.length < 10) {
      return false;
    }
    
    // Validar que solo contenga números
    const phoneRegex = /^\d+$/;
    return phoneRegex.test(cleaned);
  }

  static validateMessage(message: string): boolean {
    return typeof message === 'string' && message.trim().length > 0 && message.length <= 1000;
  }

  static validateWhatsAppMessage(message: WhatsAppMessage): boolean {
    return (
      message &&
      this.validatePhoneNumber(message.to) &&
      this.validateMessage(message.message)
    );
  }

  static validateGoogleCredentials(credentials: any): boolean {
    return (
      credentials &&
      typeof credentials === 'object' &&
      credentials.type === 'service_account' &&
      credentials.project_id &&
      credentials.private_key_id &&
      credentials.private_key &&
      credentials.client_email &&
      credentials.client_id
    );
  }

  static sanitizePhoneNumber(phone: string): string {
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
  }

  static sanitizeMessage(message: string): string {
    // Limpiar y truncar mensaje
    return message.trim().substring(0, 1000);
  }

  static validateBulkMessageRequest(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.contacts || !Array.isArray(data.contacts)) {
      errors.push('Se requiere una lista de contactos válida');
    } else if (data.contacts.length === 0) {
      errors.push('La lista de contactos no puede estar vacía');
    } else if (data.contacts.length > 100) {
      errors.push('No se pueden enviar más de 100 mensajes a la vez');
    } else {
      data.contacts.forEach((contact: any, index: number) => {
        if (!this.validateContact(contact)) {
          errors.push(`Contacto ${index + 1} no es válido`);
        }
      });
    }

    if (!this.validateMessage(data.message)) {
      errors.push('Se requiere un mensaje válido (máximo 1000 caracteres)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 