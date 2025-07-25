/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Configuración para manejar archivos grandes y muchos contactos
  experimental: {
    // Aumentar límite de body para cargas grandes
    isrMemoryCacheSize: 0,
  },
  // Configurar límites de API
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Aumentar límite de 1MB a 50MB
    },
    responseLimit: false,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig