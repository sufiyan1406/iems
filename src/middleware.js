import { NextResponse } from 'next/server';

export function middleware(request) {
    // Pass everything through for now to fix Next.js 16 404 routing issues
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ]
};
