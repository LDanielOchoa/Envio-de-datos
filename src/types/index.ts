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
  qrCode?: string;
  phoneNumber?: string;
  lastSeen?: Date;
};

export type MessageTemplate = {
  id: string;
  name: string;
  content: string;
  group?: string;
};

export enum SheetType {
  UNITARIO = 'unitario',
  GRUPOS = 'grupos'
} 