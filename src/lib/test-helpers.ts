import { Contact } from '@/types';

// Definir el tipo WhatsAppMessage localmente ya que no existe en @/types
interface WhatsAppMessage {
  to: string;
  message: string;
}

export class TestHelpers {
  static createMockContact(overrides: Partial<Contact> = {}): Contact {
    return {
      id: `contact_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Juan Pérez',
      phone: '+573001234567',
      status: 'pending',
      ...overrides
    };
  }

  static createMockContacts(count: number): Contact[] {
    const contacts: Contact[] = [];
    for (let i = 0; i < count; i++) {
      contacts.push(this.createMockContact({
        id: `contact_${i + 1}`,
        name: `Contacto ${i + 1}`,
        phone: `+57300${String(i + 1).padStart(6, '0')}`
      }));
    }
    return contacts;
  }

  static createMockWhatsAppMessage(overrides: Partial<WhatsAppMessage> = {}): WhatsAppMessage {
    return {
      to: '+573001234567',
      message: 'Hola, este es un mensaje de prueba',
      ...overrides
    };
  }

  static createMockGoogleCredentials() {
    return {
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n',
      client_email: 'test@test-project.iam.gserviceaccount.com',
      client_id: '123456789',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com'
    };
  }

  static createMockSpreadsheetData() {
    return {
      values: [
        ['Nombre', 'Teléfono', 'Email'],
        ['Juan Pérez', '+573001234567', 'juan@example.com'],
        ['María García', '+573007654321', 'maria@example.com'],
        ['Carlos López', '+573001112223', 'carlos@example.com']
      ]
    };
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateRandomPhone(): string {
    const prefix = '+57';
    const number = Math.floor(Math.random() * 900000000) + 100000000;
    return `${prefix}${number}`;
  }

  static generateRandomEmail(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const username = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
  }

  static generateRandomName(): string {
    const names = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Sofia'];
    const surnames = ['Pérez', 'García', 'López', 'Martínez', 'González', 'Rodríguez', 'Fernández', 'Moreno'];
    
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    
    return `${name} ${surname}`;
  }

  static createMockApiResponse(success: boolean, data?: any, error?: string) {
    return {
      success,
      ...(data && { data }),
      ...(error && { error })
    };
  }

  static validateContactStructure(contact: any): boolean {
    return (
      contact &&
      typeof contact.id === 'string' &&
      typeof contact.name === 'string' &&
      typeof contact.phone === 'string' &&
      typeof contact.status === 'string' &&
      contact.name.length > 0 &&
      contact.phone.length >= 10
    );
  }

  static validateWhatsAppMessageStructure(message: any): boolean {
    return (
      message &&
      typeof message.to === 'string' &&
      typeof message.message === 'string' &&
      message.to.length >= 10 &&
      message.message.length > 0
    );
  }

  static mockConsoleMethods() {
    // Esta función requiere jest que no está configurado correctamente
    // Comentando para evitar errores de compilación
    const originalConsole = { ...console };
    
    const mockConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Object.assign(console, mockConsole);

    return {
      mockConsole,
      restore: () => Object.assign(console, originalConsole)
    };
  }

  static createMockRequest(body: any = {}, headers: any = {}) {
    return {
      body,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ip: '127.0.0.1',
      method: 'POST'
    };
  }

  static createMockResponse() {
    // Esta función requiere jest que no está configurado correctamente
    // Comentando para evitar errores de compilación
    const res: any = {
      status: function() { return this; },
      json: function() { return this; },
      setHeader: function() { return this; }
    };
    return res;
  }
} 