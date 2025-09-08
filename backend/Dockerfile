FROM node:20-slim

# Instalar dependencias necesarias para Baileys y WhatsApp
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production --no-audit --no-fund

# Copiar el código fuente
COPY . .

# Crear directorio para las sesiones de WhatsApp
RUN mkdir -p auth_info

# Exponer el puerto del backend
EXPOSE 3001

# Variables de entorno
ENV NODE_ENV=production

# Comando para ejecutar el servidor
CMD ["npm", "start"]
