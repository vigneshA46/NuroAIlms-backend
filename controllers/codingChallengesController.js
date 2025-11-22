const pool = require("../db");
const axios = require("axios");

// --------------------
// Create Coding Challenge
// --------------------
exports.createCodingChallenge = async (req, res) => {
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

  try {
    const deptIdsString = department_ids ? department_ids.join(",") : "";
    const languagesString = language_options ? language_options.join(",") : "";

    const query = `
      INSERT INTO coding_challenges 
      (title, description, difficulty, college_id, department_ids, language_options, test_cases, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const result = await pool.query(query, [
      title,
      description,
      difficulty,
      college_id,
      deptIdsString,
      languagesString,
      test_cases,
      start_date,
      end_date
    ]);

    res.status(201).json({ success: true, challenge_id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Update Coding Challenge
// --------------------
exports.updateCodingChallenge = async (req, res) => {
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

  try {
    const deptIdsString = department_ids ? department_ids.join(",") : "";
    const languagesString = language_options ? language_options.join(",") : "";

    const query = `
      UPDATE coding_challenges SET
        title = $1,
        description = $2,
        difficulty = $3,
        department_ids = $4,
        language_options = $5,
        test_cases = $6,
        start_date = $7,
        end_date = $8
      WHERE id = $9
    `;

    const result = await pool.query(query, [
      title,
      description,
      difficulty,
      deptIdsString,
      languagesString,
      test_cases,
      start_date,
      end_date,
      id
    ]);

    if (result.rowCount === 0) return res.status(404).json({ error: "Challenge not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Delete Coding Challenge
// --------------------
exports.deleteCodingChallenge = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM coding_challenges WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Challenge not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Get Single Coding Challenge
// --------------------
exports.getCodingChallenge = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM coding_challenges WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Challenge not found" });

    const row = result.rows[0];
    row.department_ids = row.department_ids ? row.department_ids.split(",") : [];
    row.language_options = row.language_options ? row.language_options.split(",") : [];

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Get All Coding Challenges (Optional college filter)
// --------------------
exports.getAllCodingChallenges = async (req, res) => {
  const { college_id } = req.query;

  try {
    let query = "SELECT * FROM coding_challenges";
    const params = [];

    if (college_id) {
      query += " WHERE college_id = $1";
      params.push(college_id);
    }

    const result = await pool.query(query, params);
    const rows = result.rows.map(row => ({
      ...row,
      department_ids: row.department_ids ? row.department_ids.split(",") : [],
      language_options: row.language_options ? row.language_options.split(",") : []
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Get Student Coding Challenges
// --------------------
exports.getStudentCodingChallenges = async (req, res) => {
  const { student_id } = req.params;
  const query = `
    SELECT cc.* 
    FROM coding_challenges cc
    JOIN students s ON s.college_id = cc.college_id
    WHERE s.id = $1
  `;
  try {
    const result = await pool.query(query, [student_id]);
    const rows = result.rows.map(row => ({
      ...row,
      department_ids: row.department_ids ? row.department_ids.split(",") : [],
      language_options: row.language_options ? row.language_options.split(",") : []
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Check if Student Already Attempted a Challenge
// --------------------
exports.isCodingChallengeAttempted = async (req, res) => {
  const { challenge_id, student_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT 1 FROM coding_submissions WHERE challenge_id = $1 AND student_id = $2",
      [challenge_id, student_id]
    );
    res.json({ attempted: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Submit Coding Challenge Code
// --------------------
exports.submitCodingChallengeCode = async (req, res) => {
  const { challenge_id, student_id, language, code } = req.body;

  if (!challenge_id || !student_id || !language || !code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO coding_submissions (challenge_id, student_id, language, code)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [challenge_id, student_id, language, code]
    );
    res.status(201).json({ success: true, submission_id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Evaluate Coding Challenge Submission
// --------------------
exports.evaluateCodingChallengeSubmission = async (req, res) => {
  const { submission_id } = req.params;
  const { ai_score, feedback, status, score } = req.body;

  if (ai_score == null || !feedback || !status) {
    return res.status(400).json({ error: "Missing required evaluation data" });
  }

  try {
    const result = await pool.query(
      `UPDATE coding_submissions
       SET ai_score = $1, feedback = $2, status = $3, score = $4
       WHERE id = $5`,
      [ai_score, feedback, status, score || 0, submission_id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Submission not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Get Student Submission Result
// --------------------
exports.getStudentCodingSubmissionResult = async (req, res) => {
  const { challenge_id, student_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM coding_submissions WHERE challenge_id = $1 AND student_id = $2`,
      [challenge_id, student_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No submission found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// College Coding Challenges
// --------------------
exports.getCollegeCodingChallenges = async (req, res) => {
  const { college_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM coding_challenges WHERE college_id = $1 ORDER BY created_at DESC`,
      [college_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Department Coding Challenges
// --------------------
exports.getDepartmentCodingChallenges = async (req, res) => {
  const { department_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM coding_challenges
       WHERE ',' || department_ids || ',' LIKE '%,' || $1 || ',%'
       ORDER BY created_at DESC`,
      [department_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// AI Code Review Controller
// --------------------
exports.codeReviewController = async (req, res) => {
  const { title, description, studentCode, student_id, challenge_id } = req.body;

  if (!title || !description || !studentCode || !student_id || !challenge_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const prompt = `
You are an expert coding instructor reviewing a student's submission.

Question Title: ${title}
Description: ${description}

Student Code:
\`\`\`
${studentCode}
\`\`\`

Please return **only JSON**:
{ "score": <1-10>, "feedback": "..." }
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a professional code reviewer." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let content = response.data.choices[0].message.content.trim();
    content = content.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { score: 0, feedback: "Unparsable response from AI model." };
    }

    const score = Math.min(Math.max(Number(parsed.score) || 0, 1), 10);
    const status = score >= 5 ? "passed" : "failed";

    await pool.query(
      `UPDATE coding_submissions
       SET ai_score = $1, status = $2, feedback = $3
       WHERE student_id = $4 AND challenge_id = $5`,
      [score, status, parsed.feedback, student_id, challenge_id]
    );

    res.json({ score, feedback: parsed.feedback });
  } catch (error) {
    console.error("Groq API error:", error.message);
    res.status(500).json({ error: "Failed to review code." });
  }
};
