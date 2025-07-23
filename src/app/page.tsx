'use client';

import { useState, useEffect } from 'react';
import { Contact, WhatsAppStatus, SendResults, TabType, User, AuthState } from '../types';
import WhatsAppSection from '../components/WhatsAppSection';
import ContactsSection from '../components/ContactsSection';
import MessagesSection from '../components/MessagesSection';
import SendingProgressModal from '../components/SendingProgressModal';
import LoginForm from '../components/LoginForm';
import UserHeader from '../components/UserHeader';
import { personalizeMessage } from '../lib/message-templates';

interface SendingProgress {
    contactId: string;
    contactName: string;
    phone: string;
    status: 'pending' | 'sending' | 'success' | 'error' | 'invalid_number';
    error?: string;
    duration?: number;
    timestamp?: Date;
}

export default function Home() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        isLoading: false
    });
    const [activeTab, setActiveTab] = useState<TabType>('whatsapp');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [showSendingModal, setShowSendingModal] = useState(false);
    const [sendingProgress, setSendingProgress] = useState<SendingProgress[]>([]);
    const [currentSendingIndex, setCurrentSendingIndex] = useState(0);
    const [results, setResults] = useState<SendResults | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
        isConnected: false,
        qrCode: '',
        phoneNumber: '',
        lastSeen: null
    });

    // Inicializar filteredContacts con contacts
    useEffect(() => {
        setFilteredContacts(contacts);
    }, [contacts]);

    // Authentication Functions
    const handleLogin = (user: User) => {
        setAuthState({
            isAuthenticated: true,
            user,
            isLoading: false
        });
        addLog(`🔐 Usuario ${user.name} autenticado exitosamente`);
        addLog(`📱 Sesión WhatsApp: ${user.whatsappSessionId}`);
    };

    const handleLogout = () => {
        setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false
        });
        setContacts([]);
        setFilteredContacts([]);
        setWhatsappStatus({
            isConnected: false,
            qrCode: '',
            phoneNumber: '',
            lastSeen: null
        });
        setResults(null);
        setLogs([]);
        addLog('🚪 Sesión cerrada exitosamente');
    };

    // WhatsApp Functions
    const checkWhatsAppStatus = async () => {
        if (isCheckingStatus || !authState.user) return;

        try {
            setIsCheckingStatus(true);
            const response = await fetch(`/api/whatsapp/status?sessionId=${authState.user.whatsappSessionId}`);

            if (response.status === 429) {
                addLog('⚠️ Muchas peticiones, esperando un momento...');
                return;
            }

            const data = await response.json();
            if (data.success) {
                const wasConnected = whatsappStatus?.isConnected;
                setWhatsappStatus(data.data);

                if (data.data.qrCode && !whatsappStatus?.qrCode) {
                    addLog('📱 Código QR disponible - Escanea para conectar');
                } else if (data.data.isConnected && !wasConnected) {
                    addLog('✅ WhatsApp conectado exitosamente');
                    addLog(`📱 Número: ${data.data.phoneNumber}`);
                } else if (!data.data.isConnected && wasConnected) {
                    addLog('❌ WhatsApp desconectado');
                }
            }
        } catch (error) {
            addLog('Error al verificar estado de WhatsApp');
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const forceRefreshStatus = async () => {
        if (!authState.user) return;
        
        try {
            addLog('🔍 Verificando conexión manualmente...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await fetch('/api/whatsapp/check-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': authState.user.whatsappSessionId
                }
            });

            if (response.status === 429) {
                addLog('⚠️ Demasiadas peticiones, espera un momento...');
                return;
            }

            const data = await response.json();
            if (data.success) {
                const wasConnected = whatsappStatus?.isConnected;
                setWhatsappStatus(data.data);

                if (data.data.isConnected && !wasConnected) {
                    addLog(`🎉 ¡WhatsApp CONECTADO exitosamente!`);
                    addLog(`📱 Número: ${data.data.phoneNumber}`);
                } else if (data.data.isConnected) {
                    addLog(`✅ WhatsApp sigue conectado como: ${data.data.phoneNumber}`);
                } else {
                    addLog(`❌ WhatsApp no conectado`);
                }
            }
        } catch (error) {
            addLog('❌ Error al verificar conexión');
        }
    };

    const resetWhatsApp = async () => {
        if (qrLoading || !authState.user) return;

        try {
            setQrLoading(true);
            addLog('🔄 Reiniciando WhatsApp completamente...');

            const response = await fetch('/api/whatsapp/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': authState.user.whatsappSessionId
                }
            });

            const data = await response.json();
            if (data.success) {
                addLog('✅ WhatsApp reiniciado completamente');
                setWhatsappStatus({
                    isConnected: false,
                    qrCode: '',
                    phoneNumber: '',
                    lastSeen: null
                });
            } else {
                addLog(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            addLog('❌ Error al reiniciar WhatsApp');
        } finally {
            setQrLoading(false);
        }
    };

    const generateNewQR = async () => {
        if (qrLoading || !authState.user) return;

        try {
            setQrLoading(true);
            addLog('🚀 Generando código QR...');

            const response = await fetch('/api/whatsapp/qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': authState.user.whatsappSessionId
                }
            });

            if (response.status === 429) {
                addLog('⚠️ Demasiadas peticiones, espera un momento...');
                return;
            }

            const data = await response.json();
            if (data.success) {
                if (data.data.isConnected) {
                    setWhatsappStatus(data.data);
                    addLog('🎉 ¡WhatsApp ya está CONECTADO!');
                    addLog(`📱 Conectado como: ${data.data.phoneNumber}`);
                } else if (data.data.qrCode) {
                    setWhatsappStatus(data.data);
                    addLog('✅ ¡CÓDIGO QR GENERADO EXITOSAMENTE!');
                    addLog('👉 Escanea el código QR con WhatsApp');
                } else {
                    addLog('⚠️ Respuesta exitosa pero sin QR ni conexión');
                }
            } else {
                addLog(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            addLog('❌ Error de conexión al generar QR');
        } finally {
            setQrLoading(false);
        }
    };

    const refreshClient = async () => {
        if (!authState.user) return;
        
        addLog('🔄 Refrescando cliente WhatsApp...');
        try {
            const response = await fetch('/api/whatsapp/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': authState.user.whatsappSessionId
                }
            });
            const data = await response.json();
            if (data.success) {
                addLog('✅ Cliente refrescado correctamente');
            } else {
                addLog(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            addLog('❌ Error refrescando cliente');
        }
    };

    // Contacts Functions
    const loadContacts = async (file: File) => {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            addLog('❌ El archivo debe ser un Excel (.xlsx o .xls)');
            return;
        }

        setLoading(true);
        addLog(`📁 [INDIVIDUAL] Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        try {
            const formData = new FormData();
            formData.append('file', file);

            addLog('📤 [INDIVIDUAL] Enviando archivo al servidor...');
            const response = await fetch('/api/sheets/contacts', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                const contactsFound = data.data.contacts;
                setContacts(contactsFound);
                addLog(`✅ [INDIVIDUAL] Archivo procesado correctamente`);
                addLog(`📊 [INDIVIDUAL] Contactos encontrados: ${contactsFound.length}`);
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error) {
            addLog(`❌ [INDIVIDUAL] Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadGroupContacts = async (file: File) => {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            addLog('❌ El archivo debe ser un Excel (.xlsx o .xls)');
            return;
        }

        setLoading(true);
        addLog(`📁 [GRUPOS] Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sheetType', 'g29_30'); // Indicar que es carga por grupos

            addLog('📤 [GRUPOS] Enviando archivo al servidor...');
            const response = await fetch('/api/sheets/contacts', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                const contactsFound = data.data.contacts;
                setContacts(contactsFound);
                addLog(`✅ [GRUPOS] Archivo procesado correctamente`);
                addLog(`📊 [GRUPOS] Contactos encontrados: ${contactsFound.length}`);
                
                // Mostrar estadísticas por grupo
                const grupo29 = contactsFound.filter((c: Contact) => c.group === '29').length;
                const grupo30 = contactsFound.filter((c: Contact) => c.group === '30').length;
                addLog(`🏷️ [GRUPOS] Grupo 29: ${grupo29} contactos`);
                addLog(`🏷️ [GRUPOS] Grupo 30: ${grupo30} contactos`);
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error) {
            addLog(`❌ [GRUPOS] Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const clearContacts = () => {
        setContacts([]);
        addLog('🧹 Lista de contactos limpiada');
    };

    // Función para filtrar contactos
    const handleFilterContacts = (filtered: Contact[]) => {
        setFilteredContacts(filtered);
    };

    // Función para filtrar contactos por plantilla
    const handleFilterByTemplate = (templateGroup: string | null) => {
        if (templateGroup) {
            // Filtrar usando la misma lógica que en MessagesSection
            const filtered = contacts.filter(contact => {
                if (!contact.group) return false;
                
                // Normalizar el grupo del contacto (puede venir como "Grupo 29", "29", etc.)
                const contactGroup = contact.group.toLowerCase().trim();
                const templateGroupLower = templateGroup.toLowerCase().trim();
                
                // Verificar diferentes patrones
                return (
                    contactGroup === templateGroupLower || // Coincidencia exacta
                    contactGroup === `grupo ${templateGroupLower}` || // "grupo 29" vs "29"
                    contactGroup.endsWith(templateGroupLower) || // "Grupo 29" vs "29"
                    contactGroup.includes(templateGroupLower) // Cualquier formato que contenga el número
                );
            });
            
            setFilteredContacts(filtered);
            addLog(`🎯 Filtrado activado: Mostrando solo contactos del Grupo ${templateGroup} (${filtered.length} contactos)`);
        } else {
            // Mostrar todos los contactos
            setFilteredContacts(contacts);
            addLog(`📊 Filtrado desactivado: Mostrando todos los contactos (${contacts.length} contactos)`);
        }
    };

    // Modificar la función sendMessages para usar filteredContacts en lugar de contacts
    const sendMessages = async () => {
        if (!message.trim()) {
            addLog('❌ Error: Por favor, ingresa un mensaje');
            return;
        }

        if (filteredContacts.length === 0) {
            addLog('❌ Error: No hay contactos para enviar');
            return;
        }

        if (!whatsappStatus.isConnected) {
            addLog('❌ Error: WhatsApp no está conectado');
            return;
        }

        if (!authState.user) {
            addLog('❌ Error: Usuario no autenticado');
            return;
        }

        setLoading(true);
        setShowSendingModal(true);
        setSendingProgress([]);
        setCurrentSendingIndex(0);
        addLog(`📤 Enviando mensajes optimizado a ${filteredContacts.length} contactos...`);
        
        // Inicializar progreso
        const initialProgress: SendingProgress[] = filteredContacts.map(contact => ({
            contactId: contact.id,
            contactName: `${contact.name} ${contact.lastName || ''}`.trim(),
            phone: contact.phone,
            status: 'pending'
        }));
        setSendingProgress(initialProgress);

        try {
            // Enviar todos los mensajes en una sola llamada optimizada
            const formData = new FormData();
            formData.append('contacts', JSON.stringify(filteredContacts));
            formData.append('message', message);
            
            // Determinar si usar plantillas basado en si el mensaje contiene {nombre_apellidos}
            const useTemplates = message.includes('{nombre_apellidos}') || message.includes('{grupo}');
            formData.append('useTemplates', useTemplates.toString());
            
            // Por defecto, no saltar validación (validar números)
            formData.append('skipValidation', 'false');
            
            console.log('🔧 Enviando con useTemplates:', useTemplates, 'skipValidation: false');

            const response = await fetch('/api/whatsapp/send-reliable', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Session-Id': authState.user.whatsappSessionId
                }
            });

            const data = await response.json();

            if (data.success) {
                const { results: serverResults, successCount, errorCount, invalidNumbersCount, invalidNumbers } = data.data;
                
                // Actualizar progreso basado en los resultados del servidor
                const updatedProgress = initialProgress.map((item, index) => {
                    const result = serverResults[index];
                    if (result) {
                        return {
                            ...item,
                            status: result.status,
                            error: result.error,
                            duration: 0, // El servidor no proporciona duración individual
                            timestamp: new Date()
                        };
                    }
                    return item;
                });
                
                setSendingProgress(updatedProgress);
                
                // Actualizar resultados finales
                setResults({
                    successCount,
                    errorCount,
                    invalidNumbersCount,
                    invalidNumbers,
                    results: serverResults
                });

                addLog(`✅ Envío optimizado completado:`);
                addLog(`   ✅ ${successCount} exitosos`);
                addLog(`   ❌ ${errorCount} fallidos`);
                addLog(`   ⚠️ ${invalidNumbersCount} sin WhatsApp`);
                
                if (invalidNumbers && invalidNumbers.length > 0) {
                    addLog(`📋 Números sin WhatsApp: ${invalidNumbers.join(', ')}`);
                }
            } else {
                addLog(`❌ Error en el servidor: ${data.error}`);
            }

        } catch (error) {
            addLog('❌ Error al enviar mensajes');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para probar el envío de mensajes
    const testSend = async () => {
        if (!message.trim()) {
            addLog('❌ Error: Por favor, ingresa un mensaje');
            return;
        }

        if (!whatsappStatus.isConnected) {
            addLog('❌ Error: WhatsApp no está conectado');
            return;
        }

        if (!authState.user) {
            addLog('❌ Error: Usuario no autenticado');
            return;
        }

        try {
            addLog('🧪 Enviando mensaje de prueba...');
            
            // Crear un contacto de prueba o usar el primero disponible
            const testContact = filteredContacts.length > 0 
                ? filteredContacts[0] 
                : {
                    id: 'test_contact',
                    name: 'Usuario',
                    lastName: 'De Prueba',
                    phone: whatsappStatus.phoneNumber,
                    status: 'pending'
                };
            
            // Personalizar el mensaje para el contacto de prueba
            const personalizedMessage = personalizeMessage(message, testContact);
            
            const formData = new FormData();
            formData.append('phone', testContact.phone);
            formData.append('message', personalizedMessage);

            const response = await fetch('/api/whatsapp/test-send', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Session-Id': authState.user.whatsappSessionId
                }
            });

            const data = await response.json();
            
            if (data.success) {
                addLog(`✅ Mensaje de prueba enviado correctamente a ${testContact.name}`);
            } else {
                addLog(`❌ Error en prueba: ${data.error}`);
            }
        } catch (error) {
            addLog('❌ Error enviando mensaje de prueba');
        }
    };

    // Utility Functions
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const closeSendingModal = () => {
        setShowSendingModal(false);
        setSendingProgress([]);
        setCurrentSendingIndex(0);
    };

    // Effects
    useEffect(() => {
        if (authState.isAuthenticated && authState.user) {
            checkWhatsAppStatus();

            const eventSource = new EventSource(`/api/whatsapp/connection-events?sessionId=${authState.user.whatsappSessionId}`);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'status_change' && data.data) {
                        const wasConnected = whatsappStatus?.isConnected;
                        setWhatsappStatus(data.data);

                        if (data.data.isConnected && !wasConnected) {
                            addLog('🎉 ¡WhatsApp CONECTADO automáticamente!');
                            addLog(`📱 Conectado como: ${data.data.phoneNumber}`);
                        }
                    }
                } catch (error) {
                    console.log('Error procesando evento SSE:', error);
                }
            };

            eventSource.onopen = () => {
                addLog('🔌 Monitoreo en tiempo real activo');
            };

            return () => {
                eventSource.close();
            };
        }
    }, [authState.isAuthenticated, authState.user]);

    const tabs = [
        { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: 'blue' },
        { id: 'sheets', name: 'Contactos', icon: '📊', color: 'green' },
        { id: 'messages', name: 'Mensajes', icon: '💬', color: 'purple' },
        { id: 'settings', name: 'Configuración', icon: '⚙️', color: 'gray' },
        { id: 'logs', name: 'Logs', icon: '📋', color: 'orange' }
    ];

    // Si no está autenticado, mostrar login
    if (!authState.isAuthenticated) {
        return (
            <LoginForm 
                onLogin={handleLogin}
                isLoading={authState.isLoading}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* User Header */}
                {authState.user && (
                    <UserHeader 
                        user={authState.user}
                        onLogout={handleLogout}
                    />
                )}

                {/* Header */}
                <header className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl mb-6 shadow-2xl">
                        <span className="text-3xl text-white">🇨🇴</span>
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
                        Colombia Productiva
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Sistema de envío de mensajes WhatsApp para el curso de 
                        <span className="font-semibold text-blue-700"> Gestión de Sostenibilidad</span>
                    </p>
                </header>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Estado WhatsApp</p>
                                <p className={`text-2xl font-bold ${whatsappStatus?.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                    {whatsappStatus?.isConnected ? 'Conectado' : 'Desconectado'}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                whatsappStatus?.isConnected ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                                <span className="text-xl">
                                    {whatsappStatus?.isConnected ? '✅' : '❌'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Contactos</p>
                                <p className="text-2xl font-bold text-blue-600">{contacts.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <span className="text-xl">👥</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Enviados</p>
                                <p className="text-2xl font-bold text-green-600">{results?.successCount || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <span className="text-xl">📤</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Fallidos</p>
                                <p className="text-2xl font-bold text-red-600">{results?.errorCount || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <span className="text-xl">❌</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex-1 py-6 px-4 text-center font-semibold text-sm transition-all duration-200 relative ${
                                        activeTab === tab.id
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex flex-col items-center space-y-2">
                                        <span className="text-2xl">{tab.icon}</span>
                                        <span>{tab.name}</span>
                                    </div>
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    {activeTab === 'whatsapp' && (
                        <WhatsAppSection
                            whatsappStatus={whatsappStatus}
                            qrLoading={qrLoading}
                            isCheckingStatus={isCheckingStatus}
                            onForceRefresh={forceRefreshStatus}
                            onReset={resetWhatsApp}
                            onGenerateQR={generateNewQR}
                            onRefreshClient={refreshClient}
                        />
                    )}

                    {activeTab === 'sheets' && (
                        <ContactsSection
                            contacts={contacts}
                            loading={loading}
                            onLoadContacts={loadContacts}
                            onLoadGroupContacts={loadGroupContacts}
                            onClearContacts={clearContacts}
                            onFilterContacts={handleFilterContacts}
                        />
                    )}

                    {activeTab === 'messages' && (
                        <MessagesSection
                            message={message}
                            setMessage={setMessage}
                            contacts={contacts}
                            results={results}
                            loading={loading}
                            whatsappStatus={whatsappStatus}
                            authState={authState}
                            onTestSend={testSend}
                            onSendMessages={sendMessages}
                            onFilterByTemplate={handleFilterByTemplate}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl mb-4 shadow-lg">
                                    <span className="text-2xl text-white">⚙️</span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h2>
                                <p className="text-gray-600">Ajustes y configuración del sistema</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Envío</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Delay entre mensajes (segundos)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                defaultValue="3"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Máximo contactos por lote
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                defaultValue="50"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estado WhatsApp:</span>
                                            <span className={`font-medium ${whatsappStatus?.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                                {whatsappStatus?.isConnected ? 'Conectado' : 'Desconectado'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Contactos cargados:</span>
                                            <span className="font-medium text-blue-600">{contacts.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Última actualización:</span>
                                            <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="text-center flex-1">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
                                        <span className="text-2xl text-white">📋</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Registro de Actividad</h2>
                                    <p className="text-gray-600">Monitorea las actividades del sistema en tiempo real</p>
                                </div>
                                <button
                                    onClick={clearLogs}
                                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    🧹 Limpiar Logs
                                </button>
                            </div>

                            <div className="bg-gray-900 text-green-400 rounded-2xl p-6 h-96 overflow-y-auto font-mono text-sm relative shadow-2xl">
                                {loading && (
                                    <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black py-2 px-4 text-center font-sans font-medium">
                                        Procesando... Por favor espera
                                    </div>
                                )}
                                {logs.length > 0 ? (
                                    <div className="space-y-1">
                                        {logs.map((log, index) => {
                                            let className = "whitespace-pre-wrap ";
                                            if (log.includes('❌')) className += 'text-red-400';
                                            else if (log.includes('⚠️')) className += 'text-yellow-400';
                                            else if (log.includes('✅')) className += 'text-green-400';
                                            else if (log.includes('🎉')) className += 'text-blue-400';
                                            else className += 'text-gray-300';
                                            
                                            return (
                                                <div key={index} className={className}>
                                                    {log}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-center py-12 font-sans">
                                        <div className="text-4xl mb-4">📝</div>
                                        <p>No hay logs disponibles</p>
                                        <p className="text-sm mt-2">Los logs aparecerán aquí cuando uses la aplicación</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                                        <span className="mr-2">ℹ️</span>
                                        Información
                                    </h3>
                                    <p className="text-sm text-blue-800">
                                        Los logs muestran información sobre el estado y actividades de la aplicación
                                    </p>
                                </div>
                                <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
                                    <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
                                        <span className="mr-2">⚠️</span>
                                        Advertencias
                                    </h3>
                                    <p className="text-sm text-yellow-800">
                                        Se muestran advertencias sobre posibles problemas o limitaciones
                                    </p>
                                </div>
                                <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                                    <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                                        <span className="mr-2">❌</span>
                                        Errores
                                    </h3>
                                    <p className="text-sm text-red-800">
                                        Los errores se registran para facilitar la identificación de problemas
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sending Progress Modal */}
                    <SendingProgressModal
          isOpen={showSendingModal}
          progress={sendingProgress}
          currentIndex={currentSendingIndex}
          totalContacts={filteredContacts.length}
          onClose={closeSendingModal}
          results={results}
          sessionId={authState.user?.whatsappSessionId}
        />
        </div>
    );
}