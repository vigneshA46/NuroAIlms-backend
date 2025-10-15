const db = require("../db");

// Student submits a test (only score stored)
exports.submitTest = (req, res) => {
  const { student_id, test_id, score } = req.body;

  if (!student_id || !test_id || score === undefined) {
    return res.status(400).json({ error: "student_id, test_id and score required" });
  }

  const submittedAt = new Date().toISOString();

  db.run(
    "INSERT INTO test_submissions (student_id, test_id, score, status, submitted_at) VALUES (?, ?, ?, ?, ?)",
    [student_id, test_id, score, "completed", submittedAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        submission_id: this.lastID,
        student_id,
        test_id,
        score,
        status: "completed",
        submitted_at: submittedAt
      });
    }
  );
};


// Get all submissions of a student
exports.getStudentSubmissions = (req, res) => {
  const { id } = req.params;
  db.all(
    "SELECT * FROM test_submissions WHERE student_id = ? ORDER BY submitted_at DESC",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Get details of one test submission
exports.getSubmissionDetails = (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM test_submissions WHERE id = ?", [id], (err, submission) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    db.all("SELECT * FROM question_responses WHERE submission_id = ?", [id], (err, responses) => {
      if (err) return res.status(500).json({ error: err.message });
      submission.responses = responses;
      res.json(submission);
    });
  });
};



// Submit coding challenge
exports.submitCodingChallenge = (req, res) => {
  const { student_id, challenge_id, code } = req.body;

  if (!student_id || !challenge_id || !code) {
    return res.status(400).json({ error: "student_id, challenge_id, and code required" });
  }

  db.run(
    "INSERT INTO coding_submissions (student_id, challenge_id, code, status) VALUES (?, ?, ?, ?)",
    [student_id, challenge_id, code, "pending"],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ submission_id: this.lastID, status: "pending" });
    }
  );
};

// Get coding submissions of a student
exports.getCodingSubmissions = (req, res) => {
  const { id } = req.params;
  db.all("SELECT * FROM coding_submissions WHERE student_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.checkTestAttempt = (req, res) => {
  const { testId, studentId } = req.params;

  const sql = `SELECT id FROM test_submissions WHERE test_id = ? AND student_id = ? LIMIT 1`;

  db.get(sql, [testId, studentId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      return res.json({ attempted: true });
    } else {
      return res.json({ attempted: false });
    }
  });
};


// Get student result for a test
exports.getStudentResult = (req, res) => {
  const { testId, studentId } = req.params;

  const sql = `SELECT * FROM test_submissions WHERE test_id = ? AND student_id = ?`;

  db.get(sql, [testId, studentId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ message: "No submission found for this student" });
    }

    res.json({
      score: row.score,
      submitted_at: row.created_at,
      total_questions: row.total_questions, // if stored
      ...row // include any other info
    });
  });
};


exports.getAllCodingSubmissions = (req, res) => {
  const { challengeid } = req.params;

  if (!challengeid) {
    return res.status(400).json({ error: "Challenge ID is required" });
  }

  db.all(
    "SELECT * FROM coding_submissions WHERE challenge_id = ?",
    [challengeid],
    (err, rows) => {
      if (err) {
        console.error("Error fetching submissions:", err.message);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(200).json(rows);
    }
  );
};
