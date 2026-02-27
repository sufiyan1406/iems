import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('student_id');

        if (studentId) {
            return NextResponse.json(await analyzeStudent(db, parseInt(studentId)));
        }

        // Analyze all students
        const students = await db.prepare('SELECT id, name, enrollment_no, department, semester FROM students WHERE status = ?').all('active');
        const results = await Promise.all(students.map(async (s) => {
            const analysis = await analyzeStudent(db, s.id);
            return { ...s, ...analysis };
        }));

        results.sort((a, b) => b.riskScore - a.riskScore);

        const summary = {
            critical: results.filter(r => r.riskLevel === 'critical').length,
            high: results.filter(r => r.riskLevel === 'high').length,
            medium: results.filter(r => r.riskLevel === 'medium').length,
            low: results.filter(r => r.riskLevel === 'low').length,
        };

        return NextResponse.json({ students: results, summary });
    } catch (error) {
        console.error('Risk analysis error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function analyzeStudent(db, studentId) {
    const attendance = await db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
    FROM attendance WHERE student_id = ?
  `).get(studentId);

    const attendancePct = attendance.total > 0 ? (attendance.present / attendance.total) * 100 : 50;
    const attendanceFactor = Math.max(0, 100 - attendancePct);

    const marksData = await db.prepare(`
    SELECT exam_type, AVG(obtained_marks / max_marks * 100) as avg_pct
    FROM marks WHERE student_id = ?
    GROUP BY exam_type
    ORDER BY CASE exam_type
      WHEN 'internal_1' THEN 1 WHEN 'internal_2' THEN 2
      WHEN 'midterm' THEN 3 WHEN 'final' THEN 4
    END
  `).all(studentId);

    let marksFactor = 50;
    if (marksData.length > 0) {
        const avgMarks = marksData.reduce((sum, m) => sum + parseFloat(m.avg_pct), 0) / marksData.length;
        marksFactor = Math.max(0, 100 - avgMarks);
        if (marksData.length >= 2) {
            const recent = parseFloat(marksData[marksData.length - 1].avg_pct);
            const earlier = parseFloat(marksData[0].avg_pct);
            if (recent < earlier) marksFactor += 10;
        }
        marksFactor = Math.min(100, marksFactor);
    }

    const assignmentStats = await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM assignments WHERE status != 'closed') as total_assignments,
      (SELECT COUNT(*) FROM assignment_submissions WHERE student_id = ?) as submitted
  `).get(studentId);

    let assignmentFactor = 50;
    if (assignmentStats.total_assignments > 0) {
        const completionRate = (assignmentStats.submitted / assignmentStats.total_assignments) * 100;
        assignmentFactor = Math.max(0, 100 - completionRate);
    }

    const feeStatus = await db.prepare(`
    SELECT SUM(amount) as total, SUM(paid) as paid
    FROM fees WHERE student_id = ?
  `).get(studentId);

    let feeFactor = 0;
    if (feeStatus.total > 0) {
        const feeCompletion = (feeStatus.paid / feeStatus.total) * 100;
        if (feeCompletion < 50) feeFactor = 15;
        else if (feeCompletion < 80) feeFactor = 5;
    }

    const riskScore = Math.round(
        0.5 * attendanceFactor +
        0.3 * marksFactor +
        0.2 * assignmentFactor +
        feeFactor
    );

    const clampedScore = Math.min(100, Math.max(0, riskScore));

    let riskLevel, riskColor;
    if (clampedScore >= 70) { riskLevel = 'critical'; riskColor = '#ef4444'; }
    else if (clampedScore >= 50) { riskLevel = 'high'; riskColor = '#f97316'; }
    else if (clampedScore >= 30) { riskLevel = 'medium'; riskColor = '#eab308'; }
    else { riskLevel = 'low'; riskColor = '#22c55e'; }

    const interventions = [];
    if (attendancePct < 65) {
        interventions.push({ type: 'attendance', priority: 'urgent', message: `Attendance critically low at ${attendancePct.toFixed(1)}%. Immediate counseling required.` });
    } else if (attendancePct < 75) {
        interventions.push({ type: 'attendance', priority: 'high', message: `Attendance below threshold at ${attendancePct.toFixed(1)}%. Send warning notice.` });
    }
    if (marksFactor > 60) {
        interventions.push({ type: 'academic', priority: 'urgent', message: 'Academic performance critically low. Assign mentor and remedial classes.' });
    } else if (marksFactor > 40) {
        interventions.push({ type: 'academic', priority: 'high', message: 'Below-average academic performance. Schedule extra tutorials.' });
    }
    if (assignmentFactor > 60) {
        interventions.push({ type: 'assignment', priority: 'high', message: 'Multiple assignments not submitted. Contact student immediately.' });
    }
    if (feeFactor > 10) {
        interventions.push({ type: 'fee', priority: 'medium', message: 'Significant fee balance pending. May indicate financial difficulties.' });
    }

    return {
        riskScore: clampedScore,
        riskLevel,
        riskColor,
        factors: {
            attendance: { value: attendancePct.toFixed(1), factor: attendanceFactor.toFixed(1), weight: 0.5 },
            marks: { value: (100 - marksFactor).toFixed(1), factor: marksFactor.toFixed(1), weight: 0.3 },
            assignments: { value: (100 - assignmentFactor).toFixed(1), factor: assignmentFactor.toFixed(1), weight: 0.2 },
            fees: { factor: feeFactor, note: feeFactor > 0 ? 'Fee penalty applied' : 'No fee issues' }
        },
        interventions
    };
}
