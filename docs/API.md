# API Documentation

## Endpoints

### WhatsApp Status

#### GET /api/whatsapp/status

Obtiene el estado actual de la conexión de WhatsApp.

**Response:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "phoneNumber": "573001234567",
    "lastSeen": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error al obtener estado de WhatsApp"
}
```

---

### Google Sheets Contacts

#### POST /api/sheets/contacts

Carga contactos desde Google Sheets.

**Request Body:**
```json
{
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "range": "A:C",
  "credentials": {
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "your-private-key-id",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
    "client_id": "your-client-id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact_1",
        "name": "Juan Pérez",
        "phone": "+573001234567",
        "email": "juan@example.com",
        "status": "pending"
      }
    ],
    "total": 1
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No se tiene acceso a la hoja de cálculo especificada"
}
```

---

### Send WhatsApp Messages

#### POST /api/whatsapp/send

Envía mensajes de WhatsApp a múltiples contactos.

**Request Body:**
```json
{
  "contacts": [
    {
      "id": "contact_1",
      "name": "Juan Pérez",
      "phone": "+573001234567"
    }
  ],
  "message": "Hola {nombre}, gracias por contactarnos."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalContacts": 1,
    "results": [
      {
        "contactId": "contact_1",
        "status": "success"
      }
    ],
    "successCount": 1,
    "errorCount": 0
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "WhatsApp no está conectado. Por favor, escanea el código QR primero.",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Datos de entrada inválidos |
| 401 | Unauthorized - No autorizado |
| 403 | Forbidden - Acceso denegado |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Demasiadas solicitudes |
| 500 | Internal Server Error - Error interno del servidor |

## Rate Limiting

La API implementa rate limiting para prevenir spam:

- **Límite:** 100 requests por 15 minutos
- **Header:** `X-RateLimit-Remaining` muestra requests restantes
- **Error:** 429 cuando se excede el límite

## Data Formats

### Contact Object
```typescript
interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  message?: string;
  sentAt?: Date;
  error?: string;
}
```

### WhatsApp Message Object
```typescript
interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  variables?: Record<string, string>;
}
```

### Google Sheets Config
```typescript
interface GoogleSheetConfig {
  spreadsheetId: string;
  range: string;
  credentials: any;
}
```

## Message Templates

Los mensajes soportan variables de personalización:

- `{nombre}` - Nombre del contacto
- `{telefono}` - Número de teléfono

Ejemplo:
```
Hola {nombre}, gracias por contactarnos. Te llamaremos al {telefono} pronto.
```

## Phone Number Format

Los números de teléfono deben estar en formato internacional:

- ✅ `+573001234567`
- ✅ `573001234567`
- ❌ `3001234567`
- ❌ `+57 300 123 4567`

## Security

- Todas las credenciales se procesan localmente
- No se almacenan datos permanentemente
- Rate limiting para prevenir spam
- Validación de números de teléfono
- Verificación de números registrados en WhatsApp 