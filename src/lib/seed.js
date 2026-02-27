const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/iems';

async function seed() {
    const pool = new Pool({ connectionString });
    const client = await pool.connect();

    try {
        // Drop all tables for clean seed
        await client.query(`
      DROP TABLE IF EXISTS alerts CASCADE;
      DROP TABLE IF EXISTS assignment_submissions CASCADE;
      DROP TABLE IF EXISTS assignments CASCADE;
      DROP TABLE IF EXISTS fees CASCADE;
      DROP TABLE IF EXISTS timetable CASCADE;
      DROP TABLE IF EXISTS attendance CASCADE;
      DROP TABLE IF EXISTS marks CASCADE;
      DROP TABLE IF EXISTS subjects CASCADE;
      DROP TABLE IF EXISTS teachers CASCADE;
      DROP TABLE IF EXISTS students CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

        // Load and execute schema
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schema);
        console.log('✅ Schema created');

        const hash = (pw) => bcrypt.hashSync(pw, 10);

        // Users
        const users = [
            ['admin@iems.edu', hash('admin123'), 'Dr. Rajesh Kumar', 'admin'],
            ['teacher1@iems.edu', hash('teacher123'), 'Prof. Anita Sharma', 'teacher'],
            ['teacher2@iems.edu', hash('teacher123'), 'Prof. Vikram Singh', 'teacher'],
            ['teacher3@iems.edu', hash('teacher123'), 'Dr. Priya Patel', 'teacher'],
            ['teacher4@iems.edu', hash('teacher123'), 'Prof. Suresh Reddy', 'teacher'],
            ['teacher5@iems.edu', hash('teacher123'), 'Dr. Meena Iyer', 'teacher'],
            ['teacher6@iems.edu', hash('teacher123'), 'Prof. Arjun Nair', 'teacher'],
            ['teacher7@iems.edu', hash('teacher123'), 'Dr. Kavitha Menon', 'teacher'],
            ['teacher8@iems.edu', hash('teacher123'), 'Prof. Rahul Gupta', 'teacher'],
            ['teacher9@iems.edu', hash('teacher123'), 'Dr. Sunita Desai', 'teacher'],
            ['teacher10@iems.edu', hash('teacher123'), 'Prof. Amit Joshi', 'teacher'],
        ];
        for (const u of users) {
            await client.query('INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)', u);
        }
        console.log('✅ Users seeded');

        // Teachers
        const teacherData = [
            ['T001', 'Prof. Anita Sharma', 'teacher1@iems.edu', '9876543210', 'Computer Science', 'Data Structures', 'M.Tech', 12, 2],
            ['T002', 'Prof. Vikram Singh', 'teacher2@iems.edu', '9876543211', 'Computer Science', 'Machine Learning', 'PhD', 8, 3],
            ['T003', 'Dr. Priya Patel', 'teacher3@iems.edu', '9876543212', 'Electronics', 'Signal Processing', 'PhD', 15, 4],
            ['T004', 'Prof. Suresh Reddy', 'teacher4@iems.edu', '9876543213', 'Mechanical', 'Thermodynamics', 'M.Tech', 10, 5],
            ['T005', 'Dr. Meena Iyer', 'teacher5@iems.edu', '9876543214', 'Mathematics', 'Applied Mathematics', 'PhD', 20, 6],
            ['T006', 'Prof. Arjun Nair', 'teacher6@iems.edu', '9876543215', 'Computer Science', 'Databases', 'M.Tech', 7, 7],
            ['T007', 'Dr. Kavitha Menon', 'teacher7@iems.edu', '9876543216', 'Electronics', 'VLSI Design', 'PhD', 11, 8],
            ['T008', 'Prof. Rahul Gupta', 'teacher8@iems.edu', '9876543217', 'Civil', 'Structural Engineering', 'M.Tech', 9, 9],
            ['T009', 'Dr. Sunita Desai', 'teacher9@iems.edu', '9876543218', 'Computer Science', 'Networks', 'PhD', 14, 10],
            ['T010', 'Prof. Amit Joshi', 'teacher10@iems.edu', '9876543219', 'Mathematics', 'Statistics', 'M.Sc', 6, 11],
        ];
        for (const t of teacherData) {
            await client.query('INSERT INTO teachers (employee_id, name, email, phone, department, specialization, qualification, experience_years, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', t);
        }
        console.log('✅ Teachers seeded');

        // Subjects
        const subjectData = [
            ['CS101', 'Data Structures & Algorithms', 'Computer Science', 3, 4, 'theory', 1],
            ['CS102', 'Database Management Systems', 'Computer Science', 4, 4, 'theory', 6],
            ['CS103', 'Operating Systems', 'Computer Science', 5, 3, 'theory', 9],
            ['CS104', 'Machine Learning', 'Computer Science', 6, 4, 'theory', 2],
            ['CS105', 'Computer Networks', 'Computer Science', 5, 3, 'theory', 9],
            ['CS106', 'Web Technologies Lab', 'Computer Science', 4, 2, 'practical', 1],
            ['EC201', 'Digital Signal Processing', 'Electronics', 5, 4, 'theory', 3],
            ['EC202', 'VLSI Design', 'Electronics', 6, 3, 'theory', 7],
            ['ME301', 'Thermodynamics', 'Mechanical', 3, 4, 'theory', 4],
            ['CE401', 'Structural Analysis', 'Civil', 5, 4, 'theory', 8],
            ['MA101', 'Engineering Mathematics I', 'Mathematics', 1, 4, 'theory', 5],
            ['MA102', 'Engineering Mathematics II', 'Mathematics', 2, 4, 'theory', 5],
            ['MA201', 'Probability & Statistics', 'Mathematics', 3, 3, 'theory', 10],
            ['CS107', 'Artificial Intelligence', 'Computer Science', 7, 4, 'theory', 2],
            ['CS108', 'Software Engineering', 'Computer Science', 6, 3, 'theory', 6],
        ];
        for (const s of subjectData) {
            await client.query('INSERT INTO subjects (code, name, department, semester, credits, type, teacher_id) VALUES ($1,$2,$3,$4,$5,$6,$7)', s);
        }
        console.log('✅ Subjects seeded');

        // Students
        const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Sai', 'Arnav', 'Dhruv', 'Kabir', 'Ananya', 'Saanvi', 'Ishita', 'Kavya', 'Riya', 'Pooja', 'Neha', 'Shreya', 'Tanvi', 'Diya', 'Rohan', 'Karan', 'Nikhil', 'Prateek', 'Siddharth', 'Manish', 'Ravi', 'Deepak', 'Aakash', 'Vishal', 'Priya', 'Sneha', 'Divya', 'Nisha', 'Ankita', 'Sakshi', 'Megha', 'Swati', 'Ritika', 'Komal', 'Harsh', 'Dev', 'Om', 'Yash', 'Varun', 'Gaurav', 'Rohit', 'Rajat', 'Tarun', 'Mohit'];
        const lastNames = ['Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Joshi', 'Desai', 'Iyer', 'Menon', 'Rao', 'Das', 'Mishra', 'Chauhan', 'Malhotra', 'Kapoor', 'Bhat', 'Pillai'];
        const studentDepts = ['Computer Science', 'Computer Science', 'Computer Science', 'Electronics', 'Mechanical'];

        for (let i = 0; i < 50; i++) {
            const fname = firstNames[i % firstNames.length];
            const lname = lastNames[i % lastNames.length];
            const name = `${fname} ${lname}`;
            const email = `${fname.toLowerCase()}.${lname.toLowerCase()}@student.iems.edu`;
            const dept = studentDepts[i % studentDepts.length];
            const sem = Math.floor(Math.random() * 6) + 1;
            const gender = i < 20 ? 'M' : i < 40 ? 'F' : (Math.random() > 0.5 ? 'M' : 'F');
            const phone = `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;

            // Create student user account
            const userResult = await client.query(
                'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
                [email, hash('student123'), name, 'student']
            );
            const userId = userResult.rows[0].id;

            await client.query(
                'INSERT INTO students (enrollment_no, name, email, phone, department, semester, batch, gender, guardian_name, guardian_phone, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
                [`EN${String(2024001 + i).padStart(7, '0')}`, name, email, phone, dept, sem, '2024-28', gender, `Mr. ${lname}`, `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`, 'active', userId]
            );
        }
        console.log('✅ 50 Students seeded (with user accounts)');

        // Attendance (60 days)
        await client.query('BEGIN');
        const today = new Date();
        for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
            const date = new Date(today);
            date.setDate(date.getDate() - dayOffset);
            if (date.getDay() === 0) continue;
            const dateStr = date.toISOString().split('T')[0];

            for (let studentId = 1; studentId <= 50; studentId++) {
                const subjectIds = [1, 2, 3, 11].filter(() => Math.random() > 0.3);
                for (const subjectId of subjectIds) {
                    let attendanceRate = 0.85;
                    if (studentId <= 5) attendanceRate = 0.55;
                    if (studentId <= 10 && studentId > 5) attendanceRate = 0.65;
                    if (studentId > 40) attendanceRate = 0.95;
                    const status = Math.random() < attendanceRate ? 'present' : 'absent';
                    await client.query(
                        'INSERT INTO attendance (student_id, subject_id, date, status) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
                        [studentId, subjectId, dateStr, status]
                    );
                }
            }
        }
        await client.query('COMMIT');
        console.log('✅ Attendance records seeded');

        // Marks
        const examTypes = ['internal_1', 'internal_2', 'midterm'];
        await client.query('BEGIN');
        for (let studentId = 1; studentId <= 50; studentId++) {
            for (const subjectId of [1, 2, 3, 11]) {
                for (const examType of examTypes) {
                    const maxMarks = examType === 'midterm' ? 100 : 50;
                    let baseScore = 0.7;
                    if (studentId <= 5) baseScore = 0.35;
                    if (studentId <= 10 && studentId > 5) baseScore = 0.50;
                    if (studentId > 40) baseScore = 0.88;
                    const variation = (Math.random() - 0.5) * 0.2;
                    const score = Math.max(0, Math.min(maxMarks, Math.round(maxMarks * (baseScore + variation))));
                    await client.query(
                        'INSERT INTO marks (student_id, subject_id, exam_type, max_marks, obtained_marks, semester) VALUES ($1,$2,$3,$4,$5,$6)',
                        [studentId, subjectId, examType, maxMarks, score, 3]
                    );
                }
            }
        }
        await client.query('COMMIT');
        console.log('✅ Marks seeded');

        // Assignments
        const assignmentData = [
            ['Stack Implementation', 'Implement a stack using linked list in C++', 1, '2026-02-20', 50, 'graded', 1],
            ['Binary Tree Traversal', 'Write programs for all tree traversal methods', 1, '2026-03-01', 50, 'active', 1],
            ['ER Diagram Design', 'Design ER diagram for a hospital management system', 2, '2026-02-25', 40, 'graded', 1],
            ['SQL Queries', 'Write complex SQL queries for given scenarios', 2, '2026-03-05', 50, 'active', 1],
            ['Process Scheduling', 'Simulate CPU scheduling algorithms', 3, '2026-02-28', 60, 'active', 1],
            ['Linear Algebra Problems', 'Solve matrix operations problems (set A)', 11, '2026-02-15', 30, 'graded', 1],
            ['Calculus Assignment', 'Integration and differentiation problems', 11, '2026-03-10', 40, 'active', 1],
            ['ML Model Training', 'Train a classification model on given dataset', 4, '2026-03-15', 100, 'active', 1],
        ];
        for (const a of assignmentData) {
            await client.query('INSERT INTO assignments (title, description, subject_id, due_date, max_marks, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)', a);
        }
        console.log('✅ Assignments seeded');

        // Assignment Submissions
        await client.query('BEGIN');
        for (let assignmentId = 1; assignmentId <= 3; assignmentId++) {
            for (let studentId = 1; studentId <= 50; studentId++) {
                const submitted = Math.random() > (studentId <= 5 ? 0.5 : 0.15);
                if (!submitted) continue;
                let score = Math.round(Math.random() * 40 + 10);
                if (studentId <= 5) score = Math.round(Math.random() * 20 + 5);
                if (studentId > 40) score = Math.round(Math.random() * 15 + 35);
                const plagiarism = Math.round(Math.random() * (studentId <= 5 ? 40 : 15));
                await client.query(
                    'INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, submitted_at, marks_obtained, feedback, plagiarism_score, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING',
                    [assignmentId, studentId, 'Solution submitted', '2026-02-20T10:00:00', score, score > 30 ? 'Good work!' : 'Needs improvement', plagiarism, 'evaluated']
                );
            }
        }
        await client.query('COMMIT');
        console.log('✅ Assignment submissions seeded');

        // Fees
        await client.query('BEGIN');
        for (let studentId = 1; studentId <= 50; studentId++) {
            const tuition = 50000;
            let paid = tuition;
            let status = 'paid';
            if (studentId <= 5) { paid = 20000; status = 'partial'; }
            else if (studentId <= 10) { paid = 0; status = 'overdue'; }

            await client.query('INSERT INTO fees (student_id, fee_type, amount, paid, due_date, paid_date, status, semester, academic_year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
                [studentId, 'tuition', tuition, paid, '2026-01-15', paid > 0 ? '2026-01-10' : null, status, 3, '2025-26']);
            await client.query('INSERT INTO fees (student_id, fee_type, amount, paid, due_date, paid_date, status, semester, academic_year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
                [studentId, 'exam', 2000, 2000, '2026-02-01', '2026-01-28', 'paid', 3, '2025-26']);
            await client.query('INSERT INTO fees (student_id, fee_type, amount, paid, due_date, paid_date, status, semester, academic_year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
                [studentId, 'library', 1000, 1000, '2026-01-01', '2025-12-28', 'paid', 3, '2025-26']);
        }
        await client.query('COMMIT');
        console.log('✅ Fees seeded');

        // Alerts
        const alertData = [
            [1, 'attendance', 'critical', 'Very Low Attendance', 'Attendance has dropped below 55% in Data Structures. Immediate intervention required.'],
            [2, 'attendance', 'high', 'Low Attendance Warning', 'Attendance is below 60% in multiple subjects.'],
            [3, 'academic', 'critical', 'Academic Failure Risk', 'Student is at high risk of failing based on combined attendance and marks analysis.'],
            [4, 'fee', 'high', 'Fee Payment Overdue', 'Tuition fee partially paid. Balance amount pending.'],
            [5, 'assignment', 'medium', 'Missing Assignments', 'Multiple assignment submissions pending.'],
            [6, 'attendance', 'high', 'Attendance Declining', 'Attendance trend shows consistent decline over past 3 weeks.'],
            [7, 'academic', 'medium', 'Below Average Performance', 'Internal exam scores below class average.'],
        ];
        for (const a of alertData) {
            await client.query('INSERT INTO alerts (student_id, type, severity, title, message) VALUES ($1,$2,$3,$4,$5)', a);
        }
        console.log('✅ Alerts seeded');

        console.log('\n🎉 PostgreSQL database seeded successfully!');
        console.log(`📁 Connection: ${connectionString}`);

    } catch (error) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('❌ Seed error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
