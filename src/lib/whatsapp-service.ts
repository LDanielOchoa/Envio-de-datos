import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { notifyConnectionChange } from './connection-events';

// Variables globales para manejar múltiples sesiones de WhatsApp
declare global {
  var whatsappSessions: {
    [sessionId: string]: {
      client: Client | null;
      state: {
        isConnected: boolean;
        phoneNumber?: string;
        lastSeen?: Date | null;
      };
    };
  };
  
  var whatsappGlobalClient: Client | null;
  var whatsappGlobalState: {
    isConnected: boolean;
    phoneNumber: string;
    lastSeen: Date | null;
  } | null;
}

// Inicializar variable global si no existe
if (!(globalThis as any).whatsappSessions) {
  (globalThis as any).whatsappSessions = {};
}

export interface WhatsAppStatus {
  isConnected: boolean;
  qrCode: string;
  phoneNumber: string;
  lastSeen: Date | null;
}

export class WhatsAppService {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private qrCode: string = '';
  private persistentQR: string = ''; // QR que se mantiene hasta conexión
  private phoneNumber: string = '';
  private lastSeen: Date | null = null;
  private isInitializing: boolean = false;
  private sessionId: string;
  private static instances: { [sessionId: string]: WhatsAppService } = {};

  constructor(sessionId: string = 'default') {
    this.sessionId = sessionId;
    
    // Restaurar cliente de sesión si existe
    const session = (globalThis as any).whatsappSessions[sessionId];
    if (session?.client) {
      console.log(`🔄 Restaurando cliente de sesión ${sessionId}...`);
      this.client = session.client;
      
      // Restaurar estado de sesión
      if (session.state) {
        console.log(`✅ Restaurando estado de sesión ${sessionId}:`, session.state);
        this.isConnected = session.state.isConnected;
        this.phoneNumber = session.state.phoneNumber || '';
        this.lastSeen = session.state.lastSeen || null;
        this.qrCode = '';
        this.persistentQR = '';
      }
      
      // Verificar también info del cliente
      if (session.client.info?.wid?.user) {
        console.log(`✅ Cliente de sesión ${sessionId} conectado como:`, session.client.info.wid.user);
        this.isConnected = true;
        this.phoneNumber = session.client.info.wid.user;
        this.lastSeen = new Date();
        this.qrCode = '';
        this.persistentQR = '';
        this.saveSessionState();
      }
    }
  }

  // Singleton pattern por sesión
  public static getInstance(sessionId: string = 'default'): WhatsAppService {
    if (!WhatsAppService.instances[sessionId]) {
      WhatsAppService.instances[sessionId] = new WhatsAppService(sessionId);
    }
    return WhatsAppService.instances[sessionId];
  }

