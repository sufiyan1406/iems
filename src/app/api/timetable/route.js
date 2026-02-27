import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const department = searchParams.get('department');
        const semester = searchParams.get('semester');

        let query = `
      SELECT t.*, s.name as subject_name, s.code as subject_code,
             tea.name as teacher_name
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN teachers tea ON t.teacher_id = tea.id
      WHERE 1=1
    `;
        const params = [];

        if (department) { query += ` AND t.department = $${params.length + 1}`; params.push(department); }
        if (semester) { query += ` AND t.semester = $${params.length + 1}`; params.push(parseInt(semester)); }

        query += ` ORDER BY
      CASE t.day
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      END, t.period`;

        const pool = db.getPool();
        const result = await pool.query(query, params);
        return NextResponse.json({ timetable: result.rows });
    } catch (error) {
        console.error('Timetable GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const data = await request.json();

        if (data.action === 'generate') {
            return await generateTimetable(db, data);
        }

        const result = await db.prepare(`
      INSERT INTO timetable (day, period, start_time, end_time, subject_id, teacher_id, room, department, semester, section)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.day, data.period, data.start_time, data.end_time, data.subject_id, data.teacher_id, data.room, data.department, data.semester, data.section || 'A');

        return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        console.error('Timetable POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function generateTimetable(db, options) {
    const department = options.department || 'Computer Science';
    const semester = options.semester || 3;

    // Clear existing timetable for this dept/semester
    await db.prepare('DELETE FROM timetable WHERE department = ? AND semester = ?').run(department, semester);

    // Get subjects for this department and semester
    const subjects = await db.prepare('SELECT * FROM subjects WHERE department = ? AND semester = ?').all(department, semester);
    if (subjects.length === 0) {
        const mathSubjects = await db.prepare('SELECT * FROM subjects WHERE department = ? AND semester <= ?').all('Mathematics', semester);
        subjects.push(...mathSubjects.slice(0, 2));
    }

    if (subjects.length === 0) {
        return NextResponse.json({ error: 'No subjects found for this configuration' }, { status: 400 });
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = [
        { period: 1, start: '09:00', end: '09:50' },
        { period: 2, start: '09:50', end: '10:40' },
        { period: 3, start: '11:00', end: '11:50' },
        { period: 4, start: '11:50', end: '12:40' },
        { period: 5, start: '14:00', end: '14:50' },
        { period: 6, start: '14:50', end: '15:40' },
    ];

    const rooms = ['R101', 'R102', 'R103', 'R201', 'R202', 'Lab-1', 'Lab-2'];
    const entries = [];
    const teacherSchedule = {};

    // Use pool directly for transaction
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const day of days) {
            for (const p of periods) {
                const idx = (days.indexOf(day) * periods.length + p.period) % subjects.length;
                const subject = subjects[idx];
                const teacherId = subject.teacher_id;

                if (!teacherSchedule[teacherId]) teacherSchedule[teacherId] = {};
                if (!teacherSchedule[teacherId][day]) teacherSchedule[teacherId][day] = new Set();

                if (teacherSchedule[teacherId][day].has(p.period)) continue;

                teacherSchedule[teacherId][day].add(p.period);
                const room = subject.type === 'practical' ? rooms[5 + (p.period % 2)] : rooms[p.period % 5];

                await client.query(
                    'INSERT INTO timetable (day, period, start_time, end_time, subject_id, teacher_id, room, department, semester, section) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
                    [day, p.period, p.start, p.end, subject.id, teacherId, room, department, semester, 'A']
                );
                entries.push({ day, period: p.period, subject: subject.name, room });
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    return NextResponse.json({
        message: 'Timetable generated successfully',
        entries_created: entries.length,
        department,
        semester
    });
}
