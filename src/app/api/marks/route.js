import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const subjectId = searchParams.get('subject_id');

    if (studentId) {
      const marks = await db.prepare(`
        SELECT m.*, s.name as subject_name, s.code as subject_code
        FROM marks m JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = ?
        ORDER BY s.name, m.exam_type
      `).all(studentId);

      const avgPerformance = await db.prepare(`
        SELECT
          s.name as subject_name,
          ROUND(SUM(m.obtained_marks) / SUM(m.max_marks) * 100, 1) as percentage
        FROM marks m JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = ?
        GROUP BY s.id
      `).all(studentId);

      return NextResponse.json({ marks, avgPerformance });
    }

    // Overall performance stats
    const overallStats = await db.prepare(`
      SELECT
        ROUND(AVG(obtained_marks / max_marks * 100), 1) as avg_percentage,
        COUNT(DISTINCT student_id) as total_students,
        SUM(CASE WHEN obtained_marks / max_marks < 0.4 THEN 1 ELSE 0 END) as failing_count
      FROM marks
    `).get();

    // Subject-wise performance
    const subjectPerformance = await db.prepare(`
      SELECT
        s.name as subject_name, s.code,
        ROUND(AVG(m.obtained_marks / m.max_marks * 100), 1) as avg_percentage,
        MAX(m.obtained_marks / m.max_marks * 100) as highest,
        MIN(m.obtained_marks / m.max_marks * 100) as lowest,
        COUNT(DISTINCT m.student_id) as student_count
      FROM marks m JOIN subjects s ON m.subject_id = s.id
      GROUP BY s.id
      ORDER BY avg_percentage DESC
    `).all();

    // Top performers
    const topPerformers = await db.prepare(`
      SELECT
        st.id, st.name, st.enrollment_no, st.department,
        ROUND(AVG(m.obtained_marks / m.max_marks * 100), 1) as avg_percentage
      FROM marks m JOIN students st ON m.student_id = st.id
      GROUP BY st.id, st.name, st.enrollment_no, st.department
      ORDER BY avg_percentage DESC
      LIMIT 10
    `).all();

    return NextResponse.json({ overallStats, subjectPerformance, topPerformers });
  } catch (error) {
    console.error('Marks GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const data = await request.json();

    if (Array.isArray(data.records)) {
      for (const r of data.records) {
        await db.prepare(
          'INSERT INTO marks (student_id, subject_id, exam_type, max_marks, obtained_marks, semester, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(r.student_id, r.subject_id, r.exam_type, r.max_marks, r.obtained_marks, r.semester, r.remarks || null);
      }
      return NextResponse.json({ message: `${data.records.length} marks records saved` });
    }

    await db.prepare('INSERT INTO marks (student_id, subject_id, exam_type, max_marks, obtained_marks, semester, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(data.student_id, data.subject_id, data.exam_type, data.max_marks, data.obtained_marks, data.semester, data.remarks);

    return NextResponse.json({ message: 'Marks recorded' }, { status: 201 });
  } catch (error) {
    console.error('Marks POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
