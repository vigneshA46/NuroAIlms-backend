const db = require("../db");

// ✅ Get student data by student_id
exports.getStudentData = (req, res) => {
  const { student_id } = req.params;

  const sql = `SELECT * FROM studentdata WHERE student_id = ?`;
  db.get(sql, [student_id], (err, row) => {
    if (err) {
      console.error("Error fetching student data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ message: "Student data not found" });
    }
    res.json(row);
  });
};

// ✅ Update student data (partial update allowed)
exports.updateStudentData = (req, res) => {
  const { student_id } = req.params;
  const updates = req.body; // { full_name, gender, location, dob, about_you }

  // dynamically build query
  const fields = Object.keys(updates);
  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = [...fields.map((f) => updates[f]), student_id];

  const sql = `UPDATE studentdata SET ${setClause} WHERE student_id = ?`;

  db.run(sql, values, function (err) {
    if (err) {
      console.error("Error updating student data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Student data not found" });
    }
    res.json({ message: "Student data updated successfully" });
  });
};


// Create student data for a student
exports.createStudentDataForStudent = (req, res) => {
  const { studentId } = req.params; // get from route params (or req.body if you prefer)

  const checkSql = `SELECT id FROM studentdata WHERE student_id = ?`;
  db.get(checkSql, [studentId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      // Already exists
      return res.json({
        id: row.id,
        student_id: studentId,
        message: "Row already exists",
      });
    }

    // Insert new row
    const insertSql = `
      INSERT INTO studentdata (student_id, full_name, gender, location, dob, about_you)
      VALUES (?, '', '', '', '', '')
    `;

    db.run(insertSql, [studentId], function (err2) {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      return res.json({
        id: this.lastID,
        student_id: studentId,
        message: "Row created",
      });
    });
  });
};

exports.StudentDashboard = (req, res) => {
  const { studentId } = req.params;

  // Step 1: Fetch student's name, college_id, and department_id
  const studentInfoQuery = `
    SELECT s.id, s.college_id, s.department_id, sd.full_name
    FROM students s
    JOIN studentdata sd ON sd.student_id = s.id
    WHERE s.id = ?
  `;

  db.get(studentInfoQuery, [studentId], (err, student) => {
    if (err) {
      console.error(" Error fetching student info:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const { college_id, department_id, full_name } = student;

    // Step 2: Aggregate all dashboard metrics
    const dashboardQuery = `
      WITH 
      -- Tests stats
      test_stats AS (
        SELECT 
          COUNT(*) AS tests_assigned,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS tests_completed,
          COALESCE(SUM(t.total_time), 0) AS total_time_spent
        FROM student_tests st
        JOIN tests t ON t.id = st.test_id
        WHERE st.student_id = ?
      ),
      -- Questions attempted
      question_stats AS (
        SELECT COUNT(qr.id) AS questions_attempted
        FROM test_submissions ts
        JOIN question_responses qr ON qr.submission_id = ts.id
        WHERE ts.student_id = ?
      ),
      -- Coding stats
      coding_stats AS (
        SELECT
          (SELECT COUNT(*) 
           FROM coding_challenges cc
           WHERE cc.college_id = ? 
             AND (cc.department_ids LIKE '%' || ? || '%')
          ) AS coding_assigned,
          (SELECT COUNT(*) 
           FROM coding_submissions cs
           WHERE cs.student_id = ?
          ) AS coding_attempted,
          (SELECT COUNT(*) 
           FROM coding_submissions cs
           WHERE cs.student_id = ? AND cs.status = 'passed'
          ) AS coding_completed
      )
      SELECT
        ? AS student_name,
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

    const params = [
      studentId,         // For test_stats
      studentId,         // For question_stats
      college_id,        // For coding_assigned
      department_id,     // For coding_assigned (LIKE match)
      studentId,         // For coding_attempted
      studentId,         // For coding_completed
      full_name          // For final SELECT
    ];

    db.get(dashboardQuery, params, (err, result) => {
      if (err) {
        console.error("❌ Error fetching dashboard data:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Handle null-safe defaults
      const response = {
        student_name: result?.student_name || full_name,
        tests_assigned: result?.tests_assigned || 0,
        tests_completed: result?.tests_completed || 0,
        questions_attempted: result?.questions_attempted || 0,
        total_time_spent: result?.total_time_spent || 0,
        coding_assigned: result?.coding_assigned || 0,
        coding_attempted: result?.coding_attempted || 0,
        coding_completed: result?.coding_completed || 0,
      };

      res.json(response);
    });
  });
};