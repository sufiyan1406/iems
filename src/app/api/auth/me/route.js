import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
    try {
        const cookies = request.headers.get('cookie');
        let token = null;
        if (cookies) {
            const match = cookies.match(/token=([^;]+)/);
            if (match) token = match[1];
        }

        const auth = request.headers.get('authorization');
        if (auth && auth.startsWith('Bearer ')) {
            token = auth.slice(7);
        }

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const user = verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
