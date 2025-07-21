import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp-service';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar si es FormData (con imagen) o JSON
    const contentType = request.headers.get('content-type');
    let contacts, message, imageFile = null;
    
    if (contentType?.includes('multipart/form-data')) {
      // Con imagen
      const formData = await request.formData();
      contacts = JSON.parse(formData.get('contacts') as string);
      message = formData.get('message') as string;
      imageFile = formData.get('image') as File | null;
      
      if (imageFile) {
        console.log('📷 Imagen recibida:', imageFile.name, imageFile.size);
      }
    } else {
      // Sin imagen (JSON tradicional)
      const body = await request.json();
      contacts = body.contacts;
      message = body.message;
    }

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere una lista de contactos válida'
        },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere un mensaje válido'
        },
        { status: 400 }
      );
    }

    // Obtener instancia de WhatsApp
    const whatsappService = WhatsAppService.getInstance();
    
    // Verificar estado de conexión con logging detallado
    console.log('📱 API Send: Verificando estado de WhatsApp...');
    const status = whatsappService.getStatus();
    console.log('📊 API Send: Estado actual:', {
      isConnected: status.isConnected,
      phoneNumber: status.phoneNumber,
      hasQR: !!status.qrCode
    });
    
    if (!status.isConnected) {
      console.log('❌ API Send: WhatsApp no está conectado');
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp no está conectado. Por favor, verifica tu conexión primero.',
          details: {
            isConnected: status.isConnected,
            phoneNumber: status.phoneNumber,
            hasQR: !!status.qrCode
          }
        },
        { status: 400 }
      );
    }
    
    console.log('✅ API Send: WhatsApp conectado como:', status.phoneNumber);

    // Validar contactos con logging detallado
    console.log('📋 Contactos recibidos:', contacts.length);
    console.log('📋 Muestra de contactos:', contacts.slice(0, 3));
    
    const validContacts: Contact[] = contacts.filter((contact: any, index: number) => {
      const hasPhone = contact.phone && contact.phone.length >= 10;
      const hasName = contact.name && contact.name.trim().length > 0;
      
      console.log(`📋 Contacto ${index + 1}:`, {
        phone: contact.phone,
        name: contact.name,
        hasPhone,
        hasName,
        valid: hasPhone && hasName
      });
      
      // Si tiene teléfono pero no nombre, agregar nombre por defecto
      if (hasPhone && !hasName) {
        contact.name = `Contacto ${index + 1}`;
        console.log(`📝 Nombre agregado automáticamente: ${contact.name}`);
        return true;
      }
      
      return hasPhone && hasName;
    });

    console.log(`📊 Contactos válidos: ${validContacts.length} de ${contacts.length}`);

    if (validContacts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay contactos válidos para enviar mensajes',
          details: {
            totalReceived: contacts.length,
            validContacts: validContacts.length,
            sampleContacts: contacts.slice(0, 3)
          }
        },
        { status: 400 }
      );
    }

    // Procesar imagen si existe
    let imageBuffer: Buffer | undefined;
    let imageName: string | undefined;
    
    if (imageFile) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        imageName = imageFile.name;
        console.log('📷 Imagen procesada:', imageName, 'Tamaño:', imageBuffer.length, 'bytes');
      } catch (error) {
        console.error('❌ Error procesando imagen:', error);
        return NextResponse.json(
          { success: false, error: 'Error procesando la imagen' },
          { status: 400 }
        );
      }
    }

    // Enviar mensajes uno por uno
    const results: any[] = [];
    let successCount = 0;

    for (const contact of validContacts) {
      try {
        console.log(`📱 Procesando contacto: ${contact.name} (${contact.phone})`);
        
        // Personalizar mensaje con el nombre del contacto
        const personalizedMessage = message.replace('{nombre}', contact.name);
        
        // Enviar mensaje (con imagen si existe)
        const success = await whatsappService.sendMessage(
          contact.phone, 
          personalizedMessage,
          imageBuffer,
          imageName
        );
        
        results.push({
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone,
          status: 'success',
          message: 'Mensaje enviado exitosamente'
        });
        successCount++;
        
        console.log(`✅ Mensaje enviado a ${contact.name}`);
        
        // Delay más largo entre mensajes para evitar problemas
        console.log('⏳ Esperando 5 segundos antes del siguiente mensaje...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.log(`❌ Error enviando a ${contact.name}:`, errorMessage);
        
        results.push({
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone,
          status: 'error',
          error: errorMessage
        });
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      data: {
        totalContacts: validContacts.length,
        results: results,
        successCount: successCount,
        errorCount: results.filter((r: any) => r.status === 'error').length
      }
    });
  } catch (error) {
    console.error('❌ Error al enviar mensajes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 