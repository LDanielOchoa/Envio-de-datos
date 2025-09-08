# Stage 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Crear un package.json temporal solo con las dependencias esenciales
RUN node -e " \
const pkg = require('./package.json'); \
const essentialDeps = { \
  'next': pkg.dependencies.next, \
  'react': pkg.dependencies.react, \
  'react-dom': pkg.dependencies['react-dom'], \
  '@whiskeysockets/baileys': pkg.dependencies['@whiskeysockets/baileys'], \
  'qrcode': pkg.dependencies.qrcode, \
  'axios': pkg.dependencies.axios, \
  'cors': pkg.dependencies.cors, \
  'winston': pkg.dependencies.winston, \
  'uuid': pkg.dependencies.uuid, \
  'dotenv': pkg.dependencies.dotenv \
}; \
pkg.dependencies = essentialDeps; \
delete pkg.devDependencies; \
delete pkg.scripts.postinstall; \
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

# Install only essential dependencies
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN npm ci --omit=dev --no-audit --no-fund

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-slim AS production

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy backend files
COPY backend ./backend

# Install backend dependencies separately
WORKDIR /app/backend
RUN npm ci --omit=dev --no-audit --no-fund

# Set working directory back to app
WORKDIR /app

# Create auth_info directory for WhatsApp sessions
RUN mkdir -p backend/auth_info

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]