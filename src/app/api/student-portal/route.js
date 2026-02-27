import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('student_id');

        if (!studentId) {
            return NextResponse.json({ error: 'student_id required' }, { status: 400 });
        }

        // Student Profile
        const student = await db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Attendance Stats
        const attendance = await db.prepare(`
      SELECT
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        ROUND(SUM(CASE WHEN status = 'present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as percentage
      FROM attendance WHERE student_id = ?
    `).get(studentId);

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
    `).all(studentId);

        // Marks
        const marks = await db.prepare(`
      SELECT m.*, s.name as subject_name, s.code as subject_code
      FROM marks m JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = ?
      ORDER BY s.name, m.exam_type
    `).all(studentId);

        // Subject performance averages
        const subjectPerformance = await db.prepare(`
      SELECT
        s.name as subject_name, s.code as subject_code,
        ROUND(SUM(m.obtained_marks) / SUM(m.max_marks) * 100, 1) as percentage,
        SUM(m.obtained_marks) as total_obtained,
        SUM(m.max_marks) as total_max
      FROM marks m JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = ?
      GROUP BY s.id
    `).all(studentId);

        // Assignments
        const assignments = await db.prepare(`
      SELECT a.id, a.title, a.description, a.due_date, a.max_marks, a.status as assignment_status,
        s.name as subject_name, s.code as subject_code,
        asub.id as submission_id, asub.marks_obtained, asub.feedback, asub.plagiarism_score, asub.status as submission_status, asub.submitted_at
      FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = ?
      ORDER BY a.due_date DESC
    `).all(studentId);

        // Fees
        const fees = await db.prepare('SELECT * FROM fees WHERE student_id = ? ORDER BY due_date DESC').all(studentId);
        const feeSummary = await db.prepare(`
      SELECT
        SUM(amount) as total_amount,
        SUM(paid) as total_paid,
        SUM(amount - paid) as total_pending
      FROM fees WHERE student_id = ?
    `).get(studentId);

        // Risk Analysis
        const attendancePct = attendance.total_classes > 0 ? (attendance.present / attendance.total_classes) * 100 : 50;
        const attendanceFactor = Math.max(0, 100 - attendancePct);

        let marksFactor = 50;
        if (marks.length > 0) {
            const avgMarks = marks.reduce((s, m) => s + (m.obtained_marks / m.max_marks * 100), 0) / marks.length;
            marksFactor = Math.max(0, 100 - avgMarks);
        }

        const totalAssignments = assignments.length;
        const submittedAssignments = assignments.filter(a => a.submission_id).length;
        const assignmentFactor = totalAssignments > 0 ? Math.max(0, 100 - (submittedAssignments / totalAssignments * 100)) : 50;

        let feeFactor = 0;
        if (feeSummary.total_amount > 0) {
            const feeCompletion = (feeSummary.total_paid / feeSummary.total_amount) * 100;
            if (feeCompletion < 50) feeFactor = 15;
            else if (feeCompletion < 80) feeFactor = 5;
        }

        const riskScore = Math.min(100, Math.max(0, Math.round(0.5 * attendanceFactor + 0.3 * marksFactor + 0.2 * assignmentFactor + feeFactor)));
        let riskLevel, riskColor;
        if (riskScore >= 70) { riskLevel = 'critical'; riskColor = '#ef4444'; }
        else if (riskScore >= 50) { riskLevel = 'high'; riskColor = '#f97316'; }
        else if (riskScore >= 30) { riskLevel = 'medium'; riskColor = '#eab308'; }
        else { riskLevel = 'low'; riskColor = '#22c55e'; }

        // Alerts for this student
        const alerts = await db.prepare('SELECT * FROM alerts WHERE student_id = ? ORDER BY created_at DESC').all(studentId);

        // Timetable for student's department and semester
        const timetable = await db.prepare(`
      SELECT t.*, s.name as subject_name, s.code as subject_code, tea.name as teacher_name
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN teachers tea ON t.teacher_id = tea.id
      WHERE t.department = ? AND t.semester = ?
      ORDER BY CASE t.day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END, t.period
    `).all(student.department, student.semester);

        return NextResponse.json({
            student,
            attendance,
            subjectAttendance,
            marks,
            subjectPerformance,
            assignments,
            fees,
            feeSummary,
            riskAnalysis: { riskScore, riskLevel, riskColor, attendancePct: attendancePct.toFixed(1) },
            alerts,
            timetable
        });
    } catch (error) {
        console.error('Student portal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
