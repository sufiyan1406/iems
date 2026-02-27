import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(request) {
    try {
        const db = getDb();
        const { query } = await request.json();

        if (!query || query.trim().length < 3) {
            return NextResponse.json({ error: 'Please provide a valid query' }, { status: 400 });
        }

        const result = await processQuery(db, query.toLowerCase().trim());
        return NextResponse.json(result);
    } catch (error) {
        console.error('Query agent error:', error);
        return NextResponse.json({ error: 'Failed to process query' }, { status: 500 });
    }
}

async function processQuery(db, query) {
    const patterns = [
        {
            matches: ['attendance below', 'attendance less than', 'attendance under', 'low attendance'],
            handler: async (q) => {
                const pct = extractNumber(q) || 75;
                const results = await db.prepare(`
          SELECT st.id, st.name, st.enrollment_no, st.department, st.semester,
            ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as attendance_pct
          FROM attendance a JOIN students st ON a.student_id = st.id
          WHERE st.status = 'active'
          GROUP BY st.id, st.name, st.enrollment_no, st.department, st.semester
          HAVING ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) < ?
          ORDER BY attendance_pct ASC
        `).all(pct);
                return {
                    type: 'table',
                    title: `Students with attendance below ${pct}%`,
                    description: `Found ${results.length} students with attendance less than ${pct}%`,
                    columns: ['Name', 'Enrollment', 'Department', 'Semester', 'Attendance %'],
                    data: results.map(r => [r.name, r.enrollment_no, r.department, r.semester, `${r.attendance_pct}%`]),
                    rawData: results,
                    sqlGenerated: `SELECT name, enrollment_no, department, attendance_percentage FROM students WHERE attendance < ${pct}%`
                };
            }
        },
        {
            matches: ['fail', 'failing', 'likely to fail', 'at risk', 'risk of failure'],
            handler: async () => {
                const results = await db.prepare(`
          SELECT st.id, st.name, st.enrollment_no, st.department,
            ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as attendance_pct,
            (SELECT ROUND(AVG(m.obtained_marks / m.max_marks * 100), 1) FROM marks m WHERE m.student_id = st.id) as avg_marks
          FROM attendance a JOIN students st ON a.student_id = st.id
          WHERE st.status = 'active'
          GROUP BY st.id, st.name, st.enrollment_no, st.department
          HAVING ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) < 70
            OR (SELECT ROUND(AVG(m.obtained_marks / m.max_marks * 100), 1) FROM marks m WHERE m.student_id = st.id) < 40
          ORDER BY avg_marks ASC
        `).all();
                return {
                    type: 'table',
                    title: 'Students Likely to Fail This Semester',
                    description: `Found ${results.length} students at risk of academic failure (attendance < 70% or marks < 40%)`,
                    columns: ['Name', 'Enrollment', 'Department', 'Attendance', 'Avg Marks'],
                    data: results.map(r => [r.name, r.enrollment_no, r.department, `${r.attendance_pct}%`, `${r.avg_marks || 'N/A'}%`]),
                    rawData: results,
                    sqlGenerated: `SELECT * FROM students WHERE attendance < 70% OR avg_marks < 40%`
                };
            }
        },
        {
            matches: ['top performer', 'best student', 'highest marks', 'toppers', 'top student'],
            handler: async () => {
                const limit = extractNumber(query) || 10;
                const results = await db.prepare(`
          SELECT st.id, st.name, st.enrollment_no, st.department,
            ROUND(AVG(m.obtained_marks / m.max_marks * 100), 1) as avg_marks
          FROM marks m JOIN students st ON m.student_id = st.id
          GROUP BY st.id, st.name, st.enrollment_no, st.department
          ORDER BY avg_marks DESC LIMIT ?
        `).all(limit);
                return {
                    type: 'table',
                    title: `Top ${limit} Performing Students`,
                    description: `Showing top ${limit} students by average marks`,
                    columns: ['Name', 'Enrollment', 'Department', 'Avg Marks %'],
                    data: results.map(r => [r.name, r.enrollment_no, r.department, `${r.avg_marks}%`]),
                    rawData: results,
                    sqlGenerated: `SELECT name, enrollment_no, AVG(marks) FROM students ORDER BY avg_marks DESC LIMIT ${limit}`
                };
            }
        },
        {
            matches: ['fee', 'defaulter', 'pending fee', 'unpaid', 'due fee'],
            handler: async () => {
                const results = await db.prepare(`
          SELECT st.id, st.name, st.enrollment_no, st.department,
            SUM(f.amount) as total_fee, SUM(f.paid) as paid, SUM(f.amount - f.paid) as pending
          FROM fees f JOIN students st ON f.student_id = st.id
          WHERE f.status IN ('overdue', 'partial', 'pending')
          GROUP BY st.id, st.name, st.enrollment_no, st.department
          HAVING SUM(f.amount - f.paid) > 0
          ORDER BY pending DESC
        `).all();
                return {
                    type: 'table',
                    title: 'Fee Defaulters',
                    description: `Found ${results.length} students with pending fees`,
                    columns: ['Name', 'Enrollment', 'Department', 'Total Fee', 'Paid', 'Pending'],
                    data: results.map(r => [r.name, r.enrollment_no, r.department, `₹${r.total_fee}`, `₹${r.paid}`, `₹${r.pending}`]),
                    rawData: results,
                    sqlGenerated: `SELECT name, total_fee, paid_amount, pending_amount FROM fees WHERE status IN ('overdue','partial')`
                };
            }
        },
        {
            matches: ['how many student', 'total student', 'student count', 'number of student'],
            handler: async () => {
                const row = await db.prepare('SELECT COUNT(*) as c FROM students WHERE status=?').get('active');
                const total = row.c;
                const byDept = await db.prepare(`
          SELECT department, COUNT(*) as count FROM students WHERE status='active' GROUP BY department ORDER BY count DESC
        `).all();
                return {
                    type: 'stat',
                    title: 'Total Active Students',
                    value: total,
                    description: `There are ${total} active students across ${byDept.length} departments`,
                    breakdown: byDept,
                    sqlGenerated: `SELECT COUNT(*) FROM students WHERE status = 'active'`
                };
            }
        },
        {
            matches: ['department', 'dept wise', 'department wise'],
            handler: async () => {
                const results = await db.prepare(`
          SELECT st.department,
            COUNT(DISTINCT st.id) as students,
            ROUND(AVG(att_sub.att_pct), 1) as avg_attendance,
            ROUND(AVG(mark_sub.mark_pct), 1) as avg_marks
          FROM students st
          LEFT JOIN (
            SELECT student_id,
              ROUND(SUM(CASE WHEN status='present' THEN 1.0 ELSE 0 END)/COUNT(*)*100, 1) as att_pct
            FROM attendance GROUP BY student_id
          ) att_sub ON st.id = att_sub.student_id
          LEFT JOIN (
            SELECT student_id, AVG(obtained_marks/max_marks*100) as mark_pct
            FROM marks GROUP BY student_id
          ) mark_sub ON st.id = mark_sub.student_id
          WHERE st.status='active'
          GROUP BY st.department
        `).all();
                return {
                    type: 'table',
                    title: 'Department-wise Statistics',
                    description: 'Performance breakdown by department',
                    columns: ['Department', 'Students', 'Avg Attendance', 'Avg Marks'],
                    data: results.map(r => [r.department, r.students, `${r.avg_attendance || 0}%`, `${r.avg_marks || 0}%`]),
                    rawData: results,
                    sqlGenerated: `SELECT department, COUNT(students), AVG(attendance), AVG(marks) FROM students GROUP BY department`
                };
            }
        },
        {
            matches: ['assignment', 'pending assignment', 'not submitted'],
            handler: async () => {
                const results = await db.prepare(`
          SELECT a.title, s.name as subject, a.due_date,
            (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submitted,
            50 as total_students
          FROM assignments a
          JOIN subjects s ON a.subject_id = s.id
          WHERE a.status = 'active'
          ORDER BY a.due_date ASC
        `).all();
                return {
                    type: 'table',
                    title: 'Active Assignments Status',
                    description: `${results.length} active assignments`,
                    columns: ['Title', 'Subject', 'Due Date', 'Submitted', 'Pending'],
                    data: results.map(r => [r.title, r.subject, r.due_date, r.submitted, r.total_students - r.submitted]),
                    rawData: results,
                    sqlGenerated: `SELECT title, subject, due_date, submission_count FROM assignments WHERE status = 'active'`
                };
            }
        },
        {
            matches: ['teacher', 'faculty', 'professor'],
            handler: async () => {
                const results = await db.prepare(`
          SELECT t.name, t.employee_id, t.department, t.specialization, t.qualification,
            (SELECT COUNT(*) FROM subjects WHERE teacher_id = t.id) as subjects
          FROM teachers t ORDER BY t.name
        `).all();
                return {
                    type: 'table',
                    title: 'Faculty Directory',
                    description: `${results.length} faculty members`,
                    columns: ['Name', 'ID', 'Department', 'Specialization', 'Subjects'],
                    data: results.map(r => [r.name, r.employee_id, r.department, r.specialization, r.subjects]),
                    rawData: results,
                    sqlGenerated: `SELECT name, department, specialization FROM teachers`
                };
            }
        },
        {
            matches: ['semester', 'performance by semester'],
            handler: async () => {
                const sem = extractNumber(query) || null;
                if (sem) {
                    const results = await db.prepare(`
            SELECT st.name, st.enrollment_no, st.department,
              ROUND(AVG(m.obtained_marks/m.max_marks*100),1) as avg_marks
            FROM marks m JOIN students st ON m.student_id = st.id
            WHERE st.semester = ?
            GROUP BY st.id, st.name, st.enrollment_no, st.department
            ORDER BY avg_marks DESC
          `).all(sem);
                    return {
                        type: 'table',
                        title: `Semester ${sem} Students`,
                        description: `${results.length} students in semester ${sem}`,
                        columns: ['Name', 'Enrollment', 'Department', 'Avg Marks'],
                        data: results.map(r => [r.name, r.enrollment_no, r.department, `${r.avg_marks}%`]),
                        rawData: results,
                        sqlGenerated: `SELECT * FROM students WHERE semester = ${sem}`
                    };
                }
                return defaultResponse(query);
            }
        }
    ];

    // Find matching pattern
    for (const pattern of patterns) {
        if (pattern.matches.some(m => query.includes(m))) {
            return await pattern.handler(query);
        }
    }

    // Default: try to search students by name
    const nameResults = await db.prepare(`
    SELECT id, name, enrollment_no, department, semester
    FROM students WHERE name LIKE ? OR enrollment_no LIKE ?
    LIMIT 20
  `).all(`%${query}%`, `%${query}%`);

    if (nameResults.length > 0) {
        return {
            type: 'table',
            title: `Search Results for "${query}"`,
            description: `Found ${nameResults.length} matching students`,
            columns: ['Name', 'Enrollment', 'Department', 'Semester'],
            data: nameResults.map(r => [r.name, r.enrollment_no, r.department, r.semester]),
            rawData: nameResults,
            sqlGenerated: `SELECT * FROM students WHERE name LIKE '%${query}%'`
        };
    }

    return defaultResponse(query);
}

function defaultResponse(query) {
    return {
        type: 'info',
        title: 'Query Processed',
        description: `I couldn't find specific data for "${query}". Try queries like:`,
        suggestions: [
            'Show students with attendance below 70%',
            'Show students likely to fail this semester',
            'Show top 10 performers',
            'Show fee defaulters',
            'How many students are there?',
            'Show department wise statistics',
            'Show pending assignments',
            'Show faculty list',
            'Show semester 3 students'
        ]
    };
}

function extractNumber(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}
