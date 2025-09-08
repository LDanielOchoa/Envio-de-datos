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
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: Date | null = null;

  constructor(sessionId: string = 'default') {
    this.sessionId = sessionId;
    
    console.log(`🏗️ Creando instancia WhatsAppService para sesión ${sessionId}`);
    
    // PRIORIDAD 1: Restaurar desde referencia global si existe
    if (globalThis.whatsappGlobalClient) {
      console.log(`🔄 Restaurando desde referencia global para sesión ${sessionId}...`);
      this.client = globalThis.whatsappGlobalClient;
      
      // Verificar si está conectado
      if (this.client.info?.wid?.user) {
        console.log(`✅ Cliente global conectado como: ${this.client.info.wid.user}`);
        this.isConnected = true;
        this.phoneNumber = this.client.info.wid.user;
        this.lastSeen = new Date();
        this.qrCode = '';
        this.persistentQR = '';
      }
    }
    
    // PRIORIDAD 2: Restaurar cliente de sesión si existe
    const session = (globalThis as any).whatsappSessions[sessionId];
    if (session?.client) {
      console.log(`🔄 Restaurando cliente de sesión ${sessionId}...`);
      this.client = session.client;
      
      // Verificar que el cliente siga siendo válido
      if (this.client && this.client.pupPage && !this.client.pupPage.isClosed()) {
        console.log(`✅ Cliente de sesión ${sessionId} es válido`);
        
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
      } else {
        console.log(`⚠️ Cliente de sesión ${sessionId} no es válido, limpiando...`);
        this.client = null;
        // Limpiar sesión inválida
        delete (globalThis as any).whatsappSessions[sessionId];
      }
    }
    
    console.log(`📊 Estado inicial para sesión ${sessionId}:`, {
      hasClient: !!this.client,
      isConnected: this.isConnected,
      phoneNumber: this.phoneNumber
    });
  }

  // Singleton pattern por sesión mejorado
  public static getInstance(sessionId: string = 'default'): WhatsAppService {
    // Verificar si ya existe una instancia válida
    if (WhatsAppService.instances[sessionId]) {
      console.log(`🔄 Reutilizando instancia existente para sesión ${sessionId}`);
      return WhatsAppService.instances[sessionId];
    }
    
    console.log(`🏗️ Creando nueva instancia para sesión ${sessionId}`);
    WhatsAppService.instances[sessionId] = new WhatsAppService(sessionId);
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
      
      // 1. Verificar si ya está REALMENTE conectado y funcional ANTES de hacer nada
      if (this.client?.info?.wid?.user && 
          this.client.pupPage && 
          !this.client.pupPage.isClosed() && 
          this.isConnected) {
        console.log('✅ Cliente ya está conectado y funcional como:', this.client.info.wid.user);
        this.isConnected = true;
        this.phoneNumber = this.client.info.wid.user;
        this.qrCode = '';
        this.persistentQR = '';
        throw new Error('WhatsApp ya está conectado');
      }
      
      // Si hay cliente pero no está realmente conectado, proceder con regeneración
      if (this.client?.info?.wid?.user && (!this.client.pupPage || this.client.pupPage.isClosed())) {
        console.log('⚠️ Cliente tiene info pero página cerrada, procediendo con regeneración QR...');
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
        console.log(`✅ CLIENTE WHATSAPP AUTENTICADO para sesión ${this.sessionId}!`);
        
        // Guardar inmediatamente en referencias globales
        globalThis.whatsappGlobalClient = this.client;
        console.log('💾 Cliente guardado en referencia global tras autenticación');
        
        // Asegurar persistencia en sesión
        this.saveSessionState();
        
        // NUEVA ESTRATEGIA: Asumir conexión tras autenticación + verificar funcionalidad
        console.log('🚀 NUEVA ESTRATEGIA: Asumiendo conexión tras autenticación exitosa');
        
        // Dar tiempo mínimo para que se establezca la conexión
        setTimeout(async () => {
          try {
            console.log('🔍 Verificando funcionalidad del cliente autenticado...');
            
            // Método 1: Intentar obtener chats para confirmar funcionalidad
            try {
              const chats = await this.client.getChats();
              console.log(`✅ CONEXIÓN CONFIRMADA - Acceso a ${chats.length} chats`);
              
              // Si tenemos acceso a chats, estamos definitivamente conectados
              this.isConnected = true;
              this.phoneNumber = 'authenticated-user';
              this.lastSeen = new Date();
              this.qrCode = '';
              this.persistentQR = '';
              
              // Si encontramos el número en algún chat, usarlo
              for (const chat of chats.slice(0, 10)) {
                if (chat.id && chat.id._serialized && chat.id._serialized.includes('@c.us')) {
                  // Buscar mi propio número en chats individuales
                  const possibleNumber = chat.id._serialized.split('@')[0];
                  if (possibleNumber && possibleNumber.length >= 10) {
                    this.phoneNumber = possibleNumber;
                    console.log(`📱 Número detectado desde chats: ${this.phoneNumber}`);
                    break;
                  }
                }
              }
              
              console.log('🎉 CONEXIÓN ESTABLECIDA CON ÉXITO');
              this.handleConnectionReady();
              return;
              
            } catch (chatError) {
              console.log('⚠️ No se pueden obtener chats, intentando método 2...');
            }
            
            // Método 2: Verificar URL de la página
            if (this.client.pupPage && !this.client.pupPage.isClosed()) {
              try {
                const url = await this.client.pupPage.url();
                console.log(`🌐 URL actual: ${url}`);
                
                if (url.includes('whatsapp.com')) {
                  console.log('✅ CONEXIÓN CONFIRMADA - URL válida de WhatsApp');
                  this.isConnected = true;
                  this.lastSeen = new Date();
                  this.qrCode = '';
                  this.persistentQR = '';
                  
                  // Intentar obtener número desde la página
                  try {
                    console.log('📱 Intentando extraer número de teléfono...');
                    const phoneNumber = await this.extractPhoneFromPage();
                    if (phoneNumber) {
                      this.phoneNumber = phoneNumber;
                      console.log(`📱 Número extraído de la página: ${phoneNumber}`);
                    } else {
                      this.phoneNumber = 'connected-user';
                    }
                  } catch (error) {
                    console.log('⚠️ Error extrayendo número, usando placeholder');
                    this.phoneNumber = 'whatsapp-connected';
                  }
                  
                  console.log('🎉 CONEXIÓN ESTABLECIDA VÍA URL');
                  this.handleConnectionReady();
                  return;
                }
              } catch (urlError) {
                console.log('⚠️ Error verificando URL:', urlError);
              }
            }
            
            // Método 3: Asumir conexión si llegamos hasta aquí (última opción)
            console.log('⚠️ No se pudo confirmar funcionalidad, pero cliente autenticado - asumiendo conexión');
            this.isConnected = true;
            this.phoneNumber = 'assumed-connected';
            this.lastSeen = new Date();
            this.qrCode = '';
            this.persistentQR = '';
            
            this.handleConnectionReady();
            
          } catch (error) {
            console.log('❌ Error verificando funcionalidad:', error);
            // Aun así, intentar manejar como conectado
            this.isConnected = true;
            this.phoneNumber = 'error-but-connected';
            this.lastSeen = new Date();
            this.handleConnectionReady();
          }
        }, 3000); // 3 segundos de espera inicial
      });

      this.client.on('ready', () => {
        console.log(`✅ CLIENTE WHATSAPP CONECTADO Y LISTO para sesión ${this.sessionId}!`);
        console.log('🔍 Estado del cliente en evento ready:', {
          hasInfo: !!this.client?.info,
          hasWid: !!this.client?.info?.wid,
          hasUser: !!this.client?.info?.wid?.user,
          userValue: this.client?.info?.wid?.user || 'no-user'
        });
        this.handleConnectionReady();
      });

      this.client.on('disconnected', (reason) => {
        console.log(`❌ Cliente WhatsApp desconectado para sesión ${this.sessionId}:`, reason);
        console.log('🔍 Detalles de desconexión:', {
          sessionId: this.sessionId,
          reason: reason,
          timestamp: new Date().toISOString(),
          previousState: {
            isConnected: this.isConnected,
            phoneNumber: this.phoneNumber
          }
        });
        
        this.isConnected = false;
        this.phoneNumber = '';
        this.lastSeen = null;
        this.qrCode = '';
        this.persistentQR = '';
        
        // Limpiar estado global también
        if (globalThis.whatsappGlobalState) {
          globalThis.whatsappGlobalState = null;
        }
        
        // Limpiar sesión
        if ((globalThis as any).whatsappSessions[this.sessionId]) {
          (globalThis as any).whatsappSessions[this.sessionId].state = {
            isConnected: false,
            phoneNumber: '',
            lastSeen: null
          };
        }
        
        // Detener monitoreo de salud
        this.stopHealthMonitoring();
        
        console.log(`🧹 Estado limpiado tras desconexión de sesión ${this.sessionId}`);
        
        // Intentar reconexión automática después de un delay
        setTimeout(() => {
          console.log(`🔄 Intentando reconexión automática para sesión ${this.sessionId}...`);
          this.attemptReconnection();
        }, 5000); // 5 segundos de delay
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
    
    // Primero revisar el estado interno
    const status: WhatsAppStatus = {
      isConnected: this.isConnected,
      phoneNumber: this.phoneNumber || '',
      lastSeen: this.lastSeen || null,
      qrCode: this.isConnected ? '' : (this.qrCode || this.persistentQR || '')
    };
    
    // Si hay info del cliente disponible, usarla
    if (this.client?.info?.wid?.user) {
      console.log('📊 Cliente info disponible:', this.client.info.wid.user);
      status.phoneNumber = this.client.info.wid.user;
    } else {
      console.log('📊 Cliente info: No disponible, usando estado guardado');
    }
    
    console.log('📊 Estado guardado - isConnected:', status.isConnected, 'phone:', status.phoneNumber);
    
    if (status.isConnected) {
      console.log('📊 ESTADO FINAL (CONECTADO):', { 
        isConnected: status.isConnected, 
        qrLength: 0, 
        phoneNumber: status.phoneNumber 
      });
    } else {
      console.log('📊 ESTADO FINAL (NO CONECTADO):', { 
        isConnected: status.isConnected, 
        qrLength: status.qrCode.length || 0, 
        phoneNumber: status.phoneNumber 
      });
    }
    
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

      // Verificar funcionalidad real en lugar de solo info del cliente
      if (!this.isConnected) {
        console.log(`⚠️ [${this.sessionId}] Estado interno indica desconectado`);
        throw new Error('WhatsApp no está conectado');
      }

      // Verificación robusta del estado del cliente
      let clientValid = false;
      
      // Verificar si tenemos info del cliente
      if (this.client.info?.wid?.user) {
        console.log(`✅ [${this.sessionId}] Cliente con info completa: ${this.client.info.wid.user}`);
        clientValid = true;
      } else {
        console.log(`⚠️ [${this.sessionId}] Sin client.info, verificando funcionalidad...`);
        
        // Verificar que la página de Puppeteer esté activa
        try {
          if (!this.client.pupPage || this.client.pupPage.isClosed()) {
            throw new Error('Página de Puppeteer cerrada');
          }
          
          const url = await this.client.pupPage.url();
          if (!url.includes('whatsapp.com')) {
            throw new Error('Página no es WhatsApp');
          }
          
          // Verificar que podemos ejecutar código en la página
          const pageTitle = await this.client.pupPage.title();
          if (!pageTitle.toLowerCase().includes('whatsapp')) {
            throw new Error('Página no es WhatsApp válida');
          }
          
          console.log(`✅ [${this.sessionId}] Página WhatsApp válida: ${pageTitle}`);
          clientValid = true;
          
        } catch (pageError) {
          const errorMessage = pageError instanceof Error ? pageError.message : 'Error desconocido';
          console.log(`❌ [${this.sessionId}] Error verificando página: ${errorMessage}`);
          
          // Intentar verificar con getChats como último recurso
          try {
            const chats = await this.client.getChats();
            if (chats && chats.length >= 0) {
              console.log(`✅ [${this.sessionId}] Cliente funcional - acceso a ${chats.length} chats`);
              clientValid = true;
            }
          } catch (chatError) {
            const chatErrorMessage = chatError instanceof Error ? chatError.message : 'Error desconocido';
            console.log(`❌ [${this.sessionId}] Cliente no funcional: ${chatErrorMessage}`);
            throw new Error('Cliente WhatsApp en estado zombie - requiere nueva autenticación con QR');
          }
        }
      }
      
      if (!clientValid) {
        throw new Error('Cliente WhatsApp no válido');
      }

      // Verificar que el cliente esté listo
      if (!this.client.pupPage) {
        console.log(`⚠️ [${this.sessionId}] Cliente no está listo (sin página Puppeteer)`);
        throw new Error('WhatsApp no está listo para enviar mensajes');
      }

      // Verificación adicional: asegurar que WhatsApp Web esté completamente listo
      console.log(`🔍 [${this.sessionId}] Verificando estado completo de WhatsApp Web...`);
      
      try {
        // Esperar un momento para estabilización
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar que la página esté en el estado correcto (sin timeout estricto)
        try {
          await this.client.pupPage.waitForSelector('[data-testid="compose-box-input"]', { 
            timeout: 3000 
          });
          console.log(`✅ [${this.sessionId}] WhatsApp Web completamente cargado`);
        } catch (e) {
          console.log(`⚠️ [${this.sessionId}] Compose box no encontrado, continuando envío...`);
        }
        
      } catch (readyError) {
        console.log(`⚠️ [${this.sessionId}] WhatsApp Web no está completamente listo, intentando envío directo...`);
      }

      // Formatear número de teléfono
      const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      console.log(`📱 [${this.sessionId}] Enviando a: ${formattedPhone}`);

      // Envío solo texto con reintentos
      console.log(`💬 [${this.sessionId}] Enviando mensaje de texto`);
      
      let result;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Verificar estado de conexión antes de cada intento
          console.log(`🔍 [${this.sessionId}] Verificando conexión antes del intento ${attempt}...`);
          
          if (!this.client.pupPage) {
            throw new Error('Cliente desconectado: Sin página Puppeteer');
          }
          
          // Verificar si hay QR activo (indica desconexión)
          if ((globalThis as any).whatsappQR && (globalThis as any).whatsappQR[this.sessionId]) {
            throw new Error('Cliente desconectado: QR activo detectado');
          }
          
          // Verificar URL de WhatsApp
          const url = await this.client.pupPage.url();
          if (!url.includes('web.whatsapp.com')) {
            throw new Error(`Cliente desconectado: URL inválida ${url}`);
          }
          
          console.log(`✅ [${this.sessionId}] Conexión verificada para intento ${attempt}`);
          result = await this.client.sendMessage(formattedPhone, message);
          break; // Si tiene éxito, salir del bucle
          
        } catch (sendError: any) {
          console.log(`⚠️ [${this.sessionId}] Intento ${attempt}/3 falló:`, sendError.message);
          
          // Si el error es de desconexión, no reintentar
          if (sendError.message.includes('desconectado') || sendError.message.includes('QR activo')) {
            console.log(`❌ [${this.sessionId}] Desconexión detectada, abortando reintentos`);
            throw new Error(`WhatsApp desconectado durante envío: ${sendError.message}`);
          }
          
          // Detectar cliente en estado "zombie" - página cargada pero objetos no inicializados
          if (sendError.message.includes("Cannot read properties of undefined (reading 'getChat')") ||
              sendError.message.includes("Cannot read properties of undefined (reading 'getChats')") ||
              sendError.message.includes("Cannot read properties of undefined")) {
            console.log(`🧟 [${this.sessionId}] Cliente en estado zombie detectado - requiere reinicialización completa`);
            
            // DESTRUCCIÓN COMPLETA del cliente zombie
            console.log(`💀 [${this.sessionId}] Destruyendo cliente zombie completamente...`);
            
            // Destruir cliente actual
            if (this.client) {
              try {
                await this.client.destroy();
                console.log(`💀 [${this.sessionId}] Cliente destruido exitosamente`);
              } catch (destroyError) {
                console.log(`⚠️ [${this.sessionId}] Error destruyendo cliente:`, destroyError);
              }
            }
            
            // Limpiar completamente el estado global y de sesión
            this.client = null as any;
            this.isConnected = false;
            this.phoneNumber = '';
            this.qrCode = '';
            this.persistentQR = '';
            
            // Limpiar referencias globales
            if ((globalThis as any).whatsappClients) {
              delete (globalThis as any).whatsappClients[this.sessionId];
            }
            if ((globalThis as any).whatsappSessions) {
              delete (globalThis as any).whatsappSessions[this.sessionId];
            }
            
            console.log(`🧹 [${this.sessionId}] Estado completamente limpiado tras zombie`);
            
            throw new Error('Cliente WhatsApp en estado zombie - requiere nueva autenticación con QR');
          }
          
          if (attempt === 3) {
            throw sendError; // Si es el último intento, lanzar el error
          }
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
      
      if (result) {
        console.log(`✅ [${this.sessionId}] Texto enviado exitosamente:`, result.id._serialized);
      }

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

  // Método para verificar si un número existe en WhatsApp con manejo de rate limiting
  async isNumberValid(phone: string): Promise<boolean> {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 segundo base
    
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

      // Limpiar el número de teléfono
      let cleanPhone = phone.replace(/\D/g, '');
      
      console.log(`🔧 [${this.sessionId}] Número original: ${phone}, limpio: ${cleanPhone}`);
      
      // Validaciones básicas del número
      if (!cleanPhone || cleanPhone.length < 8) { // Reducido de 10 a 8 para ser menos estricto
        console.log(`❌ [${this.sessionId}] Número ${phone} demasiado corto o inválido (mín 8 dígitos)`);
        return false;
      }
      
      // Agregar código de país colombiano si no existe y el número parece colombiano
      if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
        cleanPhone = '57' + cleanPhone;
        console.log(`🔧 [${this.sessionId}] Agregado código de país: ${cleanPhone}`);
      }
      
      // Verificar patrones de números claramente inválidos (más flexible)
      if (cleanPhone.match(/^(0{8,}|1{8,}|2{8,}|3{8,}|4{8,}|5{8,}|6{8,}|7{8,}|8{8,}|9{8,})$/)) {
        console.log(`❌ [${this.sessionId}] Número ${phone} es un patrón repetitivo inválido`);
        return false;
      }
      
      // Verificar números colombianos específicos que sabemos son inválidos
      if (cleanPhone === '573000000000' || cleanPhone === '3000000000' || cleanPhone === '65787423123') {
        console.log(`❌ [${this.sessionId}] Número ${phone} está en lista de números inválidos conocidos`);
        return false;
      }
      
      // Implementar reintentos con backoff exponencial para manejar rate limiting
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`🔍 [${this.sessionId}] Intento ${attempt}/${MAX_RETRIES} verificando número: ${cleanPhone}`);
          
          // Usar getNumberId que es más preciso para verificar si el número está registrado
          const numberId = await this.client.getNumberId(cleanPhone);
          
          if (numberId && numberId.user) {
            console.log(`✅ [${this.sessionId}] Número ${phone} verificado como VÁLIDO en WhatsApp`);
            return true;
          } else {
            console.log(`❌ [${this.sessionId}] Número ${phone} NO está registrado en WhatsApp`);
            return false;
          }
          
        } catch (numberError: any) {
          const errorMessage = numberError.message || '';
          console.log(`⚠️ [${this.sessionId}] Error en intento ${attempt}: ${errorMessage}`);
          
          // Detectar errores de rate limiting
          if (errorMessage.includes('rate') || 
              errorMessage.includes('limit') || 
              errorMessage.includes('too many') ||
              errorMessage.includes('429') ||
              errorMessage.includes('throttle')) {
            
            if (attempt < MAX_RETRIES) {
              const delay = BASE_DELAY * Math.pow(2, attempt - 1); // Backoff exponencial
              console.log(`⏳ [${this.sessionId}] Rate limiting detectado, esperando ${delay}ms antes del siguiente intento...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; // Reintentar
            } else {
              console.log(`❌ [${this.sessionId}] Rate limiting persistente después de ${MAX_RETRIES} intentos`);
              // En caso de rate limiting persistente, asumir que el número es válido
              // para evitar falsos negativos
              console.log(`⚠️ [${this.sessionId}] Asumiendo número ${phone} como VÁLIDO debido a rate limiting`);
              return true;
            }
          }
          
          // Para otros errores, si es el último intento, marcar como inválido
          if (attempt === MAX_RETRIES) {
            console.log(`❌ [${this.sessionId}] Error final verificando número ${phone}: ${errorMessage}`);
            return false;
          }
          
          // Para otros errores, esperar un poco antes del siguiente intento
          const delay = BASE_DELAY * attempt;
          console.log(`⏳ [${this.sessionId}] Esperando ${delay}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Si llegamos aquí, algo salió mal
      console.log(`❌ [${this.sessionId}] No se pudo verificar número ${phone} después de ${MAX_RETRIES} intentos`);
      return false;
      
    } catch (error) {
      console.error(`❌ [${this.sessionId}] Error crítico verificando número ${phone}:`, error);
      // En caso de error crítico, asumir válido para evitar bloquear el envío
      console.log(`⚠️ [${this.sessionId}] Asumiendo número ${phone} como VÁLIDO debido a error crítico`);
      return true;
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
      console.log(`🔍 Forzando verificación de conexión para sesión ${this.sessionId}...`);
      console.log('🔍 Forzando verificación de conexión...');
      console.log('📊 Estado actual guardado:', { 
        isConnected: this.isConnected, 
        phoneNumber: this.phoneNumber,
        hasClient: !!this.client 
      });
      
      // Verificación mejorada del cliente actual
      if (this.client) {
        // Verificar múltiples formas de detectar la conexión
        const hasUserInfo = !!this.client.info?.wid?.user;
        const isClientReady = this.client.pupPage && !this.client.pupPage.isClosed();
        
        console.log('🔍 Verificaciones del cliente:', {
          hasUserInfo,
          isClientReady,
          clientInfo: this.client.info?.wid?.user || 'No disponible'
        });
        
        if (hasUserInfo && !this.isConnected) {
          console.log('🎉 ¡CONEXIÓN NUEVA DETECTADA EN VERIFICACIÓN FORZADA!');
          this.handleConnectionReady();
          return this.getStatus();
        }
      }
      
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
    
    // Verificar que el cliente siga siendo válido antes de guardarlo
    if (this.client && (!this.client.pupPage || this.client.pupPage.isClosed())) {
      console.log(`⚠️ Cliente inválido detectado al guardar sesión ${this.sessionId}, limpiando...`);
      this.client = null;
    }
    
    (globalThis as any).whatsappSessions[this.sessionId].client = this.client;
    (globalThis as any).whatsappSessions[this.sessionId].state = {
      isConnected: this.isConnected,
      phoneNumber: this.phoneNumber,
      lastSeen: this.lastSeen,
      savedAt: new Date() // Timestamp de cuando se guardó
    };
    
    console.log(`💾 Estado guardado para sesión ${this.sessionId}:`, {
      ...((globalThis as any).whatsappSessions[this.sessionId].state),
      hasValidClient: !!(this.client && this.client.pupPage && !this.client.pupPage.isClosed())
    });
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

  // Método para manejar cuando la conexión está lista
  private async handleConnectionReady() {
    console.log(`🎉 Manejando conexión lista para sesión ${this.sessionId}...`);
    
    let phoneNumber = this.client?.info?.wid?.user || '';
    const now = new Date();
    
    // Si no tenemos el número desde client.info, intentar extraerlo de la página
    if (!phoneNumber || phoneNumber === '') {
      console.log('📱 Número no disponible en client.info, intentando extraer de la página...');
      try {
        const extractedPhone = await this.extractPhoneFromPage();
        if (extractedPhone) {
          phoneNumber = extractedPhone;
          console.log(`📱 Número extraído exitosamente: ${phoneNumber}`);
        } else {
          // Intentar obtener desde chats como último recurso
          try {
            const chats = await this.client!.getChats();
            console.log(`📱 Intentando obtener número desde ${chats.length} chats...`);
            
            // Buscar mi propio número en los chats
            for (const chat of chats.slice(0, 20)) {
              if (chat.id && chat.id._serialized) {
                // Buscar chats individuales (terminan en @c.us)
                if (chat.id._serialized.includes('@c.us') && !chat.isGroup) {
                  const possibleNumber = chat.id._serialized.split('@')[0];
                  if (possibleNumber && possibleNumber.length >= 10 && possibleNumber.match(/^\d+$/)) {
                    phoneNumber = `+${possibleNumber}`;
                    console.log(`📱 Número detectado desde chat: ${phoneNumber}`);
                    break;
                  }
                }
              }
            }
          } catch (chatError) {
            console.log('⚠️ No se pudo obtener número desde chats:', chatError);
          }
          
          // Si aún no tenemos número, usar un placeholder más descriptivo
          if (!phoneNumber || phoneNumber === '') {
            phoneNumber = 'WhatsApp-Conectado';
            console.log('📱 Usando placeholder para número: WhatsApp-Conectado');
          }
        }
      } catch (error) {
        console.log('⚠️ Error extrayendo número:', error);
        phoneNumber = 'WhatsApp-Conectado';
      }
    }
    
    this.isConnected = true;
    this.qrCode = '';
    this.persistentQR = '';
    this.phoneNumber = phoneNumber;
    this.lastSeen = now;
    
    console.log(`🎉 WhatsApp conectado exitosamente como: ${this.phoneNumber}`);
    console.log('💾 Estado actualizado - Cliente activo y listo');
    
    // Guardar en estado global con timestamp
    globalThis.whatsappGlobalState = {
      isConnected: true,
      phoneNumber: this.phoneNumber,
      lastSeen: this.lastSeen
    };
    
    // Guardar referencia del cliente global - CRITICO para persistencia
    globalThis.whatsappGlobalClient = this.client;
    console.log('🔒 CLIENTE GUARDADO EN REFERENCIA GLOBAL TRAS CONEXIÓN');
    
    // Actualizar TODAS las instancias del singleton con este cliente
    for (const [sessionId, instance] of Object.entries(WhatsAppService.instances)) {
      if (instance && sessionId === this.sessionId) {
        instance.client = this.client;
        instance.isConnected = this.isConnected;
        instance.phoneNumber = this.phoneNumber;
        instance.lastSeen = this.lastSeen;
        console.log(`🔄 Instancia ${sessionId} sincronizada con cliente conectado`);
      }
    }
    
    // Asegurar que la referencia de sesión esté actualizada
    this.saveSessionState();
    console.log(`🔒 Cliente conectado guardado en sesión ${this.sessionId}`);
    
    // CRÍTICO: Notificar cambio de estado al frontend
    try {
      console.log('📢 Notificando cambio de conexión al frontend...');
      notifyConnectionChange({
        isConnected: this.isConnected,
        qrCode: this.qrCode,
        phoneNumber: this.phoneNumber,
        lastSeen: this.lastSeen
      });
      console.log('✅ Frontend notificado del cambio de estado');
    } catch (notifyError) {
      console.log('⚠️ Error notificando al frontend:', notifyError);
    }

    // NUEVO: Intentar actualizar el número después de un delay si está vacío
    if (!this.phoneNumber || this.phoneNumber === 'WhatsApp-Conectado') {
      console.log('📱 Programando actualización del número en 5 segundos...');
      setTimeout(async () => {
        await this.updatePhoneNumberAfterConnection();
      }, 5000);
    }
    
    // Log detallado del estado final
    console.log(`📊 Estado final de conexión:`, {
      sessionId: this.sessionId,
      isConnected: this.isConnected,
      phoneNumber: this.phoneNumber,
      timestamp: now.toISOString(),
      hasClient: !!this.client,
      hasGlobalClient: !!globalThis.whatsappGlobalClient,
      hasGlobalState: !!globalThis.whatsappGlobalState,
      globalClientPhone: globalThis.whatsappGlobalClient?.info?.wid?.user || 'No disponible'
    });
    
    // Notificar cambio de conexión al frontend
    this.notifyConnectionChange();
    
    // Iniciar monitoreo de salud de la conexión
    this.startHealthMonitoring();
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

  // Método para iniciar monitoreo de salud de la conexión
  private startHealthMonitoring() {
    // Limpiar intervalo previo si existe
    this.stopHealthMonitoring();
    
    console.log(`🔍 Iniciando monitoreo de salud para sesión ${this.sessionId}`);
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Verificar cada 30 segundos
  }

  // Método para detener monitoreo de salud
  private stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log(`⏹️ Monitoreo de salud detenido para sesión ${this.sessionId}`);
    }
  }

  // Método para verificar salud de la conexión
  private async performHealthCheck() {
    try {
      this.lastHealthCheck = new Date();
      
      if (!this.client) {
        console.log(`⚠️ Health Check: No hay cliente para sesión ${this.sessionId}`);
        return;
      }
      
      // Verificar si la página de Puppeteer sigue activa
      if (!this.client.pupPage || this.client.pupPage.isClosed()) {
        console.log(`❌ Health Check: Página de Puppeteer cerrada para sesión ${this.sessionId}`);
        this.handleConnectionLoss();
        return;
      }
      
      // Verificar funcionalidad real en lugar de solo info del usuario
      if (this.isConnected) {
        try {
          // Intentar una operación real para verificar funcionalidad
          const chats = await this.client.getChats();
          if (chats && chats.length >= 0) {
            console.log(`✅ Health Check: Cliente funcional - acceso a ${chats.length} chats`);
          } else {
            console.log(`⚠️ Health Check: No se pueden obtener chats, pero cliente existe`);
          }
        } catch (chatError) {
          console.log(`⚠️ Health Check: Error accediendo chats, verificando URL...`);
          
          // Verificación alternativa por URL
          try {
            const url = await this.client.pupPage.url();
            if (url.includes('whatsapp.com')) {
              console.log(`✅ Health Check: Página WhatsApp activa (${url})`);
            } else {
              console.log(`❌ Health Check: Página no es WhatsApp (${url})`);
              this.handleConnectionLoss();
              return;
            }
          } catch (urlError) {
            console.log(`❌ Health Check: No se puede verificar URL, asumiendo pérdida de conexión`);
            this.handleConnectionLoss();
            return;
          }
        }
      }
      
      // Si llegamos aquí, la conexión parece saludable
      if (this.isConnected) {
        console.log(`✅ Health Check: Conexión saludable para sesión ${this.sessionId}`);
      }
      
    } catch (error) {
      console.log(`❌ Health Check Error para sesión ${this.sessionId}:`, error);
      this.handleConnectionLoss();
    }
  }

  // Método para manejar pérdida de conexión detectada
  private handleConnectionLoss() {
    console.log(`🔍 Manejando pérdida de conexión para sesión ${this.sessionId}`);
    
    // Actualizar estado
    this.isConnected = false;
    this.phoneNumber = '';
    this.lastSeen = null;
    
    // Limpiar estados globales
    if (globalThis.whatsappGlobalState) {
      globalThis.whatsappGlobalState = null;
    }
    
    // Actualizar sesión
    this.saveSessionState();
    
    // Notificar al frontend
    this.notifyConnectionChange();
    
    // Intentar reconexión
    setTimeout(() => {
      this.attemptReconnection();
    }, 2000);
  }

  // Método para intentar reconexión automática
  private async attemptReconnection() {
    try {
      console.log(`🔄 Intentando reconexión automática para sesión ${this.sessionId}...`);
      
      // Solo intentar si no estamos ya conectados
      if (this.isConnected) {
        console.log(`✅ Ya conectado, no es necesaria reconexión para sesión ${this.sessionId}`);
        return;
      }
      
      // Verificar si hay cliente global disponible
      if (globalThis.whatsappGlobalClient && globalThis.whatsappGlobalClient.info?.wid?.user) {
        console.log(`🔄 Restaurando desde cliente global para sesión ${this.sessionId}`);
        this.client = globalThis.whatsappGlobalClient;
        this.handleConnectionReady();
        return;
      }
      
      // Si no hay cliente global, intentar reconectar usando la sesión guardada
      await this.initialize();
      
    } catch (error) {
      console.log(`❌ Error en reconexión automática para sesión ${this.sessionId}:`, error);
    }
  }

  // Método para actualizar el número después de la conexión
  private async updatePhoneNumberAfterConnection(): Promise<void> {
    try {
      console.log('🔄 Intentando actualizar número de teléfono después de la conexión...');
      
      if (!this.client || !this.isConnected) {
        console.log('⚠️ Cliente no disponible o no conectado, saltando actualización');
        return;
      }

      // Intentar obtener desde client.info primero
      let phoneNumber = this.client?.info?.wid?.user || '';
      
      if (!phoneNumber) {
        // Intentar extraer desde la página
        phoneNumber = await this.extractPhoneFromPage() || '';
      }

      if (!phoneNumber) {
        // Intentar desde chats
        try {
          const chats = await this.client.getChats();
          console.log(`📱 Buscando número en ${chats.length} chats...`);
          
          for (const chat of chats.slice(0, 10)) {
            if (chat.id && chat.id._serialized && chat.id._serialized.includes('@c.us') && !chat.isGroup) {
              const possibleNumber = chat.id._serialized.split('@')[0];
              if (possibleNumber && possibleNumber.length >= 10 && possibleNumber.match(/^\d+$/)) {
                phoneNumber = `+${possibleNumber}`;
                console.log(`📱 Número detectado desde chat: ${phoneNumber}`);
                break;
              }
            }
          }
        } catch (chatError) {
          console.log('⚠️ Error obteniendo chats:', chatError);
        }
      }

      if (phoneNumber && phoneNumber !== this.phoneNumber) {
        console.log(`📱 Actualizando número: ${this.phoneNumber} → ${phoneNumber}`);
        this.phoneNumber = phoneNumber;
        
        // Actualizar estado global
        if (globalThis.whatsappGlobalState) {
          globalThis.whatsappGlobalState.phoneNumber = phoneNumber;
        }
        
        // Guardar estado
        this.saveSessionState();
        
        // Notificar al frontend
        try {
          notifyConnectionChange({
            isConnected: this.isConnected,
            qrCode: this.qrCode,
            phoneNumber: this.phoneNumber,
            lastSeen: this.lastSeen
          });
          console.log('✅ Frontend notificado con número actualizado');
        } catch (notifyError) {
          console.log('⚠️ Error notificando actualización:', notifyError);
        }
      } else if (!phoneNumber) {
        console.log('❌ No se pudo obtener el número de teléfono');
      } else {
        console.log('✅ Número ya está actualizado');
      }
    } catch (error) {
      console.log('❌ Error actualizando número:', error);
    }
  }

  // Método para extraer número de teléfono desde la página
  private async extractPhoneFromPage(): Promise<string | null> {
    if (!this.client?.pupPage || this.client.pupPage.isClosed()) {
      return null;
    }

    try {
      console.log('🔍 Intentando extraer número de teléfono desde WhatsApp Web...');
      
      // Esperar un poco para que la página se cargue, pero no depender de selectores específicos
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Intentar múltiples métodos para encontrar el número
      const phoneNumber = await this.client.pupPage.evaluate(() => {
        console.log('🔍 Ejecutando extracción en el navegador...');
        
        // Método 1: Buscar en el título de la página
        const title = document.title;
        console.log('📄 Título de la página:', title);
        if (title) {
          const titleMatch = title.match(/\+?\d{10,15}/);
          if (titleMatch) {
            console.log('✅ Número encontrado en título:', titleMatch[0]);
            return titleMatch[0];
          }
        }

        // Método 2: Buscar en meta tags
        const metaTags = Array.from(document.querySelectorAll('meta'));
        for (const meta of metaTags) {
          const content = meta.getAttribute('content') || '';
          if (content.includes('+') || content.match(/\d{10,15}/)) {
            const metaMatch = content.match(/\+?\d{10,15}/);
            if (metaMatch) {
              console.log('✅ Número encontrado en meta:', metaMatch[0]);
              return metaMatch[0];
            }
          }
        }

        // Método 3: Buscar en elementos del header/perfil
        const profileSelectors = [
          '[data-testid="default-user"]',
          '[data-testid="conversation-info-header"]',
          '[data-testid="chat-header"]',
          'header [title]',
          'header [aria-label]',
          '[role="banner"] [title]',
          '[data-testid="contact-info"]'
        ];

        for (const selector of profileSelectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          for (const element of elements) {
            const text = element.textContent || element.getAttribute('title') || element.getAttribute('aria-label') || '';
            if (text) {
              const match = text.match(/\+?\d{10,15}/);
              if (match) {
                console.log('✅ Número encontrado en perfil:', match[0], 'selector:', selector);
                return match[0];
              }
            }
          }
        }

        // Método 4: Buscar en elementos que contengan números de teléfono (más específico)
        const phonePatterns = [
          /\+57\s?\d{10}/g,          // +57 3001234567 (Colombia específico)
          /\+\d{1,3}\s?\d{10,12}/g,  // +57 3001234567
          /\+\d{11,15}/g,            // +573001234567
          /57\d{10}/g,               // 573001234567
          /\d{10}/g                  // 3001234567
        ];

        // Buscar en elementos específicos primero
        const specificSelectors = [
          'div[data-testid*="user"]',
          'div[data-testid*="profile"]',
          'span[title*="+"]',
          'div[title*="+"]',
          '[aria-label*="+"]',
          'header span',
          'header div'
        ];

        for (const selector of specificSelectors) {
          try {
            const elements = Array.from(document.querySelectorAll(selector));
            for (const element of elements) {
              const text = element.textContent || element.getAttribute('title') || element.getAttribute('aria-label') || '';
              for (const pattern of phonePatterns) {
                const matches = text.match(pattern);
                if (matches) {
                  for (const match of matches) {
                    const cleanNumber = match.replace(/\s/g, '');
                    if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
                      console.log('✅ Número encontrado en elemento específico:', cleanNumber, 'selector:', selector);
                      return cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;
                    }
                  }
                }
              }
            }
          } catch (e) {
            // Continuar con el siguiente selector
          }
        }

        // Buscar en todos los elementos como último recurso (limitado)
        const textElements = Array.from(document.querySelectorAll('*')).slice(0, 500).filter(el => 
          el.textContent && 
          el.textContent.trim().length > 0 && 
          el.children.length === 0 // Solo elementos hoja
        );

        for (const element of textElements) {
          const text = element.textContent || '';
          // Solo buscar números que parezcan colombianos
          const colombianMatch = text.match(/(\+?57\s?\d{10}|\+?\d{10})/);
          if (colombianMatch) {
            const cleanNumber = colombianMatch[0].replace(/\s/g, '');
            if (cleanNumber.length >= 10 && cleanNumber.length <= 13) {
              console.log('✅ Número colombiano encontrado:', cleanNumber);
              return cleanNumber.startsWith('+') ? cleanNumber : `+57${cleanNumber.replace(/^57/, '')}`;
            }
          }
        }

        // Método 5: Buscar en localStorage o sessionStorage
        try {
          const storageKeys = Object.keys(localStorage);
          for (const key of storageKeys) {
            const value = localStorage.getItem(key) || '';
            if (value.includes('wid') || value.includes('user') || value.includes('phone')) {
              const storageMatch = value.match(/\+?\d{10,15}/);
              if (storageMatch) {
                console.log('✅ Número encontrado en localStorage:', storageMatch[0]);
                return storageMatch[0];
              }
            }
          }
        } catch (e) {
          console.log('⚠️ No se pudo acceder a localStorage');
        }

        console.log('❌ No se pudo encontrar el número de teléfono');
        return null;
      });

      if (phoneNumber) {
        console.log(`✅ Número extraído exitosamente: ${phoneNumber}`);
        return phoneNumber;
      } else {
        console.log('❌ No se pudo extraer el número de teléfono');
        return null;
      }
    } catch (error) {
      console.log('❌ Error extrayendo número de teléfono:', error);
      return null;
    }
  }

  // Método auxiliar para obtener chats filtrando por función específica
  private async tryAlternativeDetection(): Promise<void> {
    try {
      console.log('🔍 Intentando detectar conexión por métodos alternativos...');
      
      if (!this.client) {
        console.log('❌ No hay cliente disponible para detección alternativa');
        return;
      }
      
      // Método 1: Intentar obtener información del chat
      try {
        const chats = await this.client.getChats();
        if (chats && chats.length > 0) {
          console.log('✅ Cliente puede acceder a chats - conexión activa');
          
          // Intentar obtener info del usuario desde los chats
          for (const chat of chats.slice(0, 5)) {
            if (chat.name) {
              console.log('📱 Chat encontrado:', chat.name || chat.id._serialized);
            }
          }
          
          // Si podemos acceder a chats, asumir conectado
          this.isConnected = true;
          this.phoneNumber = 'connected-via-chats';
          this.lastSeen = new Date();
          this.notifyConnectionChange();
          this.startHealthMonitoring();
          return;
        }
      } catch (chatError) {
        console.log('⚠️ No se pueden obtener chats:', chatError);
      }
      
      // Método 2: Verificar estado de la página
      if (this.client.pupPage && !this.client.pupPage.isClosed()) {
        console.log('✅ Página de WhatsApp activa, verificando URL...');
        try {
          const url = await this.client.pupPage.url();
          console.log('🌐 URL actual:', url);
          if (url.includes('whatsapp.com')) {
            console.log('✅ URL indica conexión activa');
            this.isConnected = true;
            this.phoneNumber = 'connected-via-url';
            this.lastSeen = new Date();
            this.notifyConnectionChange();
            this.startHealthMonitoring();
          }
        } catch (urlError) {
          console.log('⚠️ Error obteniendo URL:', urlError);
        }
      }
      
    } catch (error: any) {
      console.log('❌ Error en detección alternativa:', error);
    }
  }

  // Método para obtener información de salud de la conexión
  public getHealthInfo() {
    return {
      sessionId: this.sessionId,
      isConnected: this.isConnected,
      phoneNumber: this.phoneNumber,
      lastSeen: this.lastSeen,
      lastHealthCheck: this.lastHealthCheck,
      hasClient: !!this.client,
      hasValidClient: !!(this.client && this.client.pupPage && !this.client.pupPage.isClosed()),
      monitoringActive: !!this.healthCheckInterval
    };
  }

  // Método destroy para compatibilidad con IWhatsAppService
  public async destroy(): Promise<void> {
    console.log(`🔥 Destruyendo cliente WhatsApp para sesión: ${this.sessionId}`);
    
    try {
      // Detener monitoreo de salud
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      // Destruir cliente
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (error) {
          console.log('⚠️ Error al destruir cliente:', error);
        }
        this.client = null;
      }
      
      // Limpiar estado
      this.isConnected = false;
      this.phoneNumber = '';
      this.qrCode = '';
      this.persistentQR = '';
      this.lastSeen = null;
      this.lastHealthCheck = null;
      
      // Limpiar referencia global
      if ((globalThis as any).whatsappClients && (globalThis as any).whatsappClients[this.sessionId]) {
        delete (globalThis as any).whatsappClients[this.sessionId];
      }
      
      console.log(`✅ Cliente destruido completamente para sesión: ${this.sessionId}`);
      
    } catch (error) {
      console.error(`❌ Error durante destrucción de sesión ${this.sessionId}:`, error);
      throw error;
    }
  }
}