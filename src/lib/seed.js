const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL || '';
const USE_POSTGRES = DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://');

const hash = (pw) => bcrypt.hashSync(pw, 10);

// ============================================
// Shared seed data
// ============================================
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

const alertData = [
    [1, 'attendance', 'critical', 'Very Low Attendance', 'Attendance has dropped below 55% in Data Structures. Immediate intervention required.'],
    [2, 'attendance', 'high', 'Low Attendance Warning', 'Attendance is below 60% in multiple subjects.'],
    [3, 'academic', 'critical', 'Academic Failure Risk', 'Student is at high risk of failing based on combined attendance and marks analysis.'],
    [4, 'fee', 'high', 'Fee Payment Overdue', 'Tuition fee partially paid. Balance amount pending.'],
    [5, 'assignment', 'medium', 'Missing Assignments', 'Multiple assignment submissions pending.'],
    [6, 'attendance', 'high', 'Attendance Declining', 'Attendance trend shows consistent decline over past 3 weeks.'],
    [7, 'academic', 'medium', 'Below Average Performance', 'Internal exam scores below class average.'],
];

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Sai', 'Arnav', 'Dhruv', 'Kabir', 'Ananya', 'Saanvi', 'Ishita', 'Kavya', 'Riya', 'Pooja', 'Neha', 'Shreya', 'Tanvi', 'Diya', 'Rohan', 'Karan', 'Nikhil', 'Prateek', 'Siddharth', 'Manish', 'Ravi', 'Deepak', 'Aakash', 'Vishal', 'Priya', 'Sneha', 'Divya', 'Nisha', 'Ankita', 'Sakshi', 'Megha', 'Swati', 'Ritika', 'Komal', 'Harsh', 'Dev', 'Om', 'Yash', 'Varun', 'Gaurav', 'Rohit', 'Rajat', 'Tarun', 'Mohit'];
const lastNames = ['Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Joshi', 'Desai', 'Iyer', 'Menon', 'Rao', 'Das', 'Mishra', 'Chauhan', 'Malhotra', 'Kapoor', 'Bhat', 'Pillai'];
const studentDepts = ['Computer Science', 'Computer Science', 'Computer Science', 'Electronics', 'Mechanical'];
const examTypes = ['internal_1', 'internal_2', 'midterm'];

