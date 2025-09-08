declare module 'whatsapp-web.js' {
  export class Client {
    constructor(options?: any);
    // Add any other methods/properties you use if you want better type checking
  }
  export class LocalAuth {
    constructor(options?: any);
  }
  export class MessageMedia {
    constructor(mimetype: string, data: string, filename?: string);
    static fromUrl(url: string, options?: any): Promise<MessageMedia>;
  }
}
