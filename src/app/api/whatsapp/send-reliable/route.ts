import { NextResponse } from 'next/server';
import { Contact } from '@/types';
import { WhatsAppService } from '@/lib/whatsapp-service';
import { getTemplateByGroup, personalizeMessage } from '@/lib/message-templates';

// Número de mensajes a enviar en paralelo
const BATCH_SIZE = 5;
// Tiempo de espera entre lotes (en milisegundos)
const BATCH_DELAY = 1000;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const contactsJson = formData.get('contacts') as string;
        const message = formData.get('message') as string;
        const useTemplates = formData.get('useTemplates') === 'true';
        const imageFile = formData.get('image') as File | null;

        if (!contactsJson || !message) {
            return NextResponse.json({
                success: false,
                error: 'Faltan datos requeridos'
            }, { status: 400 });
        }

        const contacts = JSON.parse(contactsJson) as Contact[];
        if (contacts.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No hay contactos para enviar mensajes'
            }, { status: 400 });
        }

        // Preparar imagen si existe
        let imageBuffer: Buffer | null = null;
        let imageName: string | null = null;
        if (imageFile) {
            imageBuffer = Buffer.from(await imageFile.arrayBuffer());
            imageName = imageFile.name;
        }

        const whatsappService = WhatsAppService.getInstance();
        const results: any[] = [];
        let successCount = 0;
        let errorCount = 0;

        // Procesar contactos en lotes
        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
            const batch = contacts.slice(i, i + BATCH_SIZE);
            console.log(`📤 Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(contacts.length / BATCH_SIZE)}`);

            // Enviar mensajes del lote en paralelo
            const batchPromises = batch.map(async (contact) => {
                try {
                    let finalMessage = message;

                    // Si se usan plantillas, personalizar mensaje según grupo
                    if (useTemplates && contact.group) {
                        const template = getTemplateByGroup(contact.group);
                        if (template) {
                            finalMessage = personalizeMessage(template.content, {
                                nombre: contact.name || '',
                                apellido: contact.lastName || '',
                                grupo: contact.group,
                                gestor: contact.gestor || ''
                            });
                        }
                    }

                    // Enviar mensaje
                    if (imageBuffer && imageName) {
                        await whatsappService.sendMessage(contact.phone, finalMessage, imageBuffer, imageName);
                    } else {
                        await whatsappService.sendMessage(contact.phone, finalMessage);
                    }

                    successCount++;
                    return {
                        contactId: contact.id,
                        status: 'success'
                    };
                } catch (error) {
                    console.error(`Error enviando a ${contact.phone}:`, error);
                    errorCount++;
                    return {
                        contactId: contact.id,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    };
                }
            });

            // Esperar a que se completen todos los envíos del lote
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Esperar un poco entre lotes para evitar sobrecarga
            if (i + BATCH_SIZE < contacts.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }

            // Actualizar progreso
            console.log(`✅ Progreso: ${Math.min(i + BATCH_SIZE, contacts.length)}/${contacts.length} mensajes procesados`);
        }

        return NextResponse.json({
            success: true,
            data: {
                results,
                successCount,
                errorCount,
                total: contacts.length,
                useTemplates,
                imageIncluded: !!imageBuffer
            }
        });

    } catch (error) {
        console.error('Error al enviar mensajes:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
} 