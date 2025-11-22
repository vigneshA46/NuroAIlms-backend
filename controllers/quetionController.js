const pool = require("../db");

// ✅ Add a new question to a test
exports.addQuestion = async (req, res) => {
  try {
    const { test_id, question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

    if (!test_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `
      INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [test_id, question_text, option_a, option_b, option_c, option_d, correct_option]
    );

    res.json({
      message: "Question added successfully",
      question_id: result.rows[0].id,
    });
  } catch (err) {
    console.error("Error adding question:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all questions for a test
exports.getQuestionsByTestId = async (req, res) => {
  try {
    const { testId } = req.params;
    const result = await pool.query("SELECT * FROM questions WHERE test_id = $1", [testId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching questions:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update a question
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

    const result = await pool.query(
      `
      UPDATE questions 
      SET question_text = $1,
          option_a = $2,
          option_b = $3,
          option_c = $4,
          option_d = $5,
          correct_option = $6
      WHERE id = $7
      RETURNING *
      `,
      [question_text, option_a, option_b, option_c, option_d, correct_option, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Question not found" });
    res.json({ message: "Question updated successfully" });
  } catch (err) {
    console.error("Error updating question:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM questions WHERE id = $1", [id]);

    if (result.rowCount === 0) return res.status(404).json({ error: "Question not found" });
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("Error deleting question:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single question by index
exports.getQuestionbyindex = async (req, res) => {
  try {
    const { test_id, index } = req.params;
    const result = await pool.query(
      "SELECT * FROM questions WHERE test_id = $1 ORDER BY id ASC",
      [test_id]
    );

    const rows = result.rows;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No questions found for this test" });
    }

    const question = rows[index];
    if (!question) {
      return res.status(404).json({ error: "No more questions" });
    }

    const { id, question_text, option_a, option_b, option_c, option_d, correct_option } = question;
    res.json({
      index: parseInt(index),
      total: rows.length,
      question: { id, question_text, option_a, option_b, option_c, option_d, correct_option },
    });
  } catch (err) {
    console.error("Error fetching question by index:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Bulk insert questions
exports.bulkAddQuestions = async (req, res) => {
  const { questions } = req.body;
  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: "Questions array required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const q of questions) {
      await client.query(
        `
        INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [q.test_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Questions added successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk insert error:", err.message);
    res.status(500).json({ error: "Failed to insert questions" });
  } finally {
    client.release();
  }
};
