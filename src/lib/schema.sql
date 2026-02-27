-- IEMS Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  enrollment_no VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100) NOT NULL,
  semester INTEGER NOT NULL DEFAULT 1,
  batch VARCHAR(20),
  dob VARCHAR(20),
  gender VARCHAR(10),
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(20),
  address TEXT,
  profile_image TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'graduated', 'suspended')),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100) NOT NULL,
  specialization VARCHAR(255),
  qualification VARCHAR(100),
  experience_years INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'on_leave')),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  semester INTEGER NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  type VARCHAR(20) DEFAULT 'theory' CHECK(type IN ('theory', 'practical', 'elective')),
  teacher_id INTEGER REFERENCES teachers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  date VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'absent' CHECK(status IN ('present', 'absent', 'late', 'excused')),
  marked_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, subject_id, date)
);

CREATE TABLE IF NOT EXISTS marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  exam_type VARCHAR(30) NOT NULL CHECK(exam_type IN ('internal_1', 'internal_2', 'midterm', 'final', 'assignment', 'quiz')),
  max_marks DOUBLE PRECISION NOT NULL DEFAULT 100,
  obtained_marks DOUBLE PRECISION NOT NULL DEFAULT 0,
  semester INTEGER,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  due_date VARCHAR(20) NOT NULL,
  max_marks DOUBLE PRECISION NOT NULL DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'closed', 'graded')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  submission_text TEXT,
  file_path TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  marks_obtained DOUBLE PRECISION,
  feedback TEXT,
  plagiarism_score DOUBLE PRECISION DEFAULT 0,
  status VARCHAR(20) DEFAULT 'submitted' CHECK(status IN ('submitted', 'evaluated', 'late', 'rejected')),
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS fees (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  fee_type VARCHAR(30) NOT NULL CHECK(fee_type IN ('tuition', 'exam', 'library', 'hostel', 'transport', 'other')),
  amount DOUBLE PRECISION NOT NULL,
  paid DOUBLE PRECISION NOT NULL DEFAULT 0,
  due_date VARCHAR(20) NOT NULL,
  paid_date VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'partial', 'overdue')),
  semester INTEGER,
  academic_year VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  day VARCHAR(20) NOT NULL CHECK(day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  period INTEGER NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  subject_id INTEGER REFERENCES subjects(id),
  teacher_id INTEGER REFERENCES teachers(id),
  room VARCHAR(20),
  department VARCHAR(100),
  semester INTEGER,
  section VARCHAR(10) DEFAULT 'A',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  type VARCHAR(20) NOT NULL CHECK(type IN ('attendance', 'academic', 'fee', 'assignment', 'general')),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  action_taken TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_student ON alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester);
