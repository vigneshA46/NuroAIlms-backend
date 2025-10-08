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
