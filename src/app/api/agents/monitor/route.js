import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const alerts = [];

        // 1. Low Attendance Detection
        const lowAttendance = await db.prepare(`
      SELECT st.id, st.name, st.enrollment_no, st.department,
        ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as pct
      FROM attendance a
      JOIN students st ON a.student_id = st.id
      WHERE st.status = 'active'
      GROUP BY st.id, st.name, st.enrollment_no, st.department
      HAVING ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) < 75
      ORDER BY pct ASC
    `).all();

        for (const s of lowAttendance) {
            const severity = s.pct < 50 ? 'critical' : s.pct < 60 ? 'high' : 'medium';
            alerts.push({
                student: s,
                type: 'attendance',
                severity,
                title: `Low Attendance: ${s.name}`,
                message: `${s.name} (${s.enrollment_no}) has ${s.pct}% attendance, which is below the 75% threshold.`,
                suggestion: severity === 'critical'
                    ? 'Immediate counseling session required. Notify guardian and HOD.'
                    : severity === 'high'
                        ? 'Send formal warning notice. Schedule parent-teacher meeting.'
                        : 'Issue verbal warning. Monitor for next 2 weeks.',
                icon: '📉'
            });
        }

        // 2. Academic Failure Risk
        const weakPerformers = await db.prepare(`
      SELECT st.id, st.name, st.enrollment_no, st.department,
        ROUND(AVG(m.obtained_marks / m.max_marks * 100), 1) as avg_marks
      FROM marks m
      JOIN students st ON m.student_id = st.id
      WHERE st.status = 'active'
      GROUP BY st.id, st.name, st.enrollment_no, st.department
      HAVING ROUND(AVG(m.obtained_marks / m.max_marks * 100), 1) < 45
      ORDER BY avg_marks ASC
    `).all();

        for (const s of weakPerformers) {
            const severity = s.avg_marks < 30 ? 'critical' : 'high';
            alerts.push({
                student: s,
                type: 'academic',
                severity,
                title: `Academic Risk: ${s.name}`,
                message: `${s.name} (${s.enrollment_no}) has avg marks of ${s.avg_marks}%, indicating high failure risk.`,
                suggestion: severity === 'critical'
                    ? 'Assign dedicated mentor. Schedule remedial classes. Consider academic probation.'
                    : 'Recommend extra tutorials. Assign peer study group.',
                icon: '📚'
            });
        }

        // 3. Missing Assignments
        const missingAssignments = await db.prepare(`
      SELECT st.id, st.name, st.enrollment_no, st.department,
        COUNT(a.id) as total_assignments,
        COUNT(asub.id) as submitted,
        COUNT(a.id) - COUNT(asub.id) as missing
      FROM students st
      CROSS JOIN assignments a
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = st.id
      WHERE st.status = 'active' AND a.status != 'closed'
      GROUP BY st.id, st.name, st.enrollment_no, st.department
      HAVING COUNT(a.id) - COUNT(asub.id) > 2
      ORDER BY missing DESC
    `).all();

        for (const s of missingAssignments) {
            alerts.push({
                student: s,
                type: 'assignment',
                severity: s.missing > 4 ? 'high' : 'medium',
                title: `Missing Assignments: ${s.name}`,
                message: `${s.name} has ${s.missing} pending assignments out of ${s.total_assignments}.`,
                suggestion: 'Send reminder notification. Set deadline extension if needed.',
                icon: '📝'
            });
        }

        // 4. Fee Defaulters
        const feeDefaulters = await db.prepare(`
      SELECT st.id, st.name, st.enrollment_no, st.department,
        SUM(f.amount - f.paid) as pending
      FROM fees f
      JOIN students st ON f.student_id = st.id
      WHERE f.status IN ('overdue', 'partial')
      GROUP BY st.id, st.name, st.enrollment_no, st.department
      HAVING SUM(f.amount - f.paid) > 0
      ORDER BY pending DESC
    `).all();

        for (const s of feeDefaulters) {
            alerts.push({
                student: s,
                type: 'fee',
                severity: s.pending > 30000 ? 'high' : 'medium',
                title: `Fee Pending: ${s.name}`,
                message: `${s.name} has ₹${s.pending.toLocaleString()} in pending fees.`,
                suggestion: 'Send payment reminder. Offer installment plan if needed.',
                icon: '💰'
            });
        }

        // Sort by severity
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        const summary = {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            high: alerts.filter(a => a.severity === 'high').length,
            medium: alerts.filter(a => a.severity === 'medium').length,
            byType: {
                attendance: alerts.filter(a => a.type === 'attendance').length,
                academic: alerts.filter(a => a.type === 'academic').length,
                assignment: alerts.filter(a => a.type === 'assignment').length,
                fee: alerts.filter(a => a.type === 'fee').length,
            }
        };

        return NextResponse.json({ alerts, summary });
    } catch (error) {
        console.error('Monitor error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
