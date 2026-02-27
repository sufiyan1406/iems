// Script to add student user accounts to the existing database
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'iems.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const hash = (pw) => bcrypt.hashSync(pw, 10);

// Get all students
const students = db.prepare('SELECT id, name, email FROM students').all();

const insertUser = db.prepare('INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
const updateStudent = db.prepare('UPDATE students SET user_id = ? WHERE id = ?');

const transaction = db.transaction(() => {
    for (const student of students) {
        // Create user account with password 'student123'
        const result = insertUser.run(student.email, hash('student123'), student.name, 'student');
        if (result.changes > 0) {
            updateStudent.run(result.lastInsertRowid, student.id);
        } else {
            // User already exists, find and link
            const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(student.email);
            if (existing) {
                updateStudent.run(existing.id, student.id);
            }
        }
    }
});

transaction();

console.log(`✅ Created accounts for ${students.length} students`);
console.log('🔑 Password for all students: student123');
console.log('📧 Example: aarav.sharma@student.iems.edu / student123');

db.close();
