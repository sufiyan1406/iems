import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const subjectId = searchParams.get('subject_id');
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    if (studentId) {
      const records = await db.prepare(`
        SELECT a.*, s.name as subject_name, s.code as subject_code
        FROM attendance a JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = ?
        ORDER BY a.date DESC
        LIMIT 100
      `).all(studentId);
      return NextResponse.json({ records });
    }

    // Overall stats
    const stats = await db.prepare(`
      SELECT
        COUNT(DISTINCT student_id) as total_students,
        ROUND(SUM(CASE WHEN status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as avg_attendance,
        COUNT(DISTINCT date) as total_days,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as total_absents
      FROM attendance
      ${date ? 'WHERE date = ?' : month ? "WHERE SUBSTRING(date, 1, 7) = ?" : ''}
    `).get(...(date ? [date] : month ? [month] : []));

    // Department-wise
    const deptStats = await db.prepare(`
      SELECT
        st.department,
        ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as avg_attendance,
        COUNT(DISTINCT st.id) as student_count
      FROM attendance a
      JOIN students st ON a.student_id = st.id
      GROUP BY st.department
    `).all();

    // Daily trend (last 30 days)
    const trend = await db.prepare(`
      SELECT
        date,
        ROUND(SUM(CASE WHEN status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as percentage,
        COUNT(*) as total_records
      FROM attendance
      WHERE date >= (CURRENT_DATE - INTERVAL '30 days')::text
      GROUP BY date
      ORDER BY date ASC
    `).all();

    // Low attendance students
    const lowAttendance = await db.prepare(`
      SELECT
        st.id, st.name, st.enrollment_no, st.department,
        ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as percentage
      FROM attendance a
      JOIN students st ON a.student_id = st.id
      GROUP BY st.id, st.name, st.enrollment_no, st.department
      HAVING ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) < 75
      ORDER BY ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) ASC
    `).all();

    return NextResponse.json({ stats, deptStats, trend, lowAttendance });
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const data = await request.json();

    if (Array.isArray(data.records)) {
      const pool = db.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const r of data.records) {
          await client.query(
            'INSERT INTO attendance (student_id, subject_id, date, status) VALUES ($1, $2, $3, $4) ON CONFLICT (student_id, subject_id, date) DO UPDATE SET status = $4',
            [r.student_id, r.subject_id, r.date, r.status]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
      return NextResponse.json({ message: `${data.records.length} attendance records saved` });
    }

    await db.prepare('INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?) ON CONFLICT (student_id, subject_id, date) DO UPDATE SET status = EXCLUDED.status')
      .run(data.student_id, data.subject_id, data.date, data.status);

    return NextResponse.json({ message: 'Attendance marked' }, { status: 201 });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

