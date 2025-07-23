import { NextResponse } from 'next/server';
import { Contact } from '../../../../types';
import { WhatsAppService } from '../../../../lib/whatsapp-service';
import { getTemplateByGroup, personalizeMessage } from '../../../../lib/message-templates';

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';

// Optimización para mayor velocidad
const BATCH_SIZE = 20; // Aumentado de 10 a 20
const BATCH_DELAY = 200; // Reducido de 500 a 200ms
const MESSAGE_DELAY = 100; // Delay entre mensajes individuales para evitar spam

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const contactsJson = formData.get('contacts') as string;
        const message = formData.get('message') as string;
        const useTemplates = formData.get('useTemplates') === 'true';
        
        // Obtener sessionId del header
        const sessionId = request.headers.get('X-Session-Id') || 'default';

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

        const whatsappService = WhatsAppService.getInstance(sessionId);
        const results: any[] = [];
        let successCount = 0;
        let errorCount = 0;
        let invalidNumbersCount = 0;
        let invalidNumbers: string[] = [];

        console.log(`🚀 Iniciando envío optimizado a ${contacts.length} contactos`);

        // Procesar contactos en lotes más grandes
        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
            const batch = contacts.slice(i, i + BATCH_SIZE);
            console.log(`📤 Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(contacts.length / BATCH_SIZE)}`);

            // Enviar mensajes del lote en paralelo con verificación previa
            const batchPromises = batch.map(async (contact, index) => {
                try {
                    // Pequeño delay entre mensajes para evitar spam
                    if (index > 0) {
                        await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY));
                    }

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

                    // Verificar si el número existe en WhatsApp antes del envío
                    const formattedPhone = contact.phone.includes('@c.us') ? contact.phone : `${contact.phone}@c.us`;
                    
                    try {
                        // Verificar si el número existe en WhatsApp
                        const isValid = await whatsappService.isNumberValid(contact.phone);
                        if (!isValid) {
                            console.log(`⚠️ [${sessionId}] Número no válido: ${contact.phone}`);
                            invalidNumbersCount++;
                            invalidNumbers.push(contact.phone);
                            return {
                                contactId: contact.id,
                                status: 'invalid_number',
                                error: 'Número no registrado en WhatsApp',
                                phone: contact.phone
                            };
                        }
                    } catch (chatError) {
                        console.log(`⚠️ [${sessionId}] No se pudo verificar número ${contact.phone}, continuando...`);
                        // Continuar con el envío aunque no se pueda verificar
                    }

                    // Envío solo texto
                    await whatsappService.sendMessage(contact.phone, finalMessage);

                    successCount++;
                    return {
                        contactId: contact.id,
                        status: 'success',
                        phone: contact.phone
                    };
                } catch (error) {
                    console.error(`❌ [${sessionId}] Error enviando a ${contact.phone}:`, error);
                    
                    // Detectar si es un error de número no válido
                    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                    if (errorMessage.includes('not-authorized') || 
                        errorMessage.includes('not-found') || 
                        errorMessage.includes('invalid') ||
                        errorMessage.includes('no existe')) {
                        invalidNumbersCount++;
                        invalidNumbers.push(contact.phone);
                        return {
                            contactId: contact.id,
                            status: 'invalid_number',
                            error: 'Número no registrado en WhatsApp',
                            phone: contact.phone
                        };
                    }
                    
                    errorCount++;
                    return {
                        contactId: contact.id,
                        status: 'error',
                        error: errorMessage,
                        phone: contact.phone
                    };
                }
            });

            // Esperar a que se completen todos los envíos del lote
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Esperar menos tiempo entre lotes
            if (i + BATCH_SIZE < contacts.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }

            // Actualizar progreso
            console.log(`✅ Progreso: ${Math.min(i + BATCH_SIZE, contacts.length)}/${contacts.length} mensajes procesados`);
        }

        console.log(`🎉 Envío completado: ${successCount} exitosos, ${errorCount} fallidos, ${invalidNumbersCount} números inválidos`);

        return NextResponse.json({
            success: true,
            data: {
                results,
                successCount,
                errorCount,
                invalidNumbersCount,
                invalidNumbers,
                total: contacts.length,
                useTemplates
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