import express from 'express';
import cors from 'cors';
import { makeWASocket, DisconnectReason, useMultiFileAuthState, isJidBroadcast } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import excelRouter from './routes/excel.js';
import messagesRouter from './routes/messages.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// WhatsApp connection state
let whatsappClient = null;
let connectionStatus = 'disconnected';
let qrCodeData = null;
let qrCodeImage = null;
let phoneNumber = null;
let isConnecting = false;
let lastReconnectTime = 0;
let reconnectTimeout = null;
const RECONNECT_COOLDOWN = 10000; // 10 seconds cooldown between reconnect attempts

// Function to create WhatsApp connection
async function connectWhatsApp() {
    try {
        // Prevent multiple simultaneous connections
        if (isConnecting || connectionStatus === 'connected') {
            // Reduced logging to prevent spam
            return;
        }
        
        isConnecting = true;
        console.log('🚀 Iniciando conexión de WhatsApp...');
        
        // Use multi-file auth state for session persistence
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        
        // Reset connection variables
        connectionStatus = 'connecting';
        qrCodeData = null;
        qrCodeImage = null;
        phoneNumber = null;
        
        // Create WhatsApp socket with better error handling
        whatsappClient = makeWASocket({
            auth: state,
            printQRInTerminal: false, // We'll handle QR display manually
            logger: {
                level: 'silent',
                child: () => ({
                    level: 'silent',
                    child: () => ({}),
                    trace: () => {},
                    debug: () => {},
                    info: () => {},
                    warn: () => {},
                    error: () => {},
                    fatal: () => {}
                }),
                trace: () => {},
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {},
                fatal: () => {}
            },
            browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
            syncFullHistory: false,
            markOnlineOnConnect: true,
            shouldIgnoreJid: jid => isJidBroadcast(jid),
            shouldSyncHistoryMessage: msg => {
                return false; // Don't sync message history to reduce load
            }
        });

        // Handle connection updates
        whatsappClient.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 Código QR generado para el frontend');
                qrCodeData = qr;
                connectionStatus = 'QR_READY';
                
                // Generate QR code as base64 image for frontend
                try {
                    qrCodeImage = await QRCode.toDataURL(qr, {
                        width: 300,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    console.log('✅ QR generado como imagen base64 para frontend');
                } catch (error) {
                    console.error('Error generando QR como imagen:', error);
                    // Still save QR data even if image generation fails
                    qrCodeImage = null;
                }
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Conexión cerrada debido a:', lastDisconnect?.error);
                connectionStatus = 'disconnected';
                qrCodeData = null;
                qrCodeImage = null;
                phoneNumber = null;
                
                // Check if it's a 401 error (unauthorized)
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === 401) {
                    console.log('🔑 Error 401 detectado - Sesión expirada o inválida');
                    console.log('🧹 Limpiando datos de autenticación...');
                    isConnecting = false; // Reset flag on 401 errors
                    // Don't reconnect immediately on 401 errors
                    return;
                }
                
                if (shouldReconnect) {
                    console.log('🔄 Reconectando en 5 segundos...');
                    isConnecting = false; // Reset flag before reconnecting
                    
                    // Clear any existing reconnect timeout to prevent multiple attempts
                    if (reconnectTimeout) {
                        clearTimeout(reconnectTimeout);
                    }
                    
                    reconnectTimeout = setTimeout(() => {
                        reconnectTimeout = null;
                        connectWhatsApp();
                    }, 5000);
                } else {
                    isConnecting = false; // Reset flag if not reconnecting
                }
            } else if (connection === 'open') {
                connectionStatus = 'connected';
                isConnecting = false;
                console.log('✅ WhatsApp conectado exitosamente!');
                
                // Expose WhatsApp client globally for routes to access
                global.whatsappClient = whatsappClient;
                console.log('🌐 WhatsApp client exposed globally');
                
                // Extract phone number from the connected WhatsApp client
                try {
                    if (whatsappClient && whatsappClient.user) {
                        phoneNumber = whatsappClient.user.id.split('@')[0];
                        phoneNumber = `+${phoneNumber}`;
                        console.log('📱 Número conectado:', phoneNumber);
                    } else {
                        phoneNumber = 'Conectado';
                    }
                } catch (error) {
                    console.log('⚠️ No se pudo obtener el número de teléfono:', error.message);
                    phoneNumber = 'Conectado';
                }
            } else if (connection === 'connecting') {
                console.log('🔄 Conectando a WhatsApp...');
                connectionStatus = 'connecting';
            }
        });

        // Save credentials when updated
        whatsappClient.ev.on('creds.update', saveCreds);

        // Handle messages (optional - for future use)
        whatsappClient.ev.on('messages.upsert', (m) => {
            const message = m.messages[0];
            if (!message.key.fromMe && m.type === 'notify') {
                console.log('📨 Nuevo mensaje recibido de:', message.key.remoteJid);
                // Add a new line here
                console.log('Mensaje:', message.message);
            }
        });

    } catch (error) {
        console.log('❌ Error al conectar WhatsApp:', error);
        connectionStatus = 'error';
        qrCodeData = null;
        qrCodeImage = null;
        phoneNumber = null;
        isConnecting = false; // Reset flag on error
        
        // Don't auto-reconnect on errors, wait for manual trigger
        console.log('⏸️ Reconexión automática pausada. Usa el panel para reconectar.');
    }
}

