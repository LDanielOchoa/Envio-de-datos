# Guía de Deployment

## Opciones de Deployment

### 1. Vercel (Recomendado)

Vercel es la plataforma oficial de Next.js y ofrece la mejor experiencia de deployment.

#### Pasos:

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login a Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Configurar variables de entorno en Vercel Dashboard:**
   - `NODE_ENV=production`
   - `LOG_LEVEL=info`
   - `RATE_LIMIT_WINDOW_MS=900000`
   - `RATE_LIMIT_MAX_REQUESTS=100`

#### Configuración específica para Vercel:

Crear `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. Railway

Railway es una plataforma moderna para deployment de aplicaciones.

#### Pasos:

1. **Conectar repositorio en Railway**
2. **Configurar variables de entorno**
3. **Deploy automático**

### 3. Heroku

#### Pasos:

1. **Instalar Heroku CLI:**
```bash
npm install -g heroku
```

2. **Login:**
```bash
heroku login
```

3. **Crear app:**
```bash
heroku create your-app-name
```

4. **Configurar buildpacks:**
```bash
heroku buildpacks:set heroku/nodejs
```

5. **Deploy:**
```bash
git push heroku main
```

### 4. Docker

#### Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose:
```yaml
version: '3.8'
services:
  whatsapp-sheets:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./logs:/app/logs
      - ./.wwebjs_auth:/app/.wwebjs_auth
    restart: unless-stopped
```

## Variables de Entorno de Producción

```bash
# Configuración de la aplicación
NODE_ENV=production
PORT=3000

# Configuración de seguridad
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configuración de logs
LOG_LEVEL=info

# Configuración de WhatsApp (opcional)
WHATSAPP_SESSION_PATH=./.wwebjs_auth

# Configuración de Google Sheets (opcional)
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials.json
```

## Consideraciones de Producción

### 1. Seguridad

- **HTTPS:** Asegúrate de que tu aplicación use HTTPS en producción
- **Rate Limiting:** Configura límites apropiados para tu uso
- **CORS:** Configura orígenes permitidos específicos
- **Headers de Seguridad:** Implementa headers de seguridad

### 2. Performance

- **Caching:** Implementa caching para respuestas estáticas
- **Compression:** Habilita compresión gzip/brotli
- **CDN:** Usa un CDN para assets estáticos
- **Database:** Considera usar una base de datos para logs persistentes

### 3. Monitoreo

- **Logs:** Configura logging centralizado
- **Metrics:** Implementa métricas de performance
- **Health Checks:** Configura health checks
- **Alerts:** Configura alertas para errores críticos

### 4. Escalabilidad

- **Load Balancing:** Usa load balancers para múltiples instancias
- **Auto-scaling:** Configura auto-scaling basado en demanda
- **Database:** Usa bases de datos escalables
- **Caching:** Implementa caching distribuido

## Configuración de Dominio Personalizado

### Vercel:
1. Ve a tu proyecto en Vercel Dashboard
2. Settings > Domains
3. Agrega tu dominio personalizado
4. Configura DNS según las instrucciones

### Heroku:
```bash
heroku domains:add yourdomain.com
```

## SSL/HTTPS

### Vercel:
SSL automático incluido

### Heroku:
```bash
heroku certs:auto:enable
```

### Manual:
1. Obtén certificados SSL (Let's Encrypt)
2. Configura tu servidor web (nginx/apache)
3. Redirige HTTP a HTTPS

## Backup y Recuperación

### 1. Código
- Usa Git para versionado
- Configura backups automáticos del repositorio

### 2. Datos
- Backup de logs importantes
- Backup de sesiones de WhatsApp
- Backup de credenciales (encriptadas)

### 3. Configuración
- Documenta toda la configuración
- Usa variables de entorno
- Versiona archivos de configuración

## Troubleshooting

### Problemas Comunes:

1. **WhatsApp no se conecta en producción:**
   - Verifica que el servidor tenga acceso a internet
   - Configura timeouts apropiados
   - Usa sesiones persistentes

2. **Rate limiting muy estricto:**
   - Ajusta `RATE_LIMIT_MAX_REQUESTS`
   - Configura `RATE_LIMIT_WINDOW_MS`

3. **Errores de memoria:**
   - Aumenta memoria del servidor
   - Optimiza el código
   - Implementa garbage collection

4. **Problemas de CORS:**
   - Configura orígenes permitidos
   - Verifica headers de respuesta

## Monitoreo y Logs

### Configuración de Logs:
```javascript
// En producción, usa servicios de logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Métricas Recomendadas:
- Requests por minuto
- Tiempo de respuesta
- Tasa de error
- Uso de memoria
- Conexiones activas de WhatsApp

## Optimización

### 1. Build Optimization:
```bash
npm run build
npm run start
```

### 2. Image Optimization:
- Usa imágenes optimizadas
- Implementa lazy loading
- Usa formatos modernos (WebP)

### 3. Code Splitting:
- Next.js lo hace automáticamente
- Usa dynamic imports cuando sea necesario

### 4. Caching:
- Implementa caching de API responses
- Cache de assets estáticos
- Cache de sesiones de WhatsApp 