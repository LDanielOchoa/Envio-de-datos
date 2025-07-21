import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp-service';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Verificar si es FormData (con imagen) o JSON
    const contentType = request.headers.get('content-type');
    let phone, message, imageFile = null;
    
    if (contentType?.includes('multipart/form-data')) {
      // Con imagen
      const formData = await request.formData();
      phone = formData.get('phone') as string;
      message = formData.get('message') as string;
      imageFile = formData.get('image') as File | null;
      const useDefaultImage = formData.get('useDefaultImage') === 'true';
      
      if (imageFile) {
        console.log('🧪 TEST: Imagen recibida:', imageFile.name, imageFile.size);
      } else if (useDefaultImage) {
        console.log('🧪 TEST: Usando imagen por defecto...');
        
        // Cargar imagen por defecto desde docs
        try {
          const imagePath = path.join(process.cwd(), 'docs', 'Imagen de WhatsApp 2025-07-19 a las 19.28.39_2d51dfb9.jpg');
          if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            // Crear un File object simulado
            const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
            imageFile = new File([blob], 'Imagen de WhatsApp 2025-07-19 a las 19.28.39_2d51dfb9.jpg', { type: 'image/jpeg' });
            console.log('✅ TEST: Imagen por defecto cargada:', imageFile.name, imageBuffer.length, 'bytes');
          } else {
            console.log('❌ TEST: Imagen por defecto no encontrada');
          }
        } catch (error) {
          console.log('❌ TEST: Error cargando imagen por defecto:', error);
        }
      }
    } else {
      // Sin imagen (JSON tradicional)
      const body = await request.json();
      phone = body.phone;
      message = body.message;
    }
    
    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Se requiere teléfono y mensaje' },
        { status: 400 }
      );
    }
    
    console.log('🧪 TEST: Enviando mensaje de prueba...');
    console.log('📱 Teléfono:', phone);
    console.log('💬 Mensaje:', message);
    
    const whatsappService = WhatsAppService.getInstance();
    
    // Procesar imagen si existe
    let imageBuffer: Buffer | undefined;
    let imageName: string | undefined;
    
    if (imageFile) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        imageName = imageFile.name;
        console.log('🧪 TEST: Imagen procesada:', imageName, 'Tamaño:', imageBuffer.length, 'bytes');
      } catch (error) {
        console.error('❌ TEST: Error procesando imagen:', error);
        return NextResponse.json(
          { success: false, error: 'Error procesando la imagen de prueba' },
          { status: 400 }
        );
      }
    }
    
    try {
      const success = await whatsappService.sendMessage(phone, message, imageBuffer, imageName);
      
      return NextResponse.json({
        success: true,
        message: imageFile ? 'Mensaje de prueba con imagen enviado' : 'Mensaje de prueba enviado',
        details: { 
          phone, 
          messageSent: message,
          imageIncluded: !!imageFile,
          imageName: imageName || null
        }
      });
      
    } catch (error: any) {
      console.error('❌ TEST ERROR:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: { phone, originalError: error.toString() }
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ API TEST ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Error en API de prueba' },
      { status: 500 }
    );
  }
} 