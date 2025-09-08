import express from 'express';

const router = express.Router();

// Variables globales para el progreso de envío
let sendingProgress = {
    isActive: false,
    total: 0,
    sent: 0,
    failed: 0,
    current: null,
    results: [],
    startTime: null,
    endTime: null
};

// Función para personalizar mensaje (similar al frontend)
function personalizeMessage(template, contact) {
    let message = template;
    
    // Reemplazar nombre y apellido juntos si están disponibles
    if (contact.name) {
        const fullName = contact.lastName 
            ? `${contact.name} ${contact.lastName}` 
            : contact.name;
        
        const fullNameUpperCase = fullName.toUpperCase();
        message = message.replace(/{nombre_apellidos}/g, fullNameUpperCase);
        message = message.replace(/{NOMBRE_APELLIDOS}/g, fullNameUpperCase);
    }
    
    // Reemplazar solo nombre si está disponible
    if (contact.name) {
        message = message.replace(/{nombre}/g, contact.name);
        message = message.replace(/{NOMBRE}/g, contact.name.toUpperCase());
    }
    
    // Reemplazar solo apellido si está disponible
    if (contact.lastName) {
        message = message.replace(/{apellido}/g, contact.lastName);
        message = message.replace(/{APELLIDO}/g, contact.lastName.toUpperCase());
    }
    
    // Reemplazar grupo si está disponible
    if (contact.group) {
        message = message.replace(/{grupo}/g, contact.group);
        message = message.replace(/{GRUPO}/g, contact.group.toUpperCase());
    }
    
    return message;
}

// Función para formatear número de teléfono para WhatsApp
function formatPhoneForWhatsApp(phone) {
    // Limpiar el número
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Asegurar que tenga el código de país
    if (!cleanPhone.startsWith('57')) {
        cleanPhone = '57' + cleanPhone;
    }
    
    // Formato para WhatsApp: número@s.whatsapp.net
    return cleanPhone + '@s.whatsapp.net';
}

// Función para enviar un mensaje individual
async function sendSingleMessage(whatsappClient, phone, message, contact) {
    try {
        const whatsappId = formatPhoneForWhatsApp(phone);
        console.log(`📤 Enviando mensaje a: ${phone} (${whatsappId})`);
        
        // Personalizar el mensaje
        const personalizedMessage = personalizeMessage(message, contact);
        
        // Enviar el mensaje usando Baileys
        await whatsappClient.sendMessage(whatsappId, { text: personalizedMessage });
        
        console.log(`✅ Mensaje enviado exitosamente a ${phone}`);
        return {
            phone,
            contact: contact.name || 'Sin nombre',
            status: 'sent',
            timestamp: new Date().toISOString(),
            error: null
        };
        
    } catch (error) {
        console.error(`❌ Error enviando mensaje a ${phone}:`, error);
        return {
            phone,
            contact: contact.name || 'Sin nombre',
            status: 'failed',
            timestamp: new Date().toISOString(),
            error: error.message || 'Error desconocido'
        };
    }
}

// Endpoint para enviar mensajes masivos
router.post('/send-bulk', async (req, res) => {
    try {
        console.log('📥 Received send-bulk request');
        console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
        
        const { contacts, message, delayBetweenMessages = 3000 } = req.body;
        
        console.log('🔍 Validating request data...');
        console.log(`📊 Contacts received: ${contacts ? contacts.length : 'undefined/null'}`);
        console.log(`💬 Message received: ${message ? 'Yes (' + message.length + ' chars)' : 'No/Empty'}`);
        console.log(`⏱️ Delay: ${delayBetweenMessages}ms`);
        
        if (!contacts || contacts.length === 0) {
            console.log('❌ Validation failed: No contacts provided');
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron contactos'
            });
        }
        
        if (!message || message.trim() === '') {
            console.log('❌ Validation failed: No message provided');
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó mensaje'
            });
        }
        
        // Obtener el cliente WhatsApp del contexto global
        const whatsappClient = global.whatsappClient;
        console.log(`🔌 WhatsApp client status: ${whatsappClient ? 'Connected' : 'Not connected'}`);
        
        if (!whatsappClient) {
            console.log('❌ WhatsApp client not available');
            return res.status(500).json({
                success: false,
                error: 'Cliente WhatsApp no está conectado'
            });
        }
        
        console.log(`🚀 Starting bulk send to ${contacts.length} contacts`);
        
        // Inicializar progreso
        sendingProgress = {
            isActive: true,
            total: contacts.length,
            sent: 0,
            failed: 0,
            current: null,
            results: [],
            startTime: new Date().toISOString(),
            endTime: null
        };
        
        // Responder inmediatamente que el proceso ha comenzado
        res.json({
            success: true,
            message: 'Envío masivo iniciado',
            sessionId: 'bulk-' + Date.now(),
            total: contacts.length
        });
        
        // Proceso asíncrono de envíos de forma asíncrona
        processBulkSending(whatsappClient, contacts, message, delayBetweenMessages);
        
    } catch (error) {
        console.error('❌ Error en envío masivo:', error);
        sendingProgress.isActive = false;
        res.status(500).json({
            success: false,
            error: error.message || 'Error desconocido'
        });
    }
});

