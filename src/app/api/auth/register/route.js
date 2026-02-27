import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password, name, role = 'admin' } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
        }

        const db = getDb();
        const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        const hashedPassword = hashPassword(password);
        const result = await db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(email, hashedPassword, name, role);

        const user = { id: result.lastInsertRowid, email, name, role };
        const token = createToken(user);

        const response = NextResponse.json({ token, user });
        const isProduction = process.env.NODE_ENV === 'production';
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
