declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>;
  export function toDataURL(text: string, callback: (err: Error | null, url: string) => void): void;
  export function toDataURL(text: string, options: any, callback: (err: Error | null, url: string) => void): void;
} 