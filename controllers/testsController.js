const pool = require("../db");

// Create a new test
exports.createTest = async (req, res) => {
  const {
    title,
    description,
    college_id,
    start_date,
    end_date,
    max_questions,
    total_time,
  } = req.body;

  if (!title || !college_id) {
    return res.status(400).json({ error: "Title and college_id are required" });
  }

  const sql = `
    INSERT INTO tests 
      (title, description, college_id, start_date, end_date, max_questions, total_time) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, created_at
  `;

  try {
    const result = await pool.query(sql, [
      title,
      description || "",
      college_id,
      start_date || null,
      end_date || null,
      max_questions || null,
      total_time || null,
    ]);

    const { id, created_at } = result.rows[0];

    res.status(201).json({
      id,
      title,
      description: description || "",
      college_id,
      start_date: start_date || null,
      end_date: end_date || null,
      max_questions: max_questions || null,
      total_time: total_time || null,
      created_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all tests
exports.getAllTests = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tests");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get tests by college
exports.getTestsByCollege = async (req, res) => {
  const { collegeId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM tests WHERE college_id = $1",
      [collegeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign test to departments
exports.assignDepartmentsToTest = async (req, res) => {
  const { testId } = req.params;
  const { department_ids } = req.body;

  if (!department_ids || !Array.isArray(department_ids)) {
    return res.status(400).json({ error: "department_ids must be an array" });
  }

  try {
    const insertPromises = department_ids.map((deptId) =>
      pool.query(
        "INSERT INTO test_departments (test_id, department_id) VALUES ($1, $2)",
        [testId, deptId]
      )
    );

    await Promise.all(insertPromises);

    res.json({ test_id: testId, assigned_departments: department_ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get departments for a test
exports.getDepartmentsForTest = async (req, res) => {
  const { testId } = req.params;

  const sql = `
    SELECT d.id, d.name 
    FROM departments d
    INNER JOIN test_departments td ON d.id = td.department_id
    WHERE td.test_id = $1
  `;

  try {
    const result = await pool.query(sql, [testId]);
    res.json({ test_id: testId, departments: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a test
exports.deleteTest = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM tests WHERE id = $1", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Test not found" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get full details of a single test
exports.getSingleTestDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const testResult = await pool.query("SELECT * FROM tests WHERE id = $1", [id]);

    if (testResult.rows.length === 0)
      return res.status(404).json({ error: "Test not found" });

    const test = testResult.rows[0];

    const deptResult = await pool.query(
      `
      SELECT d.id, d.name
      FROM departments d
      INNER JOIN test_departments td ON d.id = td.department_id
      WHERE td.test_id = $1
    `,
      [id]
    );

    const questionResult = await pool.query(
      `
      SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
      FROM questions
      WHERE test_id = $1
    `,
      [id]
    );

    res.json({
      ...test,
      departments: deptResult.rows,
      questions: questionResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get tests allocated to a department in a college
exports.getTestsByCollegeAndDepartment = async (req, res) => {
  const { collegeId, departmentId } = req.params;

  if (!collegeId || !departmentId) {
    return res
      .status(400)
      .json({ error: "collegeId and departmentId are required" });
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
    WHERE t.college_id = $1 
      AND td.department_id = $2
    ORDER BY t.created_at DESC
  `;

  try {
    const result = await pool.query(sql, [collegeId, departmentId]);
    res.status(200).json({
      count: result.rowCount,
      tests: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tests" });
  }
};