// Routes
app.use('/api/excel', excelRouter);
app.use('/api/messages', messagesRouter);

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: connectionStatus,
        timestamp: new Date().toISOString(),
        hasQR: !!qrCodeData,
        phoneNumber: phoneNumber
    });
});

app.get('/api/qr', (req, res) => {
    if (qrCodeImage) {
        res.json({
            qr: qrCodeImage,
            qrText: qrCodeData,
            status: 'ready'
        });
    } else {
        res.json({
            qr: null,
            qrText: null,
            status: connectionStatus
        });
    }
});

app.post('/api/disconnect', (req, res) => {
    if (whatsappClient) {
        whatsappClient.logout();
        connectionStatus = 'disconnected';
        console.log('🔌 WhatsApp desconectado manualmente');
        res.json({ message: 'Desconectado exitosamente' });
    } else {
        res.json({ message: 'No hay conexión activa' });
    }
});

app.post('/api/reconnect', (req, res) => {
    const now = Date.now();
    
    // Check cooldown period
    if (now - lastReconnectTime < RECONNECT_COOLDOWN) {
        const remainingTime = Math.ceil((RECONNECT_COOLDOWN - (now - lastReconnectTime)) / 1000);
        console.log(`⏸️ Reconexión en cooldown. Espera ${remainingTime} segundos.`);
        return res.status(429).json({ 
            error: 'Reconexión en cooldown', 
            remainingTime: remainingTime 
        });
    }
    
    // Check if already connected or connecting
    if (connectionStatus === 'connected') {
        return res.json({ 
            message: 'WhatsApp ya está conectado',
            status: connectionStatus 
        });
    }
    
    if (isConnecting) {
        return res.json({ 
            message: 'Reconexión ya en proceso',
            status: connectionStatus 
        });
    }
    
    console.log('🔄 Solicitando reconexión desde:', req.ip || req.connection.remoteAddress);
    lastReconnectTime = now;
    connectWhatsApp();
    res.json({ message: 'Iniciando reconexión...' });
});

app.post('/api/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;
        
        if (!whatsappClient || connectionStatus !== 'connected') {
            return res.status(400).json({ 
                error: 'WhatsApp no está conectado',
                status: connectionStatus 
            });
        }

        if (!number || !message) {
            return res.status(400).json({ 
                error: 'Número y mensaje son requeridos' 
            });
        }

        // Format number for WhatsApp with Colombian country code
        const formattedNumber = formatColombianNumber(number);
        
        // Send message
        await whatsappClient.sendMessage(formattedNumber, { text: message });
        
        console.log(`📤 Mensaje enviado a ${number}: ${message}`);
        
        res.json({ 
            success: true, 
            message: 'Mensaje enviado exitosamente',
            to: number,
            text: message
        });
        
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        res.status(500).json({ 
            error: 'Error enviando mensaje',
            details: error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'WhatsApp Baileys Backend',
        uptime: process.uptime()
    });
});


// Function to format phone number for Colombia
function formatColombianNumber(number) {
    // Remove any existing formatting
    let cleanNumber = number.replace(/[^\d]/g, '');
    
    // If it starts with 57, it already has country code
    if (cleanNumber.startsWith('57')) {
        return cleanNumber + '@s.whatsapp.net';
    }
    
    // If it's a 10-digit Colombian mobile number, add 57
    if (cleanNumber.length === 10 && cleanNumber.startsWith('3')) {
        return '57' + cleanNumber + '@s.whatsapp.net';
    }
    
    // If it's already formatted with @, return as is
    if (number.includes('@')) {
        return number;
    }
    
    // Default: assume it needs 57 prefix
    return '57' + cleanNumber + '@s.whatsapp.net';
}

// Function to send message
async function sendMessage(number, message) {
    try {
        if (!whatsappClient || connectionStatus !== 'connected') {
            console.log('❌ WhatsApp no está conectado. Estado:', connectionStatus);
            return false;
        }

        const formattedNumber = formatColombianNumber(number);
        await whatsappClient.sendMessage(formattedNumber, { text: message });
        console.log(`✅ Mensaje enviado a +57${number}: "${message}"`);
        console.log(`📱 Número formateado: ${formattedNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error.message);
        return false;
    }
}


// Start server
app.listen(PORT, () => {
    console.log('🌟 ═══════════════════════════════════════');
    console.log('🚀 WhatsApp Baileys Backend iniciado');
    console.log(`📡 Servidor corriendo en puerto ${PORT}`);
    console.log('🌟 ═══════════════════════════════════════');
    
    // Start WhatsApp connection
    connectWhatsApp();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    if (whatsappClient) {
        whatsappClient.logout();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    if (whatsappClient) {
        whatsappClient.logout();
    }
    process.exit(0);
});
