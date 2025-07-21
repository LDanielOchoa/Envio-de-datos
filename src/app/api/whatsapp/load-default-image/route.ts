import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    console.log('📷 API: Cargando imagen por defecto...');
    
    // Ruta a la imagen en docs
    const imagePath = path.join(process.cwd(), 'docs', 'Imagen de WhatsApp 2025-07-19 a las 19.28.39_2d51dfb9.jpg');
    
    // Verificar que el archivo existe
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Imagen no encontrada en:', imagePath);
      return NextResponse.json(
        { success: false, error: 'Imagen por defecto no encontrada' },
        { status: 404 }
      );
    }
    
    // Leer la imagen
    const imageBuffer = fs.readFileSync(imagePath);
    console.log('✅ Imagen cargada, tamaño:', imageBuffer.length, 'bytes');
    
    // Convertir a base64 para enviar al frontend
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    return NextResponse.json({
      success: true,
      data: {
        name: 'Imagen de WhatsApp 2025-07-19 a las 19.28.39_2d51dfb9.jpg',
        size: imageBuffer.length,
        type: mimeType,
        dataUrl: dataUrl,
        buffer: base64Image
      }
    });
    
  } catch (error) {
    console.error('❌ API Error cargando imagen por defecto:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 