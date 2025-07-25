import { NextResponse } from 'next/server';
import { Contact } from '../../../../types';
import { WhatsAppService } from '../../../../lib/whatsapp-service';
import { getTemplateByGroup, personalizeMessage } from '../../../../lib/message-templates';
import { SendingProgressManager } from '../../../../lib/sending-progress';

// Marcar la ruta como dinámica para evitar la compilación estática
export const dynamic = 'force-dynamic';

// Configuración para envío secuencial controlado
const BATCH_SIZE = 1; // Envío uno por uno
const BATCH_DELAY = 1000; // 1 segundo entre lotes
const MESSAGE_DELAY = 1000; // 2 segundos entre mensajes individuales

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const contactsJson = formData.get('contacts') as string;
        const message = formData.get('message') as string;
        const useTemplates = formData.get('useTemplates') === 'true';
        const skipValidation = formData.get('skipValidation') === 'true'; // Nueva opción para saltar validación
        
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
        
        // Verificar estado del cliente antes de proceder
        const clientStatus = whatsappService.getStatus();
        console.log(`📊 [${sessionId}] Estado del cliente:`, {
            isConnected: clientStatus.isConnected,
            phoneNumber: clientStatus.phoneNumber,
            hasQR: !!clientStatus.qrCode
        });
        
        if (!clientStatus.isConnected) {
            return NextResponse.json({
                success: false,
                error: 'WhatsApp no está conectado. Por favor, verifica tu conexión primero.',
                details: clientStatus
            }, { status: 400 });
        }
        
        // Inicializar progreso con lista de contactos
        console.log(`📊 [${sessionId}] Inicializando progreso para ${contacts.length} contactos...`);
        SendingProgressManager.initializeProgress(sessionId, contacts.length, contacts);
        console.log(`📊 [${sessionId}] Progreso inicializado correctamente con todos los contactos en estado 'pending'`);
        
        const results: any[] = [];
        let successCount = 0;
        let errorCount = 0;
        let invalidNumbersCount = 0;
        let verifiedWhatsappCount = 0;
        let invalidNumbers: string[] = [];

        console.log(`🚀 Iniciando envío secuencial a ${contacts.length} contactos`);

        // Procesar contactos de forma secuencial (uno por uno)
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            console.log(`📤 Procesando contacto ${i + 1} de ${contacts.length}: ${contact.name} (${contact.phone})`);

            // Delay entre mensajes para evitar spam
            if (i > 0) {
                console.log(`⏳ Esperando ${MESSAGE_DELAY}ms antes del siguiente mensaje...`);
                await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY));
            }

            let finalMessage = message;

            // Personalizar mensaje con los datos del contacto
            if (useTemplates && contact.group) {
                // Si se usan plantillas, personalizar mensaje según grupo
                console.log(`🔧 [${sessionId}] Buscando plantilla para grupo: ${contact.group}`);
                const template = getTemplateByGroup(contact.group);
                if (template) {
                    console.log(`🔧 [${sessionId}] Plantilla encontrada: ${template.name}`);
                    finalMessage = personalizeMessage(template.content, {
                        name: contact.name || '',
                        lastName: contact.lastName || '',
                        group: contact.group,
                        gestor: contact.gestor || ''
                    });
                } else {
                    console.log(`🔧 [${sessionId}] No se encontró plantilla para grupo ${contact.group}, personalizando mensaje original`);
                    finalMessage = personalizeMessage(message, {
                        name: contact.name || '',
                        lastName: contact.lastName || '',
                        group: contact.group || '',
                        gestor: contact.gestor || ''
                    });
                }
            } else {
                // Si no se usan plantillas, personalizar el mensaje directamente
                console.log(`🔧 [${sessionId}] Personalizando mensaje para contacto:`, {
                    name: contact.name,
                    lastName: contact.lastName,
                    group: contact.group,
                    gestor: contact.gestor
                });
                
                finalMessage = personalizeMessage(message, {
                    name: contact.name || '',
                    lastName: contact.lastName || '',
                    group: contact.group || '',
                    gestor: contact.gestor || ''
                });
                
                console.log(`🔧 [${sessionId}] Mensaje final:`, finalMessage.substring(0, 100) + '...');
            }

            // Verificar si el número existe en WhatsApp antes del envío (opcional)
            if (!skipValidation) {
                try {
                    console.log(`🔍 [${sessionId}] Verificando número: ${contact.phone}`);
                    const isValid = await whatsappService.isNumberValid(contact.phone);
                    if (!isValid) {
                        console.log(`⚠️ [${sessionId}] Número no válido: ${contact.phone}`);
                        invalidNumbersCount++;
                        invalidNumbers.push(contact.phone);
                        results.push({
                            contactId: contact.id,
                            status: 'invalid_number',
                            error: 'Número no registrado en WhatsApp',
                            phone: contact.phone
                        });
                        
                        // Actualizar progreso directamente como sin WhatsApp
                        SendingProgressManager.updateProgress(sessionId, contact.id, `${contact.name} ${contact.lastName}`.trim(), contact.phone, 'invalid_number', 'Número no registrado en WhatsApp');
                        
                        continue; // Continuar con el siguiente contacto
                    }
                    console.log(`✅ [${sessionId}] Número válido: ${contact.phone}`);
                    
                } catch (chatError: any) {
                    const errorMessage = chatError.message || '';
                    
                    // Si el error es porque el cliente no está disponible, continuar sin verificación
                    if (errorMessage.includes('No hay cliente disponible') || 
                        errorMessage.includes('Cliente no está conectado')) {
                        console.log(`⚠️ [${sessionId}] Cliente no disponible para verificación, continuando con envío: ${contact.phone}`);
                        // Continuar con el envío sin verificación
                    } else {
                        console.log(`⚠️ [${sessionId}] No se pudo verificar número ${contact.phone}, marcando como inválido`);
                        invalidNumbersCount++;
                        invalidNumbers.push(contact.phone);
                        results.push({
                            contactId: contact.id,
                            status: 'invalid_number',
                            error: 'No se pudo verificar el número',
                            phone: contact.phone
                        });
                        
                        // Actualizar progreso
                        console.log(`📊 [${sessionId}] Actualizando progreso para inválido: ${contact.name} (${contact.phone})`);
                        SendingProgressManager.updateProgress(sessionId, contact.id, `${contact.name} ${contact.lastName}`.trim(), contact.phone, 'invalid_number', 'No se pudo verificar el número');
                        
                        continue; // Continuar con el siguiente contacto
                    }
                }
            } else {
                console.log(`⏭️ [${sessionId}] Saltando verificación para: ${contact.phone}`);
            }

            // Envío del mensaje
            try {
                console.log(`📤 [${sessionId}] Enviando mensaje a: ${contact.phone}`);
                await whatsappService.sendMessage(contact.phone, finalMessage);
                
                successCount++;
                results.push({
                    contactId: contact.id,
                    status: 'success',
                    phone: contact.phone
                });
                
                // Actualizar progreso
                console.log(`📊 [${sessionId}] Actualizando progreso para éxito: ${contact.name} (${contact.phone})`);
                SendingProgressManager.updateProgress(sessionId, contact.id, `${contact.name} ${contact.lastName}`.trim(), contact.phone, 'success');
                
                console.log(`✅ [${sessionId}] Mensaje enviado exitosamente a ${contact.name} (${contact.phone})`);
                
            } catch (error: any) {
                console.error(`❌ [${sessionId}] Error enviando a ${contact.phone}:`, error);
                
                // Detectar si es un error de número no válido
                const errorMessage = error.message || 'Error desconocido';
                if (errorMessage.includes('not-authorized') || 
                    errorMessage.includes('not-found') || 
                    errorMessage.includes('invalid') ||
                    errorMessage.includes('no existe') ||
                    errorMessage.includes('Número no registrado')) {
                    invalidNumbersCount++;
                    invalidNumbers.push(contact.phone);
                    results.push({
                        contactId: contact.id,
                        status: 'invalid_number',
                        error: 'Número no registrado en WhatsApp',
                        phone: contact.phone
                    });
                    
                    // Actualizar progreso
                    console.log(`📊 [${sessionId}] Actualizando progreso para inválido (error): ${contact.name} (${contact.phone})`);
                    SendingProgressManager.updateProgress(sessionId, contact.id, `${contact.name} ${contact.lastName}`.trim(), contact.phone, 'invalid_number', 'Número no registrado en WhatsApp');
                } else {
                    errorCount++;
                    results.push({
                        contactId: contact.id,
                        status: 'error',
                        error: errorMessage,
                        phone: contact.phone
                    });
                    
                    // Actualizar progreso
                    console.log(`📊 [${sessionId}] Actualizando progreso para error: ${contact.name} (${contact.phone}) - ${errorMessage}`);
                    SendingProgressManager.updateProgress(sessionId, contact.id, `${contact.name} ${contact.lastName}`.trim(), contact.phone, 'error', errorMessage);
                }
            }

            // Actualizar progreso después de cada mensaje
            console.log(`📊 Progreso: ${i + 1}/${contacts.length} mensajes procesados`);
            console.log(`📈 Estadísticas actuales: ✅ ${successCount} exitosos | ❌ ${errorCount} fallidos | ⚠️ ${invalidNumbersCount} inválidos | 📱 ${verifiedWhatsappCount} con WhatsApp`);
        }

        console.log(`🎉 Envío completado: ${successCount} exitosos, ${errorCount} fallidos, ${invalidNumbersCount} números inválidos, ${verifiedWhatsappCount} con WhatsApp`);
        
        // Marcar progreso como completado para que el modal pueda mostrar los resultados finales
        SendingProgressManager.markAsComplete(sessionId);
        console.log(`📊 [${sessionId}] Progreso marcado como completado y disponible para consulta`);

        return NextResponse.json({
            success: true,
            data: {
                results,
                successCount,
                errorCount,
                invalidNumbersCount,
                verifiedWhatsappCount,
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