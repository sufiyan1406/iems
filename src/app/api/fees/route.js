import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('student_id');

        if (studentId) {
            const fees = await db.prepare('SELECT * FROM fees WHERE student_id = ? ORDER BY due_date DESC').all(studentId);
            const summary = await db.prepare(`
        SELECT
          SUM(amount) as total_amount,
          SUM(paid) as total_paid,
          SUM(amount - paid) as total_pending,
          SUM(CASE WHEN status='overdue' THEN amount - paid ELSE 0 END) as overdue_amount
        FROM fees WHERE student_id = ?
      `).get(studentId);
            return NextResponse.json({ fees, summary });
        }

        const overallStats = await db.prepare(`
      SELECT
        SUM(amount) as total_amount,
        SUM(paid) as total_paid,
        SUM(amount - paid) as total_pending,
        COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status='partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN status='overdue' THEN 1 END) as overdue_count,
        COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count,
        COUNT(*) as total_records
      FROM fees
    `).get();

        const defaulters = await db.prepare(`
      SELECT s.id, s.name, s.enrollment_no, s.department,
        SUM(f.amount - f.paid) as pending_amount
      FROM fees f JOIN students s ON f.student_id = s.id
      WHERE f.status IN ('overdue', 'partial')
      GROUP BY s.id
      ORDER BY pending_amount DESC
      LIMIT 20
    `).all();

        return NextResponse.json({ stats: overallStats, defaulters });
    } catch (error) {
        console.error('Fees GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const data = await request.json();
        const result = await db.prepare(`
      INSERT INTO fees (student_id, fee_type, amount, paid, due_date, status, semester, academic_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.student_id, data.fee_type, data.amount, data.paid || 0, data.due_date, data.status || 'pending', data.semester, data.academic_year);
        return NextResponse.json({ id: result.lastInsertRowid, message: 'Fee record created' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const db = getDb();
        const data = await request.json();
        await db.prepare(`
      UPDATE fees SET paid=?, paid_date=?, status=? WHERE id=?
    `).run(data.paid, data.paid_date || new Date().toISOString().split('T')[0], data.status, data.id);
        return NextResponse.json({ message: 'Fee updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
