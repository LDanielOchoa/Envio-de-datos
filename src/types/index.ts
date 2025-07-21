export type Contact = {
  id: string;
  name: string;
  lastName?: string;
  phone: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  group?: string;
  gestor?: string;
};

export type WhatsAppStatus = {
  isConnected: boolean;
  qrCode: string;
  phoneNumber: string;
  lastSeen: Date | null;
};


export enum SheetType {
  UNITARIO = 'unitario',
  GRUPOS = 'grupos'
} 

export interface SendResult {
  contactId: string;
  status: 'success' | 'error';
  error?: string;
}

export interface SendResults {
  successCount: number;
  errorCount: number;
  results: SendResult[];
  useTemplates?: boolean;
}

export type TabType = 'whatsapp' | 'sheets' | 'messages' | 'settings' | 'logs';


export interface SendResult {
  contactId: string;
  status: 'success' | 'error';
  error?: string;
}

export interface SendResults {
  successCount: number;
  errorCount: number;
  results: SendResult[];
  useTemplates?: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  group?: string;
}