#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando WhatsApp Sheets Integration...\n');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Directorio de logs creado');
}

// Crear directorio de sesiones de WhatsApp si no existe
const sessionsDir = path.join(__dirname, '..', '.wwebjs_auth');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
  console.log('✅ Directorio de sesiones de WhatsApp creado');
}

// Crear archivo .env.local si no existe
const envFile = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envFile)) {
  const envContent = `# Configuración de la aplicación
NODE_ENV=development
PORT=3000

# Configuración de Google Sheets (opcional - se puede cargar desde la UI)
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials.json

# Configuración de WhatsApp (opcional)
WHATSAPP_SESSION_PATH=./.wwebjs_auth

# Configuración de seguridad
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configuración de logs
LOG_LEVEL=info
`;
  
  fs.writeFileSync(envFile, envContent);
  console.log('✅ Archivo .env.local creado');
}

// Crear archivo .gitignore si no existe
const gitignoreFile = path.join(__dirname, '..', '.gitignore');
if (!fs.existsSync(gitignoreFile)) {
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/

# Production
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# WhatsApp sessions
.wwebjs_auth/

# Google credentials
credentials.json
*.json

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity
`;
  
  fs.writeFileSync(gitignoreFile, gitignoreContent);
  console.log('✅ Archivo .gitignore creado');
}

console.log('\n🎉 Configuración completada exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ejecuta: npm install');
console.log('2. Configura las credenciales de Google Cloud Platform');
console.log('3. Ejecuta: npm run dev');
console.log('4. Abre http://localhost:3000 en tu navegador');
console.log('\n📚 Consulta el README.md para más información'); 