const pool = require("../db");

// ✅ Get student data by student_id
exports.getStudentData = async (req, res) => {
  const { student_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM studentdata WHERE student_id = $1`,
      [student_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student data not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching student data:", err.message);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Update student data (partial update)
exports.updateStudentData = async (req, res) => {
  const { student_id } = req.params;
  const updates = req.body;

  const fields = Object.keys(updates);
  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const values = [...fields.map((f) => updates[f]), student_id];

  try {
    const result = await pool.query(
      `UPDATE studentdata SET ${setClause} WHERE student_id = $${fields.length + 1}`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Student data not found" });
    }

    res.json({ message: "Student data updated successfully" });
  } catch (err) {
    console.error("Error updating student data:", err.message);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Create student data for a student
exports.createStudentDataForStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Check if already exists
    const check = await pool.query(
      `SELECT id FROM studentdata WHERE student_id = $1`,
      [studentId]
    );

    if (check.rows.length > 0) {
      return res.json({
        id: check.rows[0].id,
        student_id: studentId,
        message: "Row already exists",
      });
    }

    // Insert new
    const insert = await pool.query(
      `INSERT INTO studentdata (student_id, full_name, gender, location, dob, about_you)
       VALUES ($1, '', '', '', '', '') RETURNING id`,
      [studentId]
    );

    res.json({
      id: insert.rows[0].id,
      student_id: studentId,
      message: "Row created",
    });
  } catch (err) {
    console.error("Error creating student data:", err.message);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Student Dashboard
exports.StudentDashboard = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Step 1: Fetch student's info
    const studentRes = await pool.query(
      `
      SELECT s.id, s.college_id, s.department_id, sd.full_name
      FROM students s
      JOIN studentdata sd ON sd.student_id = s.id
      WHERE s.id = $1
      `,
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const { college_id, department_id, full_name } = studentRes.rows[0];

    // Step 2: Dashboard query
    const dashboardQuery = `
      WITH 
      test_stats AS (
        SELECT 
          COUNT(*) AS tests_assigned,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS tests_completed,
          COALESCE(SUM(t.total_time), 0) AS total_time_spent
        FROM student_tests st
        JOIN tests t ON t.id = st.test_id
        WHERE st.student_id = $1
      ),
      question_stats AS (
        SELECT COUNT(qr.id) AS questions_attempted
        FROM test_submissions ts
        JOIN question_responses qr ON qr.submission_id = ts.id
        WHERE ts.student_id = $2
      ),
      coding_stats AS (
        SELECT
          (SELECT COUNT(*) 
           FROM coding_challenges cc
           WHERE cc.college_id = $3 
             AND cc.department_ids LIKE '%' || $4 || '%'
          ) AS coding_assigned,
          (SELECT COUNT(*) 
           FROM coding_submissions cs
           WHERE cs.student_id = $5
          ) AS coding_attempted,
          (SELECT COUNT(*) 
           FROM coding_submissions cs
           WHERE cs.student_id = $6 AND cs.status = 'passed'
          ) AS coding_completed
      )
      SELECT
        $7 AS student_name,
        ts.tests_assigned,
        ts.tests_completed,
        qs.questions_attempted,
        ts.total_time_spent,
        cs.coding_assigned,
        cs.coding_attempted,
        cs.coding_completed
      FROM test_stats ts
      CROSS JOIN question_stats qs
      CROSS JOIN coding_stats cs
    `;

    const result = await pool.query(dashboardQuery, [
      studentId, // test_stats
      studentId, // question_stats
      college_id, // coding_assigned
      department_id, // LIKE match
      studentId, // coding_attempted
      studentId, // coding_completed
      full_name, // student_name
    ]);

    const row = result.rows[0] || {};

    res.json({
      student_name: row.student_name || full_name,
      tests_assigned: parseInt(row.tests_assigned) || 0,
      tests_completed: parseInt(row.tests_completed) || 0,
      questions_attempted: parseInt(row.questions_attempted) || 0,
      total_time_spent: parseFloat(row.total_time_spent) || 0,
      coding_assigned: parseInt(row.coding_assigned) || 0,
      coding_attempted: parseInt(row.coding_attempted) || 0,
      coding_completed: parseInt(row.coding_completed) || 0,
    });
  } catch (err) {
    console.error("Error fetching student dashboard:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
