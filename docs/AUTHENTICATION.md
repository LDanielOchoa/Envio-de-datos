# Sistema de Autenticación - Colombia Productiva

## Descripción

El sistema ahora incluye un sistema de autenticación que permite a múltiples usuarios trabajar de forma independiente, cada uno con su propia sesión de WhatsApp.

## Usuarios Configurados

### Usuario 1 (Administrador)
- **Usuario:** `usuario1`
- **Contraseña:** `colombia2024`
- **Rol:** Administrador
- **Sesión WhatsApp:** `session-usuario1`

### Usuario 2 (Usuario Regular)
- **Usuario:** `usuario2`
- **Contraseña:** `colombia2024`
- **Rol:** Usuario
- **Sesión WhatsApp:** `session-usuario2`

## Características del Sistema

### 1. Sesiones Independientes
- Cada usuario tiene su propia sesión de WhatsApp completamente separada
- Los usuarios no pueden ver ni interferir con las sesiones de otros usuarios
- Cada sesión mantiene su propio estado de conexión, QR codes y mensajes

### 2. Gestión de Estado
- El estado de autenticación se mantiene en el frontend
- Al cerrar sesión, se limpia todo el estado del usuario
- Cada usuario tiene su propio historial de logs y contactos

### 3. Seguridad
- Autenticación simple pero efectiva
- Contraseñas hardcodeadas para el entorno de desarrollo
- Sesiones de WhatsApp aisladas por usuario

## Flujo de Trabajo

### 1. Inicio de Sesión
1. El usuario accede a la aplicación
2. Se muestra el formulario de login
3. El usuario ingresa sus credenciales
4. Se valida contra la configuración de usuarios
5. Si es válido, se crea la sesión del usuario

### 2. Trabajo con WhatsApp
1. Cada usuario debe conectar su propio WhatsApp
2. Los QR codes son específicos por usuario
3. Los mensajes se envían desde la sesión del usuario autenticado

### 3. Cierre de Sesión
1. El usuario hace clic en "Cerrar Sesión"
2. Se limpia todo el estado del usuario
3. Se desconecta la sesión de WhatsApp
4. Se redirige al login

## Configuración

### Agregar Nuevos Usuarios

Para agregar un nuevo usuario, edita el archivo `src/lib/users-config.ts`:

```typescript
export const USERS: UserConfig[] = [
  // ... usuarios existentes
  {
    id: 'user3',
    username: 'usuario3',
    password: 'nueva-contraseña',
    name: 'Usuario 3',
    role: 'user',
    whatsappSessionId: 'session-usuario3'
  }
];
```

### Cambiar Contraseñas

Para cambiar las contraseñas, modifica el campo `password` en el archivo de configuración.

## APIs Modificadas

Todas las APIs de WhatsApp ahora aceptan el parámetro `sessionId`:

- `GET /api/whatsapp/status?sessionId=session-usuario1`
- `POST /api/whatsapp/qr` (con sessionId en el body)
- `POST /api/whatsapp/send-reliable` (con sessionId en headers)
- Y todas las demás APIs relacionadas

## Consideraciones de Seguridad

⚠️ **Importante:** Este sistema está diseñado para un entorno de desarrollo/uso interno. Para producción, considera:

1. **Encriptación de contraseñas:** Usar bcrypt o similar
2. **Base de datos:** Almacenar usuarios en una base de datos
3. **JWT/Sessions:** Implementar tokens de sesión
4. **HTTPS:** Asegurar todas las comunicaciones
5. **Rate Limiting:** Limitar intentos de login

## Troubleshooting

### Problemas Comunes

1. **"Usuario no autenticado"**
   - Verifica que hayas iniciado sesión correctamente
   - Revisa que el usuario esté en la configuración

2. **"WhatsApp no está conectado"**
   - Cada usuario debe conectar su propio WhatsApp
   - Escanea el QR code específico de tu sesión

3. **"Error de sesión"**
   - Cierra sesión y vuelve a iniciar
   - Verifica que no haya conflictos de sesión

### Logs

Los logs muestran información específica por usuario:
- `🔐 Usuario [nombre] autenticado exitosamente`
- `📱 Sesión WhatsApp: [session-id]`
- `🚪 Sesión cerrada exitosamente` 