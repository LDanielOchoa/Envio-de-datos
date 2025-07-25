import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import RateLimiter from './lib/rate-limiter';

const rateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
);

export function middleware(request: NextRequest) {
  // Obtener IP del cliente
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Excluir endpoints que necesitan consultas frecuentes del rate limiting
  const url = request.nextUrl.pathname;
  const isProgressEndpoint = url.includes('/api/whatsapp/sending-progress');
  const isConnectionEventsEndpoint = url.includes('/api/whatsapp/connection-events');
  
  // Solo aplicar rate limiting si no es un endpoint de progreso o eventos de conexión
  if (!isProgressEndpoint && !isConnectionEventsEndpoint) {
    if (!rateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        { status: 429 }
      );
    }
  }

  // Configurar headers CORS
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Solo incluir header de rate limit si se aplicó rate limiting
  if (!isProgressEndpoint && !isConnectionEventsEndpoint) {
    response.headers.set('X-RateLimit-Remaining', rateLimiter.getRemainingRequests(ip).toString());
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
}; 