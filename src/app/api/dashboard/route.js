import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const totalStudentsRow = await db.prepare('SELECT COUNT(*) as count FROM students WHERE status = ?').get('active');
    const totalStudents = totalStudentsRow.count;

    const totalTeachersRow = await db.prepare('SELECT COUNT(*) as count FROM teachers WHERE status = ?').get('active');
    const totalTeachers = totalTeachersRow.count;

    const totalSubjectsRow = await db.prepare('SELECT COUNT(*) as count FROM subjects').get();
    const totalSubjects = totalSubjectsRow.count;

    const avgAttendanceRow = await db.prepare(`
      SELECT ROUND(SUM(CASE WHEN status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as avg
      FROM attendance
    `).get();
    const avgAttendance = avgAttendanceRow.avg || 0;

    const avgPerformanceRow = await db.prepare(`
      SELECT ROUND(AVG(obtained_marks / max_marks * 100), 1) as avg FROM marks
    `).get();
    const avgPerformance = avgPerformanceRow.avg || 0;

    const totalFeeCollectedRow = await db.prepare('SELECT SUM(paid) as total FROM fees').get();
    const totalFeeCollected = totalFeeCollectedRow.total || 0;

    const totalFeePendingRow = await db.prepare("SELECT SUM(amount - paid) as total FROM fees WHERE status != ?").get('paid');
    const totalFeePending = totalFeePendingRow.total || 0;

    const activeAlertsRow = await db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_read = 0').get();
    const activeAlerts = activeAlertsRow.count;

    const recentAlerts = await db.prepare(`
      SELECT a.*, s.name as student_name, s.enrollment_no
      FROM alerts a
      LEFT JOIN students s ON a.student_id = s.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all();

    const atRiskStudents = await db.prepare(`
      SELECT st.id, st.name, st.enrollment_no, st.department,
        ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as attendance_pct
      FROM attendance a
      JOIN students st ON a.student_id = st.id
      WHERE st.status = 'active'
      GROUP BY st.id, st.name, st.enrollment_no, st.department
      HAVING ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) < 70
      ORDER BY attendance_pct ASC
      LIMIT 15
    `).all();

    const departmentStats = await db.prepare(`
      SELECT
        st.department,
        COUNT(DISTINCT st.id) as student_count,
        ROUND(AVG(sub_att.pct), 1) as avg_attendance
      FROM students st
      LEFT JOIN (
        SELECT student_id,
          ROUND(SUM(CASE WHEN status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as pct
        FROM attendance GROUP BY student_id
      ) sub_att ON st.id = sub_att.student_id
      WHERE st.status = 'active'
      GROUP BY st.department
    `).all();

    const attendanceTrend = await db.prepare(`
      SELECT date,
        ROUND(SUM(CASE WHEN status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as percentage
      FROM attendance
      WHERE date >= (CURRENT_DATE - INTERVAL '14 days')::text
      GROUP BY date
      ORDER BY date ASC
    `).all();

    const performanceDistribution = await db.prepare(`
      SELECT
        CASE
          WHEN avg_pct >= 90 THEN 'A+'
          WHEN avg_pct >= 80 THEN 'A'
          WHEN avg_pct >= 70 THEN 'B'
          WHEN avg_pct >= 60 THEN 'C'
          WHEN avg_pct >= 50 THEN 'D'
          ELSE 'F'
        END as grade,
        COUNT(*) as count
      FROM (
        SELECT student_id, AVG(obtained_marks / max_marks * 100) as avg_pct
        FROM marks GROUP BY student_id
      ) sub
      GROUP BY grade
      ORDER BY grade
    `).all();

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        avgAttendance,
        avgPerformance,
        totalFeeCollected,
        totalFeePending,
        activeAlerts
      },
      recentAlerts,
      atRiskStudents,
      departmentStats,
      attendanceTrend,
      performanceDistribution
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
