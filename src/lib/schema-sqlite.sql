-- IEMS Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'teacher', 'student')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT NOT NULL,
  semester INTEGER NOT NULL DEFAULT 1,
  batch TEXT,
  dob TEXT,
  gender TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  address TEXT,
  profile_image TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'graduated', 'suspended')),
  user_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT NOT NULL,
  specialization TEXT,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'on_leave')),
  user_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  semester INTEGER NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  type TEXT DEFAULT 'theory' CHECK(type IN ('theory', 'practical', 'elective')),
  teacher_id INTEGER REFERENCES teachers(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'absent' CHECK(status IN ('present', 'absent', 'late', 'excused')),
  marked_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, subject_id, date)
);

CREATE TABLE IF NOT EXISTS marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  exam_type TEXT NOT NULL CHECK(exam_type IN ('internal_1', 'internal_2', 'midterm', 'final', 'assignment', 'quiz')),
  max_marks REAL NOT NULL DEFAULT 100,
  obtained_marks REAL NOT NULL DEFAULT 0,
  semester INTEGER,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  due_date TEXT NOT NULL,
  max_marks REAL NOT NULL DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed', 'graded')),
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  submission_text TEXT,
  file_path TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  marks_obtained REAL,
  feedback TEXT,
  plagiarism_score REAL DEFAULT 0,
  status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'evaluated', 'late', 'rejected')),
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS fees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  fee_type TEXT NOT NULL CHECK(fee_type IN ('tuition', 'exam', 'library', 'hostel', 'transport', 'other')),
  amount REAL NOT NULL,
  paid REAL NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL,
  paid_date TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'partial', 'overdue')),
  semester INTEGER,
  academic_year TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timetable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL CHECK(day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  period INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject_id INTEGER REFERENCES subjects(id),
  teacher_id INTEGER REFERENCES teachers(id),
  room TEXT,
  department TEXT,
  semester INTEGER,
  section TEXT DEFAULT 'A',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  type TEXT NOT NULL CHECK(type IN ('attendance', 'academic', 'fee', 'assignment', 'general')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  action_taken TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_student ON alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester);
