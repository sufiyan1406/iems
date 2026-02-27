import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const teachers = await db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM subjects WHERE teacher_id = t.id) as subject_count
      FROM teachers t
      ORDER BY t.name
    `).all();
        return NextResponse.json({ teachers });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const data = await request.json();
        const result = await db.prepare(`
      INSERT INTO teachers (employee_id, name, email, phone, department, specialization, qualification, experience_years)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.employee_id, data.name, data.email, data.phone, data.department, data.specialization, data.qualification, data.experience_years);
        return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
