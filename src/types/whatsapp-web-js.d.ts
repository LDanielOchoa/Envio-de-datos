declare module 'whatsapp-web.js' {
  export class Client {
    constructor(options?: any);
    info: any;
    pupPage: any;
    on(event: string, listener: (...args: any[]) => void): any;
    once(event: string, listener: (...args: any[]) => void): any;
    destroy(): Promise<void>;
    initialize(): Promise<void>;
    getChats(): Promise<any[]>;
    sendMessage(chatId: string, content: any, options?: any): Promise<any>;
    getNumberId(number: string): Promise<any>;
    getChatById(chatId: string): Promise<any>;
    getState(): Promise<string | null>;
  }

  export class LocalAuth {
    constructor(options?: any);
  }

  export class MessageMedia {
    constructor(mimetype: string, data: string, filename?: string);
    static fromUrl(url: string, options?: any): Promise<MessageMedia>;
  }
}
