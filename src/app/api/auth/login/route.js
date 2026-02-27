import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { comparePassword, createToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const db = getDb();
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !comparePassword(password, user.password)) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const token = createToken(user);

        // If student, look up student_id
        let studentId = null;
        if (user.role === 'student') {
            const student = await db.prepare('SELECT id FROM students WHERE user_id = ?').get(user.id);
            if (student) studentId = student.id;
        }

        const response = NextResponse.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role, studentId }
        });

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
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
