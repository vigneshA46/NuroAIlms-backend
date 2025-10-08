// controllers/questionController.js
const db = require("../db");

// Add a new question to a test
exports.addQuestion = (req, res) => {
  const { test_id, question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

  if (!test_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [test_id, question_text, option_a, option_b, option_c, option_d, correct_option], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      message: "Question added successfully",
      question_id: this.lastID,
    });
  });
};

// Get all questions for a test
exports.getQuestionsByTestId = (req, res) => {
  const { testId } = req.params;

  const sql = `SELECT * FROM questions WHERE test_id = ?`;

  db.all(sql, [testId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Update a question
exports.updateQuestion = (req, res) => {
  const { id } = req.params;
  const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

  const sql = `
    UPDATE questions 
    SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?
    WHERE id = ?
  `;

  db.run(sql, [question_text, option_a, option_b, option_c, option_d, correct_option, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question updated successfully" });
  });
};

// Delete a question
exports.deleteQuestion = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM questions WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question deleted successfully" });
  });
};


// Get single question by index
exports.getQuestionbyindex = (req, res) => {
  const { test_id, index } = req.params; // index = 0,1,2...
  
  db.all("SELECT * FROM questions WHERE test_id = ? ORDER BY id", [test_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No questions found for this test" });
    }

    const question = rows[index];
    if (!question) {
      return res.status(404).json({ error: "No more questions" });
    }

    // don't send correct_option to frontend!
    const { id, question_text, option_a, option_b, option_c, option_d,correct_option } = question;
    res.json({ 
      index: parseInt(index), 
      total: rows.length, 
      question: { id, question_text, option_a, option_b, option_c, option_d , correct_option} 
    });
  });
};

// Bulk insert questions
exports.bulkAddQuestions = (req, res) => {
  const { questions } = req.body;
  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: "Questions array required" });
  }

  const sql = `
    INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(sql);

  try {
    db.serialize(() => {
      questions.forEach((q) => {
        stmt.run([
          q.test_id,
          q.question_text,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_option,
        ]);
      });
    });
    stmt.finalize();
    res.json({ message: "Questions added successfully" });
  } catch (err) {
    console.error("Bulk insert error:", err);
    res.status(500).json({ error: "Failed to insert questions" });
  }
};
