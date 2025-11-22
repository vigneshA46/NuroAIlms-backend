// db.js — PostgreSQL version
const dotenv = require("dotenv");

const { Pool } = require("pg")

dotenv.config();

// ----------------------
// PostgreSQL Connection
// ----------------------



// local connecion

/* const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "nuroailms",
  password: process.env.DB_PASSWORD || "123456",
  port: process.env.DB_PORT || 5432,
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch((err) => console.error("❌ Database connection error:", err.message));
 */




  const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    "postgresql://nuroailms_user:jWSVttb05dxQwBzpntADLmxjnGGjtdMa@dpg-d460u3buibrs73ffoscg-a.singapore-postgres.render.com/nuroailms",
  ssl: {
    rejectUnauthorized: false, // REQUIRED for Render free-tier PostgreSQL
  }
});

pool.connect()
  .then(() => console.log("✅ Connected to Render PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err.message));





// ----------------------
// Table Initialization
// ----------------------
async function initializeDatabase() {
  try {
    // Colleges
    await pool.query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Departments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Students (Auth data)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        college_id INTEGER REFERENCES colleges(id),
        department_id INTEGER REFERENCES departments(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Student Extra Data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS studentdata (
        id SERIAL PRIMARY KEY,
        student_id INTEGER UNIQUE REFERENCES students(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        gender TEXT,
        location TEXT,
        dob TEXT,
        about_you TEXT
      );
    `);

    // Tests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        max_questions INTEGER,
        total_time INTEGER
      );
    `);

    // Test_Departments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_departments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE
      );
    `);

    // Questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id),
        question_text TEXT NOT NULL,
        option_a TEXT,
        option_b TEXT,
        option_c TEXT,
        option_d TEXT,
        correct_option TEXT
      );
    `);

    // Student Tests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_tests (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        test_id INTEGER REFERENCES tests(id),
        score REAL,
        status TEXT DEFAULT 'pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Coding Challenges
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coding_challenges (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        difficulty TEXT,
        college_id INTEGER NOT NULL REFERENCES colleges(id),
        department_ids TEXT,
        language_options TEXT,
        test_cases TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Coding Submissions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coding_submissions (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES coding_challenges(id),
        student_id INTEGER NOT NULL REFERENCES students(id),
        language TEXT NOT NULL,
        code TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        ai_score REAL,
        feedback TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Test Submissions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_submissions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id),
        test_id INTEGER NOT NULL REFERENCES tests(id),
        score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Question Responses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_responses (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES test_submissions(id),
        question_id INTEGER NOT NULL REFERENCES questions(id),
        selected_option TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE
      );
    `);

    console.log("✅ All PostgreSQL tables are ready.");
  } catch (err) {
    console.error("❌ Error initializing database:", err.message);
  }
}

// Initialize tables on start
initializeDatabase();

module.exports = pool;
