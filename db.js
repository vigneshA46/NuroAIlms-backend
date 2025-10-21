const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("nuroai-lms.db", (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// ----------------------
// Core Tables
// ----------------------

// Colleges
db.run(`
  CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Departments
db.run(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    college_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id)
  )
`);

// Students (Auth data only)
db.run(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    college_id INTEGER,
    department_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )
`);

// ----------------------
// Extended Student Data
// ----------------------
db.run(`
  CREATE TABLE IF NOT EXISTS studentdata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER UNIQUE,
    full_name TEXT NOT NULL,
    gender TEXT,
    location TEXT,
    dob TEXT,
    about_you TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  )
`);

// ----------------------
// Tests & MCQs
// ----------------------
  // Tests table
  // Tests table
db.run(`
  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    college_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    start_date DATETIME,
    end_date DATETIME,
    max_questions INTEGER,
    total_time INTEGER, -- store in minutes (or seconds if you prefer)
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
  )
`);


  // Test_Departments junction table (for many-to-many between tests and departments)
  db.run(`
    CREATE TABLE IF NOT EXISTS test_departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    )
  `);


db.run(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER,
    question_text TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT,
    FOREIGN KEY (test_id) REFERENCES tests(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS student_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    test_id INTEGER,
    score REAL,
    status TEXT DEFAULT 'pending',
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (test_id) REFERENCES tests(id)
  )
`);

// ----------------------
// Coding Challenges
// ----------------------
db.run(`
  CREATE TABLE IF NOT EXISTS coding_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT,                         
    college_id INTEGER NOT NULL,             
    department_ids TEXT,                     
    language_options TEXT,                   
    test_cases TEXT,                         
    start_date TEXT NOT NULL,                
    end_date TEXT NOT NULL,                  
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS coding_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    language TEXT NOT NULL,                  
    code TEXT NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending, passed, failed,
    ai_score REAL,                           
    feedback TEXT,                           
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES coding_challenges(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
  )
`);


db.run(
  `CREATE TABLE IF NOT EXISTS test_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  test_id INTEGER NOT NULL,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',  -- pending, completed
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (test_id) REFERENCES tests(id)
);`
)

db.run(
  `CREATE TABLE IF NOT EXISTS question_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  selected_option TEXT NOT NULL,
  is_correct INTEGER DEFAULT 0,
  FOREIGN KEY (submission_id) REFERENCES test_submissions(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);`
)
/* 
db.run(
  `CREATE TABLE IF NOT EXISTS coding_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  challenge_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, passed, failed
  ai_score INTEGER DEFAULT 0,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (challenge_id) REFERENCES coding_challenges(id)
);`
)
 */
module.exports = db;
