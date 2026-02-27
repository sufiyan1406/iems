import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const subjects = await db.prepare(`
      SELECT s.*, t.name as teacher_name
      FROM subjects s
      LEFT JOIN teachers t ON s.teacher_id = t.id
      ORDER BY s.department, s.semester, s.name
    `).all();
        return NextResponse.json({ subjects });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const data = await request.json();
        const result = await db.prepare(`
      INSERT INTO subjects (code, name, department, semester, credits, type, teacher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.code, data.name, data.department, data.semester, data.credits, data.type, data.teacher_id);
        return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
