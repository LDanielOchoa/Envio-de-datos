# WhatsApp Sheets Integration

Una aplicación profesional para enviar mensajes de WhatsApp desde Google Sheets usando Next.js. Esta solución es completamente gratuita y no requiere Redis.

## 🚀 Características

- ✅ **Integración con Google Sheets**: Lee contactos directamente desde hojas de cálculo
- ✅ **WhatsApp Web**: Envío de mensajes usando WhatsApp Web.js
- ✅ **Interfaz moderna**: UI responsive y profesional con Tailwind CSS
- ✅ **Validación de números**: Verifica que los números estén registrados en WhatsApp
- ✅ **Personalización**: Mensajes personalizados con el nombre del contacto
- ✅ **Control de spam**: Delays automáticos entre mensajes
- ✅ **Sin Redis**: Solución completamente local
- ✅ **API Routes**: Backend integrado con Next.js

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de Google Cloud Platform
- WhatsApp activo en tu teléfono

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd whatsapp-sheets-integration
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

## 🔧 Configuración de Google Sheets

### 1. Publicar la hoja de Google Sheets

1. Abre tu hoja de Google Sheets
2. Ve a **Archivo** → **Compartir** → **Publicar en la web**
3. Selecciona **"Entire Document"** y **"Web page"**
4. Haz clic en **"Publish"**
5. Copia la URL generada (formato: `https://docs.google.com/spreadsheets/d/e/.../pubhtml`)

### 2. Preparar la hoja de Google Sheets

Crea una hoja con la siguiente estructura:

| TeléfonoBeneficiario | Contacto | Estado        |
|---------------------|----------|---------------|
| 3002473899          | Cyndi    | Sin contactar |
| 3001234567          | Juan     | Sin contactar |

**Nota:** La primera columna debe ser el número de teléfono y la segunda el nombre del contacto.

### 3. Usar la URL en la aplicación

1. Copia la URL publicada de tu Google Sheet
2. Pégala en el campo "URL del Google Sheet Publicado" en la aplicación
3. Haz clic en "Cargar Contactos"

## 🚀 Uso

1. **Iniciar la aplicación**
```bash
npm run dev
```

2. **Abrir en el navegador**
```
http://localhost:3000
```

3. **Configurar la aplicación**
   - Pega la URL de tu Google Sheet publicado
   - Haz clic en "Cargar Contactos"

4. **Conectar WhatsApp**
   - Escanea el código QR que aparece en la aplicación
   - Espera a que se conecte automáticamente

5. **Cargar contactos**
   - Haz clic en "Cargar Contactos"
   - Verifica que se carguen correctamente

6. **Enviar mensajes**
   - Escribe tu mensaje (usa `{nombre}` para personalizar)
   - Haz clic en "Enviar a X contactos"

## 📝 Formato de Mensajes

Puedes personalizar los mensajes usando variables:

- `{nombre}`: Se reemplaza con el nombre del contacto
- `{telefono}`: Se reemplaza con el número de teléfono

Ejemplo:
```
Hola {nombre}, gracias por contactarnos. Te llamaremos al {telefono} pronto.
```

## 🔒 Seguridad y Buenas Prácticas

### Control de Spam
- La aplicación incluye delays automáticos entre mensajes (3 segundos)
- Valida que los números estén registrados en WhatsApp
- Limita el número de mensajes por sesión

### Privacidad
- Los datos se procesan localmente
- No se almacenan números de teléfono permanentemente
- Las credenciales de Google se mantienen seguras

### Recomendaciones
- Envía mensajes en horarios apropiados
- Usa mensajes personalizados y relevantes
- Respeta las políticas de WhatsApp
- No envíes spam o contenido no solicitado

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── whatsapp/
│   │   │   ├── status/route.ts
│   │   │   └── send/route.ts
│   │   └── sheets/
│   │       └── contacts/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── google-sheets.ts
│   └── whatsapp-service.ts
└── types/
    └── index.ts
```

## 🔧 API Endpoints

### GET /api/whatsapp/status
Obtiene el estado de conexión de WhatsApp

### POST /api/sheets/contacts
Carga contactos desde Google Sheets

**Body:**
```json
{
  "sheetUrl": "https://docs.google.com/spreadsheets/d/e/.../pubhtml"
}
```

### POST /api/whatsapp/send
Envía mensajes de WhatsApp

**Body:**
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

## 🐛 Solución de Problemas

### WhatsApp no se conecta
- Verifica que tu teléfono tenga conexión a internet
- Asegúrate de que WhatsApp esté abierto en tu teléfono
- Intenta escanear el código QR nuevamente

### Error al cargar contactos
- Verifica que el ID de la hoja sea correcto
- Asegúrate de que la cuenta de servicio tenga permisos
- Revisa que el rango especificado contenga datos

### Mensajes no se envían
- Verifica que WhatsApp esté conectado
- Asegúrate de que los números estén registrados en WhatsApp
- Revisa que el formato de los números sea correcto

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📞 Soporte

Si tienes problemas o preguntas, abre un issue en el repositorio. 