  private createClient(): Client {
    console.log(`🔄 Creando nuevo cliente WhatsApp para sesión ${this.sessionId}...`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: this.sessionId
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      }
    });

    this.setupEventListeners(client);
    return client;
  }

  private setupEventListeners(client: Client) {
    client.on('qr', async (qr) => {
      try {
        console.log('📱 QR Code recibido, generando imagen...');
        const qrImage = await qrcode.toDataURL(qr);
        console.log('✅ QR Code generado, longitud:', qrImage.length);
        
        // Guardar en ambas variables
        this.isConnected = false;
        this.phoneNumber = '';
        this.lastSeen = null;
        this.qrCode = qrImage;
        this.persistentQR = qrImage; // Mantener copia persistente
        
        console.log('📱 QR Code guardado permanentemente hasta conexión');
      } catch (error) {
        console.error('❌ Error al generar QR code:', error);
      }
    });

    client.on('ready', () => {
      console.log('✅ CLIENTE WHATSAPP CONECTADO Y LISTO!');
      this.isConnected = true;
      this.qrCode = '';
      this.persistentQR = ''; // Limpiar también QR persistente
      this.phoneNumber = client.info?.wid?.user || '';
      this.lastSeen = new Date();
      console.log('🎉 WhatsApp conectado exitosamente como:', this.phoneNumber);
      console.log('📱 QR limpiado - conexión establecida');
    });

    client.on('disconnected', () => {
      console.log('❌ Cliente WhatsApp desconectado');
      this.isConnected = false;
      this.phoneNumber = '';
      this.lastSeen = null;
      this.qrCode = '';
    });

    client.on('auth_failure', () => {
      console.error('❌ Error de autenticación de WhatsApp');
      this.isConnected = false;
      this.phoneNumber = '';
      this.lastSeen = null;
    });

    client.on('loading_screen', (percent, message) => {
      console.log(`📱 Cargando WhatsApp: ${percent}% - ${message}`);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitializing) {
      console.log('⚠️ WhatsApp ya está inicializando...');
      return;
    }

    try {
      this.isInitializing = true;
      console.log('🚀 Inicializando cliente WhatsApp...');

      // Si ya hay un cliente, destruirlo primero
      if (this.client) {
        console.log('🔄 Destruyendo cliente anterior...');
        try {
          await this.client.destroy();
        } catch (error) {
          console.log('⚠️ Error al destruir cliente anterior (normal):', error);
        }
        this.client = null;
      }

      // Crear nuevo cliente
      this.client = this.createClient();
      
      // Inicializar
      await this.client.initialize();
      console.log('✅ Cliente WhatsApp inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error al inicializar WhatsApp:', error);
      
      // Si hay error, limpiar estado
      this.isConnected = false;
      this.phoneNumber = '';
      this.lastSeen = null;
      this.qrCode = '';
      
      // Si el cliente existe, intentar destruirlo
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (destroyError) {
          console.log('⚠️ Error al destruir cliente después de error:', destroyError);
        }
        this.client = null;
      }
      
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log('🔄 Desconectando cliente WhatsApp...');
      
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (error) {
          console.log('⚠️ Error al destruir cliente (normal):', error);
        }
        this.client = null;
      }
      
      // Limpiar estado
      this.isConnected = false;
      this.phoneNumber = '';
      this.lastSeen = null;
      this.qrCode = '';
      
      console.log('✅ Cliente WhatsApp desconectado completamente');
    } catch (error) {
      console.error('❌ Error al desconectar:', error);
      // Aún así, limpiar el estado
      this.isConnected = false;
      this.phoneNumber = '';
      this.lastSeen = null;
      this.qrCode = '';
      this.client = null;
    }
  }

  async forceQRGeneration(): Promise<string> {
    try {
      console.log('📱 FORZANDO GENERACIÓN DE QR - MÉTODO DEFINITIVO MEJORADO');
      
      // 1. Verificar si ya está conectado ANTES de hacer nada
      if (this.client?.info?.wid?.user) {
        console.log('✅ Cliente ya está conectado como:', this.client.info.wid.user);
        this.isConnected = true;
        this.phoneNumber = this.client.info.wid.user;
        this.qrCode = '';
        this.persistentQR = '';
        throw new Error('WhatsApp ya está conectado');
      }
      
      // 2. Limpiar COMPLETAMENTE
      console.log('🧹 Limpiando estado completamente...');
      this.isConnected = false;
      this.phoneNumber = '';
      this.lastSeen = null;
      this.qrCode = '';
      this.persistentQR = '';
      
      // 3. Destruir cliente completamente y limpiar datos de autenticación
      if (this.client) {
        try {
          console.log('🗑️ Destruyendo cliente existente...');
          await this.client.destroy();
          console.log('✅ Cliente destruido');
        } catch (error) {
          console.log('⚠️ Error destruyendo cliente:', error);
        }
        this.client = null;
      }

      // 4. Limpiar archivos de autenticación (mejorado para Windows)
      try {
        const fs = require('fs');
        const path = require('path');
        const authPath = path.join(process.cwd(), '.wwebjs_auth');
        
        if (fs.existsSync(authPath)) {
          console.log('🗑️ Intentando limpiar datos de autenticación...');
          
          // Función recursiva para limpiar con reintentos
          const cleanupWithRetry = async (dirPath: string, retries = 3) => {
            for (let attempt = 1; attempt <= retries; attempt++) {
              try {
                // Intentar eliminar de forma menos agresiva
                const items = fs.readdirSync(dirPath);
                for (const item of items) {
                  const itemPath = path.join(dirPath, item);
                  const stat = fs.statSync(itemPath);
                  
                  if (stat.isDirectory()) {
                    await cleanupWithRetry(itemPath, 1); // Solo 1 reintento para subdirectorios
                    try {
                      fs.rmdirSync(itemPath);
                    } catch (e: any) {
                      console.log(`⚠️ No se pudo eliminar directorio ${itemPath}:`, e.message);
                    }
                  } else {
                    try {
                      fs.unlinkSync(itemPath);
                    } catch (e: any) {
                      if (e.code === 'EBUSY' || e.code === 'ENOENT') {
                        console.log(`⚠️ Archivo ocupado, saltando: ${itemPath}`);
                      } else {
                        console.log(`⚠️ Error eliminando ${itemPath}:`, e.message);
                      }
                    }
                  }
                }
                
                // Intentar eliminar el directorio principal
                try {
                  fs.rmdirSync(dirPath);
                  console.log(`✅ Directorio eliminado: ${dirPath}`);
                } catch (e: any) {
                  console.log(`⚠️ No se pudo eliminar directorio principal: ${e.message}`);
                }
                
                break; // Salir si fue exitoso
              } catch (error: any) {
                console.log(`⚠️ Intento ${attempt} falló:`, error.message);
                if (attempt < retries) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
              }
            }
          };
          
          await cleanupWithRetry(authPath);
          console.log('✅ Limpieza de autenticación completada (algunos archivos pueden quedar)');
        }
              } catch (error: any) {
          console.log('⚠️ Error general limpiando autenticación:', error.message);
        }
      
      // 5. Esperar para asegurar limpieza completa
      console.log('⏳ Esperando limpieza completa...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 6. Crear cliente completamente nuevo
      console.log('🔄 Creando cliente completamente FRESCO...');
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'whatsapp-main', // ID fijo y simple
          dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      });
      
      // Guardar referencia global para persistencia
      globalThis.whatsappGlobalClient = this.client;
      console.log('💾 Cliente guardado en referencia global');
      
      // 7. Setup de eventos básicos primero
      this.client.on('loading_screen', (percent, message) => {
        console.log(`📱 Cargando WhatsApp: ${percent}% - ${message}`);
      });

      this.client.on('authenticated', () => {
        console.log('✅ CLIENTE WHATSAPP AUTENTICADO!');
      });

             this.client.on('ready', () => {
         console.log('✅ CLIENTE WHATSAPP CONECTADO Y LISTO!');
         this.isConnected = true;
         this.qrCode = '';
         this.persistentQR = '';
         this.phoneNumber = this.client?.info?.wid?.user || '';
         this.lastSeen = new Date();
         console.log('🎉 WhatsApp conectado exitosamente como:', this.phoneNumber);
         console.log('💾 Estado guardado - Cliente activo y listo');
         
         // Asegurar que la referencia de sesión esté actualizada
         this.saveSessionState();
         console.log(`🔒 Cliente conectado guardado en sesión ${this.sessionId}`);
         
         // Notificar cambio de conexión al frontend
         this.notifyConnectionChange();
       });

      this.client.on('disconnected', (reason) => {
        console.log('❌ Cliente WhatsApp desconectado:', reason);
        this.isConnected = false;
        this.phoneNumber = '';
        this.lastSeen = null;
      });
      
      // 8. Promesa para QR con múltiples intentos
      return new Promise<string>((resolve, reject) => {
        let qrReceived = false;
        
        const timeout = setTimeout(() => {
          if (!qrReceived) {
            console.error('⏰ TIMEOUT FINAL - No se recibió QR en 60 segundos');
            reject(new Error('Timeout: No se generó QR en 60 segundos - posible problema de red'));
          }
        }, 60000); // 60 segundos
        
                 // Listener para QR - SOLO UNA VEZ
         this.client!.once('qr', async (qr) => {
           try {
             if (qrReceived) {
               console.log('⚠️ QR ya recibido, ignorando...');
               return;
             }
             
             qrReceived = true;
             console.log('🎯 QR RECIBIDO! Generando imagen...');
             clearTimeout(timeout);
            
            const qrImage = await qrcode.toDataURL(qr, { 
              width: 300, 
              margin: 3,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              },
              errorCorrectionLevel: 'M'
            });
            
            this.qrCode = qrImage;
            this.persistentQR = qrImage;
            this.lastSeen = new Date();
            
            console.log('✅ QR GUARDADO EXITOSAMENTE - Longitud:', qrImage.length);
            console.log('🎉 QR GENERADO Y LISTO PARA ESCANEAR!');
            
            resolve(qrImage);
          } catch (error) {
            clearTimeout(timeout);
            console.error('❌ Error generando imagen QR:', error);
            reject(error);
          }
        });
        
        // Listener para conexión directa (si se autentica rápido)
        this.client!.on('ready', () => {
          if (!qrReceived) {
            clearTimeout(timeout);
            console.log('✅ Cliente conectado directamente sin QR');
            this.isConnected = true;
            this.phoneNumber = this.client?.info?.wid?.user || '';
            this.qrCode = '';
            this.persistentQR = '';
            reject(new Error('WhatsApp conectado directamente - no necesita QR'));
          }
        });
        
        // 9. Inicializar cliente con manejo de errores
        console.log('🚀 Inicializando cliente FRESCO...');
        this.client!.initialize().catch((error) => {
          if (!qrReceived) {
            clearTimeout(timeout);
            console.error('❌ Error inicializando cliente:', error);
            reject(new Error(`Error de inicialización: ${error.message}`));
          }
        });
      });
      
    } catch (error) {
      console.error('❌ ERROR CRÍTICO en forceQRGeneration:', error);
      throw new Error(`Error crítico generando QR: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async refreshStatus(): Promise<WhatsAppStatus> {
    try {
      console.log('🔍 refreshStatus - SOLO verificar, NO tocar QR');
      
      // Si no hay cliente, crear uno
      if (!this.client) {
        console.log('🔄 No hay cliente, creando uno nuevo...');
        await this.initialize();
      }
      
      // SOLO verificar conexión, NO tocar el QR
      if (this.client?.info?.wid?.user) {
        console.log('📱 Cliente detectado como conectado:', this.client.info.wid.user);
        this.isConnected = true;
        this.phoneNumber = this.client.info.wid.user;
        this.lastSeen = new Date();
        // NO TOCAR EL QR AQUÍ
      } else if (this.client?.pupPage) {
        console.log('📱 Cliente en proceso de conexión...');
        // NO tocar nada
      } else {
        console.log('📱 Cliente no conectado');
        // NO tocar el QR
      }
      
      return this.getStatus();
    } catch (error) {
      console.error('❌ Error en refreshStatus:', error);
      return this.getStatus();
    }
  }

  getStatus(): WhatsAppStatus {
    console.log('📊 getStatus - Verificando estado actual...');
    
    if (this.client && this.client.info) {
      console.log('📊 Cliente info:', this.client.info.wid.user);
      const status: WhatsAppStatus = {
        isConnected: true,
        phoneNumber: this.client.info.wid.user,
        lastSeen: this.lastSeen || null,
        qrCode: ''  // Cuando está conectado, qrCode es cadena vacía
      };
      console.log('📊 Estado guardado - isConnected:', status.isConnected, 'phone:', status.phoneNumber);
      console.log('✅ Estado conectado confirmado desde memoria:', status.phoneNumber);
      console.log('📊 ESTADO FINAL (CONECTADO):', { isConnected: status.isConnected, qrLength: 0, phoneNumber: status.phoneNumber });
      return status;
    }
    
    console.log('📊 Cliente info: No disponible');
    const status: WhatsAppStatus = {
      isConnected: this.isConnected,
      phoneNumber: this.phoneNumber || '',
      lastSeen: this.lastSeen || null,
      qrCode: this.qrCode || this.persistentQR || ''
    };
    console.log('📊 Estado guardado - isConnected:', status.isConnected, 'phone:', status.phoneNumber);
    console.log('📊 ESTADO FINAL (NO CONECTADO):', { isConnected: status.isConnected, qrLength: status.qrCode.length || 0, phoneNumber: status.phoneNumber });
    return status;
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    try {
      console.log(`📤 [${this.sessionId}] Intentando enviar mensaje a ${phone}`);
      console.log(`📊 [${this.sessionId}] Parámetros:`, {
        messageLength: message.length
      });
      
      // Verificación completa del estado
      if (!this.client) {
        console.log(`❌ [${this.sessionId}] No hay cliente disponible`);
        throw new Error('WhatsApp no está conectado');
      }

      // Verificar que el cliente tenga información de conexión
      if (!this.client.info?.wid?.user) {
        console.log(`⚠️ [${this.sessionId}] Cliente sin información de conexión`);
        throw new Error('WhatsApp no está completamente conectado');
      }

      // Verificar que el cliente esté listo
      if (!this.client.pupPage) {
        console.log(`⚠️ [${this.sessionId}] Cliente no está listo (sin página Puppeteer)`);
        throw new Error('WhatsApp no está listo para enviar mensajes');
      }

      // Formatear número de teléfono
      const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      console.log(`📱 [${this.sessionId}] Enviando a: ${formattedPhone}`);

      // Envío solo texto
      console.log(`💬 [${this.sessionId}] Enviando mensaje de texto`);
      const result = await this.client.sendMessage(formattedPhone, message);
      console.log(`✅ [${this.sessionId}] Texto enviado exitosamente:`, result.id._serialized);

      console.log(`✅ [${this.sessionId}] Mensaje enviado exitosamente a ${phone}`);
      return true;
    } catch (error: any) {
      console.error(`❌ [${this.sessionId}] Error enviando mensaje a ${phone}:`, error);
      
      // Detectar errores específicos de números no válidos
      const errorMessage = error.message || '';
      if (errorMessage.includes('not-found') || 
          errorMessage.includes('not-authorized') || 
          errorMessage.includes('invalid') ||
          errorMessage.includes('no existe') ||
          errorMessage.includes('number not found')) {
        console.log(`❌ [${this.sessionId}] Número ${phone} no válido - error específico detectado`);
        throw new Error('Número no registrado en WhatsApp');
      }
      
      throw error;
    }
  }

  // Método para verificar si un número existe en WhatsApp
  async isNumberValid(phone: string): Promise<boolean> {
    try {
      if (!this.client) {
        console.log(`❌ [${this.sessionId}] No hay cliente disponible para verificar número`);
        throw new Error('No hay cliente disponible para verificar número');
      }

      // Verificar que el cliente esté conectado
      if (!this.client.info?.wid?.user) {
        console.log(`❌ [${this.sessionId}] Cliente no está conectado para verificar número`);
        throw new Error('Cliente no está conectado para verificar número');
      }

      const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      
      try {
        // Intentar obtener información del chat para verificar si existe
        const chat = await this.client.getChatById(formattedPhone);
        
        // Verificar si el chat existe y tiene información válida
        const isValid = Boolean(chat && chat.id && chat.id.user);
        
        console.log(`🔍 [${this.sessionId}] Verificación de número ${phone}: ${isValid ? 'VÁLIDO' : 'NO VÁLIDO'}`);
        
        if (isValid) {
          console.log(`✅ [${this.sessionId}] Número ${phone} verificado como válido`);
        } else {
          console.log(`❌ [${this.sessionId}] Número ${phone} verificado como NO válido`);
        }
        return isValid;
      } catch (chatError: any) {
        // Si el error indica que el número no existe, es inválido
        const errorMessage = chatError.message || '';
        if (errorMessage.includes('not-found') || 
            errorMessage.includes('not-authorized') || 
            errorMessage.includes('invalid') ||
            errorMessage.includes('no existe')) {
          console.log(`❌ [${this.sessionId}] Número ${phone} NO existe en WhatsApp`);
          return false;
        }
        
        console.log(`⚠️ [${this.sessionId}] Error verificando número ${phone}:`, chatError.message);
        return false;
      }
    } catch (error) {
      console.error(`❌ [${this.sessionId}] Error verificando número ${phone}:`, error);
      return false;
    }
  }

  // Método para obtener QR sin tocar estado
  getQROnly(): string {
    const qr = this.qrCode || this.persistentQR;
    console.log('📊 getQROnly - QR length:', qr.length);
    return qr;
  }

  // Método para forzar la detección de conexión
  async forceConnectionCheck(): Promise<WhatsAppStatus> {
    try {
      console.log('🔍 Forzando verificación de conexión...');
      console.log('📊 Estado actual guardado:', { 
        isConnected: this.isConnected, 
        phoneNumber: this.phoneNumber,
        hasClient: !!this.client 
      });
      
      if (!this.client) {
        console.log('❌ No hay cliente local - verificando referencia global...');
        
        // Verificar si hay cliente en la referencia global
        if (globalThis.whatsappGlobalClient) {
          console.log('🔄 Restaurando desde referencia global...');
          this.client = globalThis.whatsappGlobalClient;
          
          // Restaurar estado global también
          if (globalThis.whatsappGlobalState) {
            console.log('✅ Restaurando estado global completo:', globalThis.whatsappGlobalState);
            this.isConnected = globalThis.whatsappGlobalState.isConnected;
            this.phoneNumber = globalThis.whatsappGlobalState.phoneNumber || '';
            this.lastSeen = globalThis.whatsappGlobalState.lastSeen || null;
            this.qrCode = '';
            this.persistentQR = '';
            return this.getStatus();
          }
          
          // Verificar si está conectado desde info del cliente
          const session = (globalThis as any).whatsappSessions[this.sessionId];
          if (session?.client?.info?.wid?.user) {
            console.log(`✅ Cliente de sesión ${this.sessionId} conectado:`, session.client.info.wid.user);
            this.isConnected = true;
            this.phoneNumber = session.client.info.wid.user;
            this.lastSeen = new Date();
            this.qrCode = '';
            this.persistentQR = '';
            this.saveSessionState();
            return this.getStatus();
          }
        }
        
        // Si no hay cliente global pero creemos estar conectados, crear uno
        if (this.isConnected && this.phoneNumber) {
          console.log('🔄 Recreando cliente para usuario conectado...');
          await this.initialize();
          return this.getStatus();
        }
        
        console.log('❌ No hay cliente disponible en ninguna referencia');
        return this.getStatus();
      }
      
      // Si ya tenemos estado conectado guardado, verificar que siga siendo cierto
      if (this.isConnected && this.phoneNumber) {
        console.log('✅ Estado conectado confirmado desde memoria:', this.phoneNumber);
        
        // Verificar si el cliente también tiene la info
        if (this.client.info?.wid?.user) {
          console.log('✅ Cliente también confirma conexión:', this.client.info.wid.user);
          this.lastSeen = new Date();
          return this.getStatus();
        } else {
          console.log('⚠️ Cliente perdió info pero estado dice conectado');
          // Mantener el estado conectado por ahora
          return this.getStatus();
        }
      }
      
      // Intentar obtener información del cliente si no tenemos estado
      if (this.client.info?.wid?.user) {
        console.log('🎉 ¡NUEVA CONEXIÓN DETECTADA!:', this.client.info.wid.user);
        this.isConnected = true;
        this.phoneNumber = this.client.info.wid.user;
        this.lastSeen = new Date();
        // Limpiar QR solo al detectar nueva conexión
        this.qrCode = '';
        this.persistentQR = '';
        return this.getStatus();
      }
      
      // Si no hay info pero hay página, puede estar conectando
      if (this.client.pupPage) {
        console.log('📱 Cliente en proceso, manteniendo estado actual...');
        return this.getStatus();
      }
      
      console.log('❌ Cliente no conectado');
      return this.getStatus();
    } catch (error) {
      console.error('❌ Error en forceConnectionCheck:', error);
      return this.getStatus();
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    return cleaned + '@c.us';
  }

  // Método para guardar estado de sesión
  private saveSessionState() {
    if (!(globalThis as any).whatsappSessions[this.sessionId]) {
      (globalThis as any).whatsappSessions[this.sessionId] = {
        client: null,
        state: {
          isConnected: false,
          phoneNumber: '',
          lastSeen: null
        }
      };
    }
    
    (globalThis as any).whatsappSessions[this.sessionId].client = this.client;
    (globalThis as any).whatsappSessions[this.sessionId].state = {
      isConnected: this.isConnected,
      phoneNumber: this.phoneNumber,
      lastSeen: this.lastSeen
    };
    console.log(`💾 Estado guardado para sesión ${this.sessionId}:`, (globalThis as any).whatsappSessions[this.sessionId].state);
  }

  // Método para verificar si un mensaje se entregó (retorna boolean)
  private async checkMessageDelivery(message: any, type: string): Promise<boolean> {
    try {
      console.log(`🔍 Verificando entrega de ${type}...`);
      
      // Esperar más tiempo para imágenes
      const waitTime = type.includes('imagen') ? 5000 : 3000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      let isDelivered = false;
      
      // Verificar ACK (acknowledgment) - más estricto
      try {
        const info = await message.getInfo();
        console.log(`📊 Info de ${type}:`, {
          delivery: info.delivery.length,
          read: info.read.length,
          ack: message.ack
        });
        
        // ACK 2 = entregado, ACK 3 = leído
        if (message.ack >= 2) {
          console.log(`✅ ${type} CONFIRMADO por ACK: ${message.ack}`);
          isDelivered = true;
        } else if (message.ack === 1) {
          console.log(`⚠️ ${type} solo enviado al servidor (ACK=1)`);
        } else {
          console.log(`❌ ${type} sin ACK confirmado (ACK=${message.ack})`);
        }
        
      } catch (infoError: any) {
        console.log(`⚠️ No se pudo obtener info de ${type}:`, infoError.message);
      }
      
      // Verificar si existe en el chat como respaldo
      try {
        const chatId = message.id.remote;
        const chat = await this.client?.getChatById(chatId);
        
        if (chat) {
          const messages = await chat.fetchMessages({ limit: 10 });
          const messageExists = messages.some(msg => msg.id._serialized === message.id._serialized);
          
          if (messageExists) {
            console.log(`✅ ${type} ENCONTRADO en el chat`);
            isDelivered = true;
          } else {
            console.log(`❌ ${type} NO encontrado en el chat`);
          }
        }
        
      } catch (chatError: any) {
        console.log(`⚠️ No se pudo verificar ${type} en el chat:`, chatError.message);
      }
      
      return isDelivered;
      
    } catch (error: any) {
      console.log(`❌ Error verificando entrega de ${type}:`, error.message);
      return false;
    }
  }

  // Método para verificar si un mensaje realmente se entregó (solo logs)
  private async verifyMessageDelivery(message: any, type: string): Promise<void> {
    try {
      console.log(`🔍 Verificando entrega de ${type}...`);
      
      // Esperar más tiempo para imágenes
      const waitTime = type.includes('imagen') ? 5000 : 3000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Intentar obtener información del mensaje
      try {
        const info = await message.getInfo();
        console.log(`📊 Info de ${type}:`, {
          delivery: info.delivery.length,
          read: info.read.length,
          ack: message.ack
        });
        
        // Verificar ACK (acknowledgment)
        if (message.ack) {
          if (message.ack === 1) {
            console.log(`✅ ${type} ENVIADO al servidor WhatsApp`);
          } else if (message.ack === 2) {
            console.log(`✅ ${type} ENTREGADO al dispositivo`);
          } else if (message.ack === 3) {
            console.log(`✅ ${type} LEÍDO por el usuario`);
          } else {
            console.log(`⚠️ ${type} ACK desconocido: ${message.ack}`);
          }
        } else {
          console.log(`⚠️ ${type} sin ACK confirmado`);
        }
        
      } catch (infoError: any) {
        console.log(`⚠️ No se pudo obtener info de ${type}:`, infoError.message);
      }
      
      // Verificar si el mensaje existe en el chat
      try {
        const chatId = message.id.remote;
        const chat = await this.client?.getChatById(chatId);
        
        if (chat) {
          // Obtener los últimos mensajes del chat
          const messages = await chat.fetchMessages({ limit: 5 });
          const messageExists = messages.some(msg => msg.id._serialized === message.id._serialized);
          
          if (messageExists) {
            console.log(`✅ ${type} CONFIRMADO en el chat`);
          } else {
            console.log(`❌ ${type} NO encontrado en el chat`);
          }
        }
        
      } catch (chatError: any) {
        console.log(`⚠️ No se pudo verificar ${type} en el chat:`, chatError.message);
      }
      
    } catch (error: any) {
      console.log(`❌ Error verificando entrega de ${type}:`, error.message);
    }
  }

  // Método para preparar y sincronizar un chat antes del envío
  private async prepareChat(chatId: string): Promise<void> {
    try {
      console.log(`🔄 Preparando chat: ${chatId}`);
      
      // Intentar obtener el chat y forzar carga
      const chat = await this.client?.getChatById(chatId);
      
      if (chat) {
        console.log(`✅ Chat preparado: ${chat.name || 'Sin nombre'}`);
        
        // Forzar carga de mensajes recientes para sincronizar
        try {
          await chat.fetchMessages({ limit: 1 });
          console.log(`✅ Chat sincronizado correctamente`);
        } catch (fetchError: any) {
          console.log(`⚠️ No se pudieron cargar mensajes del chat:`, fetchError.message);
        }
        
        // Pequeña pausa para estabilidad
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } else {
        console.log(`⚠️ No se pudo obtener el chat: ${chatId}`);
      }
      
    } catch (error: any) {
      console.log(`❌ Error preparando chat ${chatId}:`, error.message);
    }
  }

  // Método para refrescar el cliente si está teniendo problemas
  async refreshClient(): Promise<void> {
    try {
      console.log('🔄 Refrescando cliente WhatsApp...');
      
      if (this.client) {
        // Intentar reconectar sin destruir completamente
        await this.client.pupPage?.reload();
        console.log('✅ Página del cliente refrescada');
        
        // Esperar a que se estabilice
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const state = await this.client.getState();
        console.log('📱 Estado después del refresh:', state);
      }
    } catch (error: any) {
      console.log('❌ Error refrescando cliente:', error.message);
    }
  }

  // Método para notificar cambios de conexión
  private notifyConnectionChange() {
    try {
      const status = this.getStatus();
      
      // Notificar cambio de estado a través de SSE
      notifyConnectionChange(status);
      
    } catch (error) {
      console.log('⚠️ Error en notifyConnectionChange:', error);
    }
  }
} 