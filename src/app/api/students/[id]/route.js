import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const student = await db.prepare('SELECT * FROM students WHERE id = ?').get(id);

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get attendance stats
        const attendanceStats = await db.prepare(`
      SELECT
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        ROUND(SUM(CASE WHEN status = 'present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as percentage
      FROM attendance WHERE student_id = ?
    `).get(id);

        // Get marks
        const marks = await db.prepare(`
      SELECT m.*, s.name as subject_name, s.code as subject_code
      FROM marks m JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = ?
      ORDER BY s.name, m.exam_type
    `).all(id);

        // Get fees
        const fees = await db.prepare('SELECT * FROM fees WHERE student_id = ?').all(id);

        // Get assignment submissions
        const submissions = await db.prepare(`
      SELECT asub.*, a.title as assignment_title, s.name as subject_name
      FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE asub.student_id = ?
    `).all(id);

        // Get alerts
        const alerts = await db.prepare('SELECT * FROM alerts WHERE student_id = ? ORDER BY created_at DESC').all(id);

        // Subject-wise attendance
        const subjectAttendance = await db.prepare(`
      SELECT
        s.name as subject_name, s.code as subject_code,
        COUNT(*) as total,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
        ROUND(SUM(CASE WHEN a.status = 'present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as percentage
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.student_id = ?
      GROUP BY s.id
    `).all(id);

        return NextResponse.json({
            student,
            attendance: attendanceStats,
            subjectAttendance,
            marks,
            fees,
            submissions,
            alerts
        });
    } catch (error) {
        console.error('Student detail error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const data = await request.json();

        await db.prepare(`
      UPDATE students SET name=?, email=?, phone=?, department=?, semester=?,
      batch=?, gender=?, guardian_name=?, guardian_phone=?, address=?, status=?
      WHERE id=?
    `).run(
            data.name, data.email, data.phone, data.department, data.semester,
            data.batch, data.gender, data.guardian_name, data.guardian_phone,
            data.address, data.status, id
        );

        return NextResponse.json({ message: 'Student updated' });
    } catch (error) {
        console.error('Student PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        await db.prepare('DELETE FROM students WHERE id = ?').run(id);
        return NextResponse.json({ message: 'Student deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
