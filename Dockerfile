FROM node:18-slim

# Instalar dependencias necesarias para Chromium
RUN apt-get update && apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de la aplicación
WORKDIR /app

# Copiar todo el código fuente primero
COPY . .

# Establecer NODE_ENV=production para evitar la ejecución del script setup durante la instalación
ENV NODE_ENV=production

# Instalar TODAS las dependencias, incluyendo devDependencies
RUN npm install --include=dev

# Construir la aplicación
RUN npm run build

# Limpiar dependencias de desarrollo y reinstalar solo las de producción
RUN npm ci --only=production

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "start"] 