// Función asíncrona para procesar el envío masivo
async function processBulkSending(whatsappClient, contacts, message, delay) {
    console.log(`📋 Procesando ${contacts.length} contactos con delay de ${delay}ms`);
    
    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        
        // Actualizar progreso actual
        sendingProgress.current = {
            index: i + 1,
            total: contacts.length,
            contact: contact.name || 'Sin nombre',
            phone: contact.phone
        };
        
        console.log(`📤 [${i + 1}/${contacts.length}] Procesando: ${contact.name || 'Sin nombre'} (${contact.phone})`);
        
        try {
            // Enviar mensaje individual
            const result = await sendSingleMessage(whatsappClient, contact.phone, message, contact);
            
            // Actualizar contadores
            if (result.status === 'sent') {
                sendingProgress.sent++;
            } else {
                sendingProgress.failed++;
            }
            
            // Guardar resultado con más detalles
            const resultWithDetails = {
                ...result,
                contactId: contact.id || `contact-${contact.phone}`,
                contactName: contact.name || 'Sin nombre',
                status: result.status === 'sent' ? 'success' : 'error'
            };
            sendingProgress.results.push(resultWithDetails);
            
            console.log(`📊 Progreso: ${sendingProgress.sent} enviados, ${sendingProgress.failed} fallidos`);
            console.log(`📋 Resultado guardado:`, resultWithDetails);
            
        } catch (error) {
            console.error(`❌ Error procesando contacto ${contact.phone}:`, error);
            sendingProgress.failed++;
            sendingProgress.results.push({
                phone: contact.phone,
                contactId: contact.id || `contact-${contact.phone}`,
                contactName: contact.name || 'Sin nombre',
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message || 'Error desconocido'
            });
        }
        
        // Delay entre mensajes (excepto en el último)
        if (i < contacts.length - 1) {
            console.log(`⏱️ Esperando ${delay}ms antes del siguiente mensaje...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // Finalizar proceso
    sendingProgress.isActive = false;
    sendingProgress.endTime = new Date().toISOString();
    sendingProgress.current = null;
    
    console.log(`🎉 Envío masivo completado:`);
    console.log(`   ✅ Enviados: ${sendingProgress.sent}`);
    console.log(`   ❌ Fallidos: ${sendingProgress.failed}`);
    console.log(`   📊 Total: ${sendingProgress.total}`);
}

// Endpoint para obtener el progreso del envío
router.get('/sending-progress', (req, res) => {
    console.log('📊 [API] Consultando progreso del envío...');
    console.log('📊 [API] Estado actual:', {
        isActive: sendingProgress.isActive,
        total: sendingProgress.total,
        sent: sendingProgress.sent,
        failed: sendingProgress.failed,
        current: sendingProgress.current,
        resultsCount: sendingProgress.results.length
    });
    
    // Debug: Mostrar últimos resultados
    if (sendingProgress.results.length > 0) {
        console.log('📋 [API] Últimos resultados:', sendingProgress.results.slice(-2));
    }
    
    res.json({
        success: true,
        data: {
            sessionId: 'bulk-' + Date.now(),
            totalContacts: sendingProgress.total,
            currentIndex: sendingProgress.current ? sendingProgress.current.index : 0,
            successCount: sendingProgress.sent,
            errorCount: sendingProgress.failed,
            invalidNumbersCount: 0,
            verifiedWhatsappCount: 0,
            isComplete: !sendingProgress.isActive && sendingProgress.total > 0,
            startTime: sendingProgress.startTime,
            lastUpdate: new Date().toISOString(),
            results: sendingProgress.results.map(result => ({
                contactId: result.contactId || `contact-${result.phone}`,
                contactName: result.contactName || result.name || 'Sin nombre',
                status: result.status,
                phone: result.phone,
                error: result.error,
                timestamp: result.timestamp || new Date().toISOString()
            }))
        }
    });
});

// Endpoint para obtener los resultados del último envío
router.get('/sending-results', (req, res) => {
    res.json({
        success: true,
        results: {
            total: sendingProgress.total,
            sent: sendingProgress.sent,
            failed: sendingProgress.failed,
            isActive: sendingProgress.isActive,
            startTime: sendingProgress.startTime,
            endTime: sendingProgress.endTime,
            details: sendingProgress.results
        }
    });
});

// Endpoint POST para generar y descargar Excel con resultados
router.post('/sending-results', async (req, res) => {
    try {
        const { results } = req.body;
        
        console.log('📊 Generando archivo Excel con resultados de envío...');
        
        if (!results || !results.results) {
            return res.status(400).json({
                success: false,
                error: 'No se encontraron resultados para exportar'
            });
        }
        
        // Importar XLSX
        const XLSX = await import('xlsx');
        
        // Preparar datos para Excel
        const excelData = results.results.map((result, index) => ({
            'N°': index + 1,
            'Nombre': result.contactName || result.contact || 'Sin nombre',
            'Teléfono': result.phone,
            'Estado': result.status === 'success' || result.status === 'sent' ? 'ENVIADO' : 'SIN WHATSAPP',
            'Fecha/Hora': result.timestamp ? new Date(result.timestamp).toLocaleString('es-CO') : 'N/A',
            'Error': result.error || 'N/A'
        }));
        
        // Agregar resumen al final
        excelData.push({});
        excelData.push({
            'N°': '',
            'Nombre': 'RESUMEN',
            'Teléfono': '',
            'Estado': '',
            'Fecha/Hora': '',
            'Error': ''
        });
        excelData.push({
            'N°': '',
            'Nombre': 'Total contactos:',
            'Teléfono': results.successCount + results.errorCount,
            'Estado': '',
            'Fecha/Hora': '',
            'Error': ''
        });
        excelData.push({
            'N°': '',
            'Nombre': 'Mensajes enviados:',
            'Teléfono': results.successCount,
            'Estado': '',
            'Fecha/Hora': '',
            'Error': ''
        });
        excelData.push({
            'N°': '',
            'Nombre': 'Sin WhatsApp:',
            'Teléfono': results.errorCount,
            'Estado': '',
            'Fecha/Hora': '',
            'Error': ''
        });
        
        // Crear workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Ajustar ancho de columnas
        worksheet['!cols'] = [
            { wch: 5 },  // N°
            { wch: 25 }, // Nombre
            { wch: 15 }, // Teléfono
            { wch: 15 }, // Estado
            { wch: 20 }, // Fecha/Hora
            { wch: 30 }  // Error
        ];
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados Envío');
        
        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Configurar headers para descarga
        const filename = `resultados-envio-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.xlsx`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', buffer.length);
        
        console.log(`✅ Archivo Excel generado: ${filename}`);
        console.log(`📊 Datos exportados: ${results.results.length} contactos`);
        
        res.send(buffer);
        
    } catch (error) {
        console.error('❌ Error generando archivo Excel:', error);
        res.status(500).json({
            success: false,
            error: 'Error generando archivo Excel: ' + error.message
        });
    }
});

// Endpoint para enviar mensaje de prueba
router.post('/send-test', async (req, res) => {
    try {
        const { phone, message, contact } = req.body;
        
        console.log(`🧪 Enviando mensaje de prueba a: ${phone}`);
        
        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'Teléfono y mensaje son requeridos'
            });
        }
        
        // Obtener el cliente WhatsApp del contexto global
        const whatsappClient = global.whatsappClient;
        if (!whatsappClient) {
            return res.status(500).json({
                success: false,
                error: 'Cliente WhatsApp no está conectado'
            });
        }
        
        // Enviar mensaje de prueba
        const result = await sendSingleMessage(whatsappClient, phone, message, contact || {});
        
        res.json({
            success: result.status === 'sent',
            result
        });
        
    } catch (error) {
        console.error('❌ Error en mensaje de prueba:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error desconocido'
        });
    }
});

export default router;
