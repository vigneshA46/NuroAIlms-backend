const db = require("../db");

// --------------------
// Create Coding Challenge
// --------------------
exports.createCodingChallenge = (req, res) => {
  const {
    title,
    description,
    difficulty,
    college_id,
    department_ids,
    language_options,
    test_cases,
    start_date,
    end_date
  } = req.body;

  if (!title || !description || !college_id || !start_date || !end_date) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const deptIdsString = department_ids ? department_ids.join(",") : "";
  const languagesString = language_options ? language_options.join(",") : "";

  const query = `
    INSERT INTO coding_challenges 
    (title, description, difficulty, college_id, department_ids, language_options, test_cases, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [title, description, difficulty, college_id, deptIdsString, languagesString, test_cases, start_date, end_date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, challenge_id: this.lastID });
    }
  );
};

// --------------------
// Update Coding Challenge
// --------------------
exports.updateCodingChallenge = (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    difficulty,
    department_ids,
    language_options,
    test_cases,
    start_date,
    end_date
  } = req.body;

  const deptIdsString = department_ids ? department_ids.join(",") : "";
  const languagesString = language_options ? language_options.join(",") : "";

  const query = `
    UPDATE coding_challenges SET
      title = ?,
      description = ?,
      difficulty = ?,
      department_ids = ?,
      language_options = ?,
      test_cases = ?,
      start_date = ?,
      end_date = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [title, description, difficulty, deptIdsString, languagesString, test_cases, start_date, end_date, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Challenge not found" });
      res.json({ success: true });
    }
  );
};

// --------------------
// Delete Coding Challenge
// --------------------
exports.deleteCodingChallenge = (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM coding_challenges WHERE id = ?";

  db.run(query, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Challenge not found" });
    res.json({ success: true });
  });
};

// --------------------
// Get Single Coding Challenge
// --------------------
exports.getCodingChallenge = (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM coding_challenges WHERE id = ?";

  db.get(query, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Challenge not found" });

    row.department_ids = row.department_ids ? row.department_ids.split(",") : [];
    row.language_options = row.language_options ? row.language_options.split(",") : [];

    res.json(row);
  });
};

// --------------------
// Get All Coding Challenges (Optional college filter)
// --------------------
exports.getAllCodingChallenges = (req, res) => {
  const { college_id } = req.query;
  let query = "SELECT * FROM coding_challenges";
  let params = [];

  if (college_id) {
    query += " WHERE college_id = ?";
    params.push(college_id);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    rows.forEach(row => {
      row.department_ids = row.department_ids ? row.department_ids.split(",") : [];
      row.language_options = row.language_options ? row.language_options.split(",") : [];
    });

    res.json(rows);
  });
};


exports.getStudentCodingChallenges = (req, res) => {
  const { student_id } = req.params;

  const query = `
    SELECT cc.* 
    FROM coding_challenges cc
    JOIN students s ON s.college_id = cc.college_id
    WHERE s.id = ?
  `;

  db.all(query, [student_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    rows.forEach(row => {
      row.department_ids = row.department_ids ? row.department_ids.split(",") : [];
      row.language_options = row.language_options ? row.language_options.split(",") : [];
    });

    res.json(rows);
  });
};

// --------------------
// Check if Student Already Attempted a Challenge
// --------------------
exports.isCodingChallengeAttempted = (req, res) => {
  const { challenge_id, student_id } = req.params;

  const query = `
    SELECT * FROM coding_submissions
    WHERE challenge_id = ? AND student_id = ?
  `;

  db.get(query, [challenge_id, student_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ attempted: !!row });
  });
};

// --------------------
// Submit Coding Challenge Code
// --------------------
exports.submitCodingChallengeCode = (req, res) => {
  const { challenge_id, student_id, language, code } = req.body;

  if (!challenge_id || !student_id || !language || !code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `
    INSERT INTO coding_submissions (challenge_id, student_id, language, code)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [challenge_id, student_id, language, code], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ success: true, submission_id: this.lastID });
  });
};

// --------------------
// Evaluate Coding Challenge Submission (AI or auto-grader)
// --------------------
exports.evaluateCodingChallengeSubmission = (req, res) => {
  const { submission_id } = req.params;
  const { ai_score, feedback, status, score } = req.body;

  if (ai_score == null || !feedback || !status) {
    return res.status(400).json({ error: "Missing required evaluation data" });
  }

  const query = `
    UPDATE coding_submissions
    SET ai_score = ?, feedback = ?, status = ?, score = ?
    WHERE id = ?
  `;

  db.run(query, [ai_score, feedback, status, score || 0, submission_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Submission not found" });
    res.json({ success: true });
  });
};
 
// --------------------
// Get Student Submission Result for a Challenge
// --------------------
exports.getStudentCodingSubmissionResult = (req, res) => {
  const { challenge_id, student_id } = req.params;

  const query = `
    SELECT * FROM coding_submissions
    WHERE challenge_id = ? AND student_id = ?
  `;

  db.get(query, [challenge_id, student_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "No submission found" });
    res.json(row);
  });
};

// Get all coding challenges allocated for a specific college
exports.getCollegeCodingChallenges = (req, res) => {
  const { college_id } = req.params;

  const query = `
    SELECT * FROM coding_challenges
    WHERE college_id = ?
    ORDER BY created_at DESC
  `;

  db.all(query, [college_id], (err, rows) => {
    if (err) {
      console.error("Error fetching college coding challenges:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(rows);
  });
};


// Get all coding challenges allocated for a specific department
exports.getDepartmentCodingChallenges = (req, res) => {
  const { department_id } = req.params;

  const query = `
    SELECT * FROM coding_challenges
    WHERE ',' || department_ids || ',' LIKE '%,' || ? || ',%'
    ORDER BY created_at DESC
  `;

  db.all(query, [department_id], (err, rows) => {
    if (err) {
      console.error("Error fetching department coding challenges:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(rows);
  });
};
