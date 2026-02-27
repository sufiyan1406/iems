import { NextResponse } from 'next/server';

// ============================================
// IEMS Production Middleware
// CORS, Security Headers, Rate Limiting
// Compatible with Vercel Edge Runtime
// ============================================

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());

// ---- Rate Limiting (Edge-compatible) ----
// Note: On Vercel serverless, in-memory state doesn't persist across invocations.
// This provides basic per-invocation limiting. For production-grade rate limiting,
// use Vercel's built-in firewall or Upstash Redis.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100');
const AUTH_RATE_LIMIT_MAX = 10;

function rateLimit(ip, path) {
    const isAuth = path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register');
    const max = isAuth ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX;
    const key = `${ip}:${isAuth ? 'auth' : 'api'}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(key, { start: now, count: 1 });
        // Lazy cleanup: remove old entries when map gets large
        if (rateLimitMap.size > 10000) {
            for (const [k, v] of rateLimitMap) {
                if (now - v.start > RATE_LIMIT_WINDOW * 2) rateLimitMap.delete(k);
            }
        }
        return { limited: false, remaining: max - 1 };
    }

    entry.count++;
    return entry.count > max
        ? { limited: true, remaining: 0 }
        : { limited: false, remaining: max - entry.count };
}

export function middleware(request) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get('origin') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';

    // ---- Rate Limit API routes ----
    if (pathname.startsWith('/api/')) {
        const { limited } = rateLimit(ip, pathname);
        if (limited) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }
    }

    // ---- CORS Preflight ----
    if (request.method === 'OPTIONS') {
        const corsOrigin = getCorsOrigin(origin);
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
            }
        });
    }

    // ---- Response with Headers ----
    const response = NextResponse.next();

    // CORS (API routes only)
    if (pathname.startsWith('/api/')) {
        const corsOrigin = getCorsOrigin(origin);
        response.headers.set('Access-Control-Allow-Origin', corsOrigin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    // Security Headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    response.headers.set('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none';"
    );

    return response;
}

function getCorsOrigin(origin) {
    if (ALLOWED_ORIGINS.includes('*')) return origin || '*';
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    return ALLOWED_ORIGINS[0] || '';
}

export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ]
};
