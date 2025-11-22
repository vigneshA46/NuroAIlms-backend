const pool = require("../db"); // using PostgreSQL connection pool

// Student submits a test (only score stored)
exports.submitTest = async (req, res) => {
  const { student_id, test_id, score } = req.body;

  if (!student_id || !test_id || score === undefined) {
    return res.status(400).json({ error: "student_id, test_id and score required" });
  }

  const submittedAt = new Date().toISOString();

  try {
    const result = await pool.query(
      `INSERT INTO test_submissions (student_id, test_id, score, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [student_id, test_id, score, "completed", submittedAt]
    );

    res.json({
      submission_id: result.rows[0].id,
      student_id,
      test_id,
      score,
      status: "completed",
      submitted_at: submittedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all submissions of a student
exports.getStudentSubmissions = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM test_submissions WHERE student_id = $1 ORDER BY submitted_at DESC",
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get details of one test submission
exports.getSubmissionDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const submissionResult = await pool.query(
      "SELECT * FROM test_submissions WHERE id = $1",
      [id]
    );

    if (submissionResult.rows.length === 0)
      return res.status(404).json({ error: "Submission not found" });

    const submission = submissionResult.rows[0];

    const responsesResult = await pool.query(
      "SELECT * FROM question_responses WHERE submission_id = $1",
      [id]
    );

    submission.responses = responsesResult.rows;
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Submit coding challenge
exports.submitCodingChallenge = async (req, res) => {
  const { student_id, challenge_id, code } = req.body;

  if (!student_id || !challenge_id || !code) {
    return res.status(400).json({ error: "student_id, challenge_id, and code required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO coding_submissions (student_id, challenge_id, code, status) VALUES ($1, $2, $3, $4) RETURNING id",
      [student_id, challenge_id, code, "pending"]
    );

    res.json({ submission_id: result.rows[0].id, status: "pending" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get coding submissions of a student
exports.getCodingSubmissions = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM coding_submissions WHERE student_id = $1",
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Check if test is already attempted
exports.checkTestAttempt = async (req, res) => {
  const { testId, studentId } = req.params;

  try {
    const result = await pool.query(
      "SELECT id FROM test_submissions WHERE test_id = $1 AND student_id = $2 LIMIT 1",
      [testId, studentId]
    );

    res.json({ attempted: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get student result for a test
exports.getStudentResult = async (req, res) => {
  const { testId, studentId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM test_submissions WHERE test_id = $1 AND student_id = $2",
      [testId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No submission found for this student" });
    }

    const row = result.rows[0];
    res.json({
      score: row.score,
      submitted_at: row.created_at || row.submitted_at,
      total_questions: row.total_questions,
      ...row,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all coding submissions for a challenge
exports.getAllCodingSubmissions = async (req, res) => {
  const { challengeid } = req.params;

  if (!challengeid) {
    return res.status(400).json({ error: "Challenge ID is required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM coding_submissions WHERE challenge_id = $1",
      [challengeid]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};
