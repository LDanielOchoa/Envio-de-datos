# WhatsApp Backend con Baileys

Backend de Node.js con Express y Baileys para conexión de WhatsApp mediante código QR.

## Características

- ✅ Conexión a WhatsApp usando Baileys
- 📱 Código QR mostrado en terminal
- 🔄 Reconexión automática
- 📊 Monitoreo de estado de conexión
- 🌐 API REST para consultar estado
- 💾 Persistencia de sesión

## Instalación

```bash
npm install
```

## Uso

### Iniciar el servidor
```bash
npm start
```

### Modo desarrollo (con nodemon)
```bash
npm run dev
```

## Funcionamiento

1. **Inicio**: Al ejecutar el servidor, se iniciará automáticamente la conexión de WhatsApp
2. **Código QR**: Se mostrará un código QR en la terminal que debes escanear con WhatsApp
3. **Estado**: El servidor mostrará el estado de conexión cada 30 segundos
4. **Persistencia**: La sesión se guarda automáticamente para reconexiones futuras

## Estados de Conexión

- `disconnected`: Sin conexión
- `connecting`: Conectando...
- `qr_ready`: Código QR listo para escanear
- `connected`: Conectado y activo
- `error`: Error en la conexión

## API Endpoints

### GET /api/status
Obtiene el estado actual de la conexión
```json
{
  "status": "connected",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "hasQR": false
}
```

### GET /api/qr
Obtiene el código QR actual (si está disponible)
```json
{
  "qr": "data:image/png;base64,...",
  "status": "qr_ready"
}
```

### POST /api/disconnect
Desconecta WhatsApp manualmente

### POST /api/reconnect
Fuerza una reconexión

### GET /health
Health check del servidor

## Estructura de Archivos

```
whatsapp-backend/
├── server.js          # Servidor principal
├── package.json       # Dependencias
├── auth_info/         # Carpeta de autenticación (se crea automáticamente)
└── README.md          # Este archivo
```

## Notas Importantes

- La carpeta `auth_info/` se crea automáticamente para guardar la sesión
- Una vez conectado, no necesitarás escanear el QR nuevamente
- El servidor se ejecuta en el puerto 3001 por defecto
- Usa Ctrl+C para cerrar el servidor de forma segura

## Troubleshooting

Si tienes problemas de conexión:
1. Elimina la carpeta `auth_info/`
2. Reinicia el servidor
3. Escanea el nuevo código QR
