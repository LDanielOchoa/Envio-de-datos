'use client';

import { useState, useEffect } from 'react';
import { Contact, WhatsAppStatus, SendResults, TabType } from '../types';
import WhatsAppSection from '../components/WhatsAppSection';
import ContactsSection from '../components/ContactsSection';
import MessagesSection from '../components/MessagesSection';

export default function Home() {
    const [activeTab, setActiveTab] = useState<TabType>('whatsapp');
    const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [message, setMessage] = useState(`Buenas Tardes, estimados Extensionistas de Fabricas de Productividad!

Desde Colombia Productiva en Alianza con la Universidad Nacional de Colombia, los invitamos a participar en el curso virtual gratuito en Gestión de la Sostenibilidad en la empresa. El cual estará iniciado en el mes de Junio 2025.

Si estás interesado(a), puedes inscribirte en este link
https://bit.ly/cursofabricas

Para mayor información contactar: karen.mendez@colombiaproductiva.com; andiazce@unal.edu.co`);
    const [loading, setLoading] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [results, setResults] = useState<SendResults | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    // WhatsApp Functions
    const checkWhatsAppStatus = async () => {
        if (isCheckingStatus) return;

        try {
            setIsCheckingStatus(true);
            const response = await fetch('/api/whatsapp/status');

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
        try {
            addLog('🔍 Verificando conexión manualmente...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await fetch('/api/whatsapp/check-connection', {
                method: 'POST'
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
        if (qrLoading) return;

        try {
            setQrLoading(true);
            addLog('🔄 Reiniciando WhatsApp completamente...');

            const response = await fetch('/api/whatsapp/reset', {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                addLog('✅ WhatsApp reiniciado completamente');
                setWhatsappStatus({
                    isConnected: false,
                    qrCode: '',
                    phoneNumber: '',
                    lastSeen: undefined
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
        if (qrLoading) return;

        try {
            setQrLoading(true);
            addLog('🚀 Generando código QR...');

            const response = await fetch('/api/whatsapp/qr', {
                method: 'POST'
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
        addLog('🔄 Refrescando cliente WhatsApp...');
        try {
            const response = await fetch('/api/whatsapp/refresh', {
                method: 'POST'
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
        addLog(`📁 Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        try {
            const formData = new FormData();
            formData.append('file', file);

            addLog('📤 Enviando archivo al servidor...');
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
                addLog(`✅ Archivo procesado correctamente`);
                addLog(`📊 Contactos encontrados: ${contactsFound.length}`);
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error) {
            addLog(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const clearContacts = () => {
        setContacts([]);
        addLog('🧹 Lista de contactos limpiada');
    };

    // Message Functions
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                addLog('❌ Error: Solo se permiten archivos de imagen');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                addLog('❌ Error: La imagen no puede superar 5MB');
                return;
            }

            setSelectedImage(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            addLog(`📷 Imagen seleccionada: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        addLog('🗑️ Imagen eliminada');
    };

    const loadDefaultImage = async () => {
        addLog('📷 Cargando imagen desde /docs...');
        try {
            const response = await fetch('/api/whatsapp/load-default-image');
            const data = await response.json();
            if (data.success) {
                const byteCharacters = atob(data.data.buffer);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const file = new File([byteArray], data.data.name, { type: data.data.type });

                setSelectedImage(file);
                setImagePreview(data.data.dataUrl);
                addLog(`✅ Imagen cargada: ${data.data.name} (${(data.data.size / 1024 / 1024).toFixed(2)}MB)`);
            } else {
                addLog(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            addLog('❌ Error cargando imagen');
        }
    };

    const testSend = async () => {
        if (!message.trim()) {
            addLog('❌ Error: Escribe un mensaje primero');
            return;
        }

        addLog('🧪 Enviando mensaje de prueba...');
        try {
            const formData = new FormData();
            formData.append('phone', '573002473899');
            formData.append('message', message);

            if (selectedImage) {
                formData.append('image', selectedImage);
                addLog(`📷 Incluyendo imagen en prueba: ${selectedImage.name}`);
            }

            const response = await fetch('/api/whatsapp/test-send', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                addLog('✅ Mensaje de prueba enviado correctamente');
                if (data.details?.imageIncluded) {
                    addLog(`📷 Imagen incluida: ${data.details.imageName}`);
                }
                addLog('📱 ¡Revisa tu WhatsApp para verificar!');
            } else {
                addLog(`❌ Error en prueba: ${data.error}`);
            }
        } catch (error) {
            addLog('❌ Error enviando mensaje de prueba');
        }
    };

    const sendMessages = async () => {
        if (!message.trim()) {
            addLog('❌ Error: Por favor, ingresa un mensaje');
            return;
        }

        if (contacts.length === 0) {
            addLog('❌ Error: Por favor, carga contactos primero');
            return;
        }

        setLoading(true);
        addLog(`📤 Enviando mensajes a ${contacts.length} contactos...`);

        try {
            const formData = new FormData();
            formData.append('contacts', JSON.stringify(contacts));
            formData.append('message', message);

            if (selectedImage) {
                formData.append('image', selectedImage);
                addLog(`📷 Incluyendo imagen: ${selectedImage.name}`);
            }

            const response = await fetch('/api/whatsapp/send-reliable', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setResults(data.data);
                addLog(`✅ Mensajes enviados: ${data.data.successCount} exitosos, ${data.data.errorCount} fallidos`);
                if (selectedImage) {
                    addLog('📷 Mensajes enviados con imagen');
                }
            } else {
                addLog(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            addLog('❌ Error al enviar mensajes');
        } finally {
            setLoading(false);
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

    // Effects
    useEffect(() => {
        checkWhatsAppStatus();

        const eventSource = new EventSource('/api/whatsapp/connection-events');

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
    }, []);

    const tabs = [
        { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: 'blue' },
        { id: 'sheets', name: 'Contactos', icon: '📊', color: 'green' },
        { id: 'messages', name: 'Mensajes', icon: '💬', color: 'purple' },
        { id: 'settings', name: 'Configuración', icon: '⚙️', color: 'gray' },
        { id: 'logs', name: 'Logs', icon: '📋', color: 'orange' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="max-w-7xl mx-auto p-6">
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
                            onClearContacts={clearContacts}
                        />
                    )}

                    {activeTab === 'messages' && (
                        <MessagesSection
                            message={message}
                            setMessage={setMessage}
                            contacts={contacts}
                            results={results}
                            loading={loading}
                            selectedImage={selectedImage}
                            imagePreview={imagePreview}
                            whatsappStatus={whatsappStatus}
                            onImageChange={handleImageChange}
                            onRemoveImage={removeImage}
                            onLoadDefaultImage={loadDefaultImage}
                            onTestSend={testSend}
                            onSendMessages={sendMessages}
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
        </div>
    );
}