// ============================================
// SQLite Seeder
// ============================================
function seedSqlite() {
    const Database = require('better-sqlite3');

    const dbPath = path.join(__dirname, '..', '..', 'data', 'iems.db');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = OFF');

    // Drop tables instead of deleting file (avoids EBUSY lock error)
    db.exec(`
      DROP TABLE IF EXISTS alerts;
      DROP TABLE IF EXISTS assignment_submissions;
      DROP TABLE IF EXISTS assignments;
      DROP TABLE IF EXISTS fees;
      DROP TABLE IF EXISTS timetable;
      DROP TABLE IF EXISTS attendance;
      DROP TABLE IF EXISTS marks;
      DROP TABLE IF EXISTS subjects;
      DROP TABLE IF EXISTS teachers;
      DROP TABLE IF EXISTS students;
      DROP TABLE IF EXISTS users;
    `);
    db.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(path.join(__dirname, 'schema-sqlite.sql'), 'utf8');
    db.exec(schema);
    console.log('✅ Schema created (SQLite)');

    // Users
    const insertUser = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
    users.forEach(u => insertUser.run(...u));
    console.log('✅ Users seeded');

    // Teachers
    const insertTeacher = db.prepare('INSERT INTO teachers (employee_id, name, email, phone, department, specialization, qualification, experience_years, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    teacherData.forEach(t => insertTeacher.run(...t));
    console.log('✅ Teachers seeded');

    // Subjects
    const insertSubject = db.prepare('INSERT INTO subjects (code, name, department, semester, credits, type, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    subjectData.forEach(s => insertSubject.run(...s));
    console.log('✅ Subjects seeded');

    // Students + user accounts
    const insertStudentUser = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
    const insertStudent = db.prepare('INSERT INTO students (enrollment_no, name, email, phone, department, semester, batch, gender, guardian_name, guardian_phone, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    for (let i = 0; i < 50; i++) {
        const fname = firstNames[i % firstNames.length];
        const lname = lastNames[i % lastNames.length];
        const name = `${fname} ${lname}`;
        const email = `${fname.toLowerCase()}.${lname.toLowerCase()}@student.iems.edu`;
        const dept = studentDepts[i % studentDepts.length];
        const sem = Math.floor(Math.random() * 6) + 1;
        const gender = i < 20 ? 'M' : i < 40 ? 'F' : (Math.random() > 0.5 ? 'M' : 'F');
        const phone = `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;

        const userResult = insertStudentUser.run(email, hash('student123'), name, 'student');
        insertStudent.run(`EN${String(2024001 + i).padStart(7, '0')}`, name, email, phone, dept, sem, '2024-28', gender, `Mr. ${lname}`, `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`, 'active', userResult.lastInsertRowid);
    }
    console.log('✅ 50 Students seeded (with user accounts)');

    // Attendance
    const insertAttendance = db.prepare('INSERT OR IGNORE INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)');
    const attTx = db.transaction(() => {
        const today = new Date();
        for (let d = 0; d < 60; d++) {
            const date = new Date(today); date.setDate(date.getDate() - d);
            if (date.getDay() === 0) continue;
            const dateStr = date.toISOString().split('T')[0];
            for (let sid = 1; sid <= 50; sid++) {
                for (const subId of [1, 2, 3, 11].filter(() => Math.random() > 0.3)) {
                    let rate = 0.85;
                    if (sid <= 5) rate = 0.55;
                    if (sid > 5 && sid <= 10) rate = 0.65;
                    if (sid > 40) rate = 0.95;
                    insertAttendance.run(sid, subId, dateStr, Math.random() < rate ? 'present' : 'absent');
                }
            }
        }
    });
    attTx();
    console.log('✅ Attendance records seeded');

    // Marks
    const insertMarks = db.prepare('INSERT INTO marks (student_id, subject_id, exam_type, max_marks, obtained_marks, semester) VALUES (?, ?, ?, ?, ?, ?)');
    const marksTx = db.transaction(() => {
        for (let sid = 1; sid <= 50; sid++) {
            for (const subId of [1, 2, 3, 11]) {
                for (const et of examTypes) {
                    const max = et === 'midterm' ? 100 : 50;
                    let base = 0.7;
                    if (sid <= 5) base = 0.35;
                    if (sid > 5 && sid <= 10) base = 0.50;
                    if (sid > 40) base = 0.88;
                    const score = Math.max(0, Math.min(max, Math.round(max * (base + (Math.random() - 0.5) * 0.2))));
                    insertMarks.run(sid, subId, et, max, score, 3);
                }
            }
        }
    });
    marksTx();
    console.log('✅ Marks seeded');

    // Assignments
    const insertAssignment = db.prepare('INSERT INTO assignments (title, description, subject_id, due_date, max_marks, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
    assignmentData.forEach(a => insertAssignment.run(...a));
    console.log('✅ Assignments seeded');

    // Submissions
    const insertSub = db.prepare('INSERT OR IGNORE INTO assignment_submissions (assignment_id, student_id, submission_text, submitted_at, marks_obtained, feedback, plagiarism_score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const subTx = db.transaction(() => {
        for (let aid = 1; aid <= 3; aid++) {
            for (let sid = 1; sid <= 50; sid++) {
                if (Math.random() <= (sid <= 5 ? 0.5 : 0.15)) continue;
                let score = Math.round(Math.random() * 40 + 10);
                if (sid <= 5) score = Math.round(Math.random() * 20 + 5);
                if (sid > 40) score = Math.round(Math.random() * 15 + 35);
                insertSub.run(aid, sid, 'Solution submitted', '2026-02-20T10:00:00', score, score > 30 ? 'Good work!' : 'Needs improvement', Math.round(Math.random() * (sid <= 5 ? 40 : 15)), 'evaluated');
            }
        }
    });
    subTx();
    console.log('✅ Assignment submissions seeded');

    // Fees
    const insertFee = db.prepare('INSERT INTO fees (student_id, fee_type, amount, paid, due_date, paid_date, status, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const feeTx = db.transaction(() => {
        for (let sid = 1; sid <= 50; sid++) {
            let paid = 50000, status = 'paid';
            if (sid <= 5) { paid = 20000; status = 'partial'; }
            else if (sid <= 10) { paid = 0; status = 'overdue'; }
            insertFee.run(sid, 'tuition', 50000, paid, '2026-01-15', paid > 0 ? '2026-01-10' : null, status, 3, '2025-26');
            insertFee.run(sid, 'exam', 2000, 2000, '2026-02-01', '2026-01-28', 'paid', 3, '2025-26');
            insertFee.run(sid, 'library', 1000, 1000, '2026-01-01', '2025-12-28', 'paid', 3, '2025-26');
        }
    });
    feeTx();
    console.log('✅ Fees seeded');

    // Alerts
    const insertAlert = db.prepare('INSERT INTO alerts (student_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?)');
    alertData.forEach(a => insertAlert.run(...a));
    console.log('✅ Alerts seeded');

    db.close();
    console.log('\n🎉 Database seeded successfully! (SQLite)');
    console.log('📁 Database path:', dbPath);
}

// ============================================
// PostgreSQL Seeder
// ============================================
async function seedPostgres() {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    try {
        await client.query(`DROP TABLE IF EXISTS alerts, assignment_submissions, assignments, fees, timetable, attendance, marks, subjects, teachers, students, users CASCADE`);
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schema);
        console.log('✅ Schema created (PostgreSQL)');

        for (const u of users) await client.query('INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,$4)', u);
        console.log('✅ Users seeded');

        for (const t of teacherData) await client.query('INSERT INTO teachers (employee_id, name, email, phone, department, specialization, qualification, experience_years, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', t);
        console.log('✅ Teachers seeded');

        for (const s of subjectData) await client.query('INSERT INTO subjects (code, name, department, semester, credits, type, teacher_id) VALUES ($1,$2,$3,$4,$5,$6,$7)', s);
        console.log('✅ Subjects seeded');

        for (let i = 0; i < 50; i++) {
            const fname = firstNames[i % firstNames.length], lname = lastNames[i % lastNames.length];
            const name = `${fname} ${lname}`, email = `${fname.toLowerCase()}.${lname.toLowerCase()}@student.iems.edu`;
            const dept = studentDepts[i % studentDepts.length], sem = Math.floor(Math.random() * 6) + 1;
            const gender = i < 20 ? 'M' : i < 40 ? 'F' : (Math.random() > 0.5 ? 'M' : 'F');
            const r = await client.query('INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,$4) RETURNING id', [email, hash('student123'), name, 'student']);
            await client.query('INSERT INTO students (enrollment_no, name, email, phone, department, semester, batch, gender, guardian_name, guardian_phone, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
                [`EN${String(2024001 + i).padStart(7, '0')}`, name, email, `98${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`, dept, sem, '2024-28', gender, `Mr. ${lname}`, `97${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`, 'active', r.rows[0].id]);
        }
        console.log('✅ 50 Students seeded (with user accounts)');

        await client.query('BEGIN');
        const today = new Date();
        for (let d = 0; d < 60; d++) {
            const date = new Date(today); date.setDate(date.getDate() - d);
            if (date.getDay() === 0) continue;
            const dateStr = date.toISOString().split('T')[0];
            for (let sid = 1; sid <= 50; sid++) {
                for (const subId of [1, 2, 3, 11].filter(() => Math.random() > 0.3)) {
                    let rate = 0.85;
                    if (sid <= 5) rate = 0.55; if (sid > 5 && sid <= 10) rate = 0.65; if (sid > 40) rate = 0.95;
                    await client.query('INSERT INTO attendance (student_id, subject_id, date, status) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [sid, subId, dateStr, Math.random() < rate ? 'present' : 'absent']);
                }
            }
        }
        await client.query('COMMIT');
        console.log('✅ Attendance records seeded');

        await client.query('BEGIN');
        for (let sid = 1; sid <= 50; sid++) {
            for (const subId of [1, 2, 3, 11]) {
                for (const et of examTypes) {
                    const max = et === 'midterm' ? 100 : 50;
                    let base = 0.7; if (sid <= 5) base = 0.35; if (sid > 5 && sid <= 10) base = 0.50; if (sid > 40) base = 0.88;
                    const score = Math.max(0, Math.min(max, Math.round(max * (base + (Math.random() - 0.5) * 0.2))));
                    await client.query('INSERT INTO marks (student_id, subject_id, exam_type, max_marks, obtained_marks, semester) VALUES ($1,$2,$3,$4,$5,$6)', [sid, subId, et, max, score, 3]);
                }
            }
        }
        await client.query('COMMIT');
        console.log('✅ Marks seeded');

        for (const a of assignmentData) await client.query('INSERT INTO assignments (title, description, subject_id, due_date, max_marks, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)', a);
        console.log('✅ Assignments seeded');

        await client.query('BEGIN');
        for (let aid = 1; aid <= 3; aid++) {
            for (let sid = 1; sid <= 50; sid++) {
                if (Math.random() <= (sid <= 5 ? 0.5 : 0.15)) continue;
                let score = Math.round(Math.random() * 40 + 10); if (sid <= 5) score = Math.round(Math.random() * 20 + 5); if (sid > 40) score = Math.round(Math.random() * 15 + 35);
                await client.query('INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, submitted_at, marks_obtained, feedback, plagiarism_score, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING',
                    [aid, sid, 'Solution submitted', '2026-02-20T10:00:00', score, score > 30 ? 'Good work!' : 'Needs improvement', Math.round(Math.random() * (sid <= 5 ? 40 : 15)), 'evaluated']);
            }
        }
        await client.query('COMMIT');
        console.log('✅ Assignment submissions seeded');

        await client.query('BEGIN');
        for (let sid = 1; sid <= 50; sid++) {
            let paid = 50000, status = 'paid';
            if (sid <= 5) { paid = 20000; status = 'partial'; } else if (sid <= 10) { paid = 0; status = 'overdue'; }
            await client.query('INSERT INTO fees (student_id, fee_type, amount, paid, due_date, paid_date, status, semester, academic_year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [sid, 'tuition', 50000, paid, '2026-01-15', paid > 0 ? '2026-01-10' : null, status, 3, '2025-26']);
            await client.query('INSERT INTO fees (student_id, fee_type, amount, paid, due_date, paid_date, status, semester, academic_year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [sid, 'exam', 2000, 2000, '2026-02-01', '2026-01-28', 'paid', 3, '2025-26']);
            await client.query('INSERT INTO fees (student_id, fee_type, amount, paid, due_date, paid_date, status, semester, academic_year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [sid, 'library', 1000, 1000, '2026-01-01', '2025-12-28', 'paid', 3, '2025-26']);
        }
        await client.query('COMMIT');
        console.log('✅ Fees seeded');

        for (const a of alertData) await client.query('INSERT INTO alerts (student_id, type, severity, title, message) VALUES ($1,$2,$3,$4,$5)', a);
        console.log('✅ Alerts seeded');

        console.log('\n🎉 Database seeded successfully! (PostgreSQL)');
        console.log('📁 Connection:', DATABASE_URL.replace(/:([^@]+)@/, ':***@'));
    } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('❌ Seed error:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// ============================================
// Run
// ============================================
if (USE_POSTGRES) {
    console.log('🐘 Seeding PostgreSQL...');
    seedPostgres();
} else {
    console.log('📦 Seeding SQLite...');
    seedSqlite();
}
