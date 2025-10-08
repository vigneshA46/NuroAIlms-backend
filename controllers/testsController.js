const db = require("../db");

// Create a new test
exports.createTest = (req, res) => {
  const {
    title,
    description,
    college_id,
    start_date,
    end_date,
    max_questions,
    total_time,
  } = req.body;

  // Basic validation
  if (!title || !college_id) {
    return res.status(400).json({ error: "Title and college_id are required" });
  }

  const sql = `
    INSERT INTO tests 
      (title, description, college_id, start_date, end_date, max_questions, total_time) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      title,
      description || "",
      college_id,
      start_date || null,   // optional values -> store NULL if not provided
      end_date || null,
      max_questions || null,
      total_time || null,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        id: this.lastID,
        title,
        description: description || "",
        college_id,
        start_date: start_date || null,
        end_date: end_date || null,
        max_questions: max_questions || null,
        total_time: total_time || null,
        created_at: new Date().toISOString(),
      });
    }
  );
};

// Get all tests
exports.getAllTests = (req, res) => {
  db.all("SELECT * FROM tests", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Get tests by college
exports.getTestsByCollege = (req, res) => {
  const { collegeId } = req.params;
  db.all("SELECT * FROM tests WHERE college_id = ?", [collegeId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Assign test to departments
exports.assignDepartmentsToTest = (req, res) => {
  const { testId } = req.params;
  const { department_ids } = req.body;

  if (!department_ids || !Array.isArray(department_ids)) {
    return res.status(400).json({ error: "department_ids must be an array" });
  }

  const sql = `INSERT INTO test_departments (test_id, department_id) VALUES (?, ?)`;
  const stmt = db.prepare(sql);

  department_ids.forEach((deptId) => {
    stmt.run(testId, deptId);
  });

  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ test_id: testId, assigned_departments: department_ids });
  });
};

// Get departments for a test
exports.getDepartmentsForTest = (req, res) => {
  const { testId } = req.params;

  const sql = `
    SELECT d.id, d.name 
    FROM departments d
    INNER JOIN test_departments td ON d.id = td.department_id
    WHERE td.test_id = ?
  `;

  db.all(sql, [testId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ test_id: testId, departments: rows });
  });
};

// Delete a test
exports.deleteTest = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tests WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Test not found" });
    res.json({ success: true });
  });
};


// Get full details of a single test
exports.getSingleTestDetails = (req, res) => {
  const { id } = req.params;

  // First: get the test details
  const testSql = `SELECT * FROM tests WHERE id = ?`;

  db.get(testSql, [id], (err, test) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!test) return res.status(404).json({ error: "Test not found" });

    // Next: get departments linked to this test
    const deptSql = `
      SELECT d.id, d.name
      FROM departments d
      INNER JOIN test_departments td ON d.id = td.department_id
      WHERE td.test_id = ?
    `;

    db.all(deptSql, [id], (err, departments) => {
      if (err) return res.status(500).json({ error: err.message });

      // Next: get questions linked to this test
      const questionSql = `
        SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
        FROM questions
        WHERE test_id = ?
      `;

      db.all(questionSql, [id], (err, questions) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          ...test,
          departments,
          questions
        });
      });
    });
  });
};

// Get tests allocated to a department in a college
exports.getTestsByCollegeAndDepartment = (req, res) => {
  const { collegeId, departmentId } = req.params;

  if (!collegeId || !departmentId) {
    return res.status(400).json({ error: "collegeId and departmentId are required" });
  }

  const sql = `
    SELECT DISTINCT 
      t.id, 
      t.title, 
      t.description, 
      t.college_id, 
      t.start_date, 
      t.end_date, 
      t.max_questions, 
      t.total_time, 
      t.created_at
    FROM tests t
    INNER JOIN test_departments td 
      ON t.id = td.test_id
    WHERE t.college_id = ? 
      AND td.department_id = ?
    ORDER BY t.created_at DESC
  `;

  db.all(sql, [collegeId, departmentId], (err, rows) => {
    if (err) {
      console.error("DB error in getTestsByCollegeAndDepartment:", err);
      return res.status(500).json({ error: "Failed to fetch tests" });
    }

    // Standardized response
    res.status(200).json({
      count: rows.length,
      tests: rows,
    });
  });
};

