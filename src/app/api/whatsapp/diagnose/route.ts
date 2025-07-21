import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp-service';

export async function POST() {
  try {
    console.log('🔍 DIAGNÓSTICO: Iniciando verificación completa...');
    
    const whatsappService = WhatsAppService.getInstance();
    const status = whatsappService.getStatus();
    
    if (!status.isConnected) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp no está conectado',
        diagnostics: { status }
      });
    }
    
    // Intentar obtener información del cliente
    const client = (whatsappService as any).client;
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Cliente WhatsApp no disponible',
        diagnostics: { status }
      });
    }
    
    const diagnostics: any = {
      status,
      clientInfo: {},
      chats: {},
      connectivity: {}
    };
    
    // Verificar estado del cliente
    try {
      const clientState = await client.getState();
      diagnostics.clientInfo.state = clientState;
      console.log('📱 Estado del cliente:', clientState);
    } catch (error: any) {
      diagnostics.clientInfo.stateError = error.message;
    }
    
    // Verificar información del usuario
    try {
      if (client.info?.wid?.user) {
        diagnostics.clientInfo.userPhone = client.info.wid.user;
        diagnostics.clientInfo.connected = true;
      } else {
        diagnostics.clientInfo.connected = false;
      }
    } catch (error: any) {
      diagnostics.clientInfo.infoError = error.message;
    }
    
    // Verificar chats disponibles
    try {
      const chats = await client.getChats();
      diagnostics.chats.totalChats = chats.length;
      diagnostics.chats.recentChats = chats.slice(0, 5).map((chat: any) => ({
        id: chat.id._serialized,
        name: chat.name || 'Sin nombre',
        isGroup: chat.isGroup,
        lastMessageTime: chat.lastMessage?.timestamp
      }));
      console.log(`📱 Total de chats: ${chats.length}`);
    } catch (error: any) {
      diagnostics.chats.error = error.message;
    }
    
    // Verificar conectividad específica con el número de prueba
    const testPhone = '573002473899';
    const testChatId = testPhone + '@c.us';
    
    try {
      const testChat = await client.getChatById(testChatId);
      
      if (testChat) {
        diagnostics.connectivity.testChatExists = true;
        diagnostics.connectivity.testChatName = testChat.name || 'Sin nombre';
        
        // Obtener mensajes recientes del chat de prueba
        try {
          const recentMessages = await testChat.fetchMessages({ limit: 3 });
          diagnostics.connectivity.recentMessages = recentMessages.map((msg: any) => ({
            id: msg.id._serialized,
            body: msg.body || '[Media]',
            timestamp: msg.timestamp,
            fromMe: msg.fromMe,
            ack: msg.ack,
            type: msg.type
          }));
          console.log(`📱 Mensajes recientes en chat de prueba: ${recentMessages.length}`);
        } catch (msgError: any) {
          diagnostics.connectivity.messagesError = msgError.message;
        }
        
      } else {
        diagnostics.connectivity.testChatExists = false;
      }
      
    } catch (error: any) {
      diagnostics.connectivity.testChatError = error.message;
    }
    
    // Verificar página de Puppeteer
    try {
      if (client.pupPage) {
        diagnostics.connectivity.puppeteerPage = true;
        const url = await client.pupPage.url();
        diagnostics.connectivity.currentUrl = url;
        console.log('📱 URL actual de Puppeteer:', url);
      } else {
        diagnostics.connectivity.puppeteerPage = false;
      }
    } catch (error: any) {
      diagnostics.connectivity.puppeteerError = error.message;
    }
    
    console.log('✅ DIAGNÓSTICO COMPLETADO');
    
    return NextResponse.json({
      success: true,
      message: 'Diagnóstico completado',
      diagnostics
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        diagnostics: null
      },
      { status: 500 }
    );
  }
} 