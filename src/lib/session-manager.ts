import { WhatsAppService } from './whatsapp-service';

export class SessionManager {
  private static sessions: { [sessionId: string]: WhatsAppService } = {};

  static getWhatsAppService(sessionId: string): WhatsAppService {
    if (!this.sessions[sessionId]) {
      this.sessions[sessionId] = WhatsAppService.getInstance(sessionId);
    }
    return this.sessions[sessionId];
  }

  static removeSession(sessionId: string): void {
    if (this.sessions[sessionId]) {
      delete this.sessions[sessionId];
    }
  }

  static getAllSessions(): string[] {
    return Object.keys(this.sessions);
  }

  static getSessionStatus(sessionId: string): boolean {
    return !!this.sessions[sessionId];
  }
} 