import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subject_id');

        let assignments;
        if (subjectId) {
            assignments = await db.prepare(`
        SELECT a.*, s.name as subject_name, s.code as subject_code,
          (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submission_count,
          (SELECT COUNT(DISTINCT student_id) FROM attendance WHERE subject_id = a.subject_id) as total_students
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.subject_id = ?
        ORDER BY a.due_date DESC
      `).all(subjectId);
        } else {
            assignments = await db.prepare(`
        SELECT a.*, s.name as subject_name, s.code as subject_code,
          (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submission_count,
          (SELECT COUNT(DISTINCT student_id) FROM attendance WHERE subject_id = a.subject_id) as total_students
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        ORDER BY a.due_date DESC
      `).all();
        }

        return NextResponse.json({ assignments });
    } catch (error) {
        console.error('Assignments GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const db = getDb();
        const data = await request.json();

        // Handle submission
        if (data.type === 'submission') {
            await db.prepare(`
        INSERT OR REPLACE INTO assignment_submissions (assignment_id, student_id, submission_text, status)
        VALUES (?, ?, ?, 'submitted')
      `).run(data.assignment_id, data.student_id, data.submission_text);
            return NextResponse.json({ message: 'Submission recorded' }, { status: 201 });
        }

        // Handle evaluation
        if (data.type === 'evaluate') {
            const plagiarismScore = Math.round(Math.random() * 25);
            const feedback = data.marks_obtained >= 70 ? 'Excellent work! Well-structured solution.' :
                data.marks_obtained >= 50 ? 'Good attempt. Some areas need improvement.' :
                    data.marks_obtained >= 30 ? 'Average work. Significant improvement needed.' :
                        'Below expectations. Please review the material and resubmit.';

            await db.prepare(`
        UPDATE assignment_submissions SET marks_obtained=?, feedback=?, plagiarism_score=?, status='evaluated'
        WHERE id=?
      `).run(data.marks_obtained, feedback, plagiarismScore, data.submission_id);
            return NextResponse.json({ message: 'Evaluation saved', feedback, plagiarismScore });
        }

        // Create assignment
        const result = await db.prepare(`
      INSERT INTO assignments (title, description, subject_id, due_date, max_marks, status, created_by)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).run(data.title, data.description, data.subject_id, data.due_date, data.max_marks, data.created_by || 1);

        return NextResponse.json({ id: result.lastInsertRowid, message: 'Assignment created' }, { status: 201 });
    } catch (error) {
        console.error('Assignments POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
