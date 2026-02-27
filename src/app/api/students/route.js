import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const department = searchParams.get('department') || '';
        const semester = searchParams.get('semester') || '';
        const status = searchParams.get('status') || '';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = 'SELECT * FROM students WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR enrollment_no LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (department) {
            query += ' AND department = ?';
            params.push(department);
        }
        if (semester) {
            query += ' AND semester = ?';
            params.push(parseInt(semester));
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const totalRow = await db.prepare(countQuery).get(...params);
        const total = totalRow.total;

        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const students = await db.prepare(query).all(...params);

        return NextResponse.json({ students, total, limit, offset });
    } catch (error) {
        console.error('Students GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const data = await request.json();

        const result = await db.prepare(`
      INSERT INTO students (enrollment_no, name, email, phone, department, semester, batch, gender, guardian_name, guardian_phone, address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            data.enrollment_no, data.name, data.email, data.phone,
            data.department, data.semester, data.batch, data.gender,
            data.guardian_name, data.guardian_phone, data.address, data.status || 'active'
        );

        return NextResponse.json({ id: result.lastInsertRowid, message: 'Student created' }, { status: 201 });
    } catch (error) {
        console.error('Students POST error:', error);
        if (error.message?.includes('UNIQUE')) {
            return NextResponse.json({ error: 'Enrollment number already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
