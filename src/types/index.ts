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

// Tipos para autenticación
export type User = {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  whatsappSessionId: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
};


export enum SheetType {
  UNITARIO = 'unitario',
  GRUPOS = 'grupos',
  G29_30 = 'g29_30'
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