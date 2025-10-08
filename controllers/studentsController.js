const db = require("../db");

// Create student
exports.createStudent = (req, res) => {
  const { email, password, college_id, department_id } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  db.run(
    `INSERT INTO students (email, password_hash, college_id, department_id) VALUES (?, ?, ?, ?)`,
    [email, password, college_id, department_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const newStudentId = this.lastID;

      // 👇 Immediately insert a blank row into studentdata
      db.run(
        `INSERT INTO studentdata (student_id, full_name, gender, location, dob, about_you) VALUES (?, '', '', '', '', '')`,
        [newStudentId],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({
            id: newStudentId,
            email,
            college_id,
            department_id,
            message: "Student and StudentData row created successfully",
          });
        }
      );
    }
  );
};


// Get all students
exports.getStudents = (req, res) => {
  db.all("SELECT * FROM students", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Update student (patch style update)
exports.updateStudent = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
  const values = Object.values(updates);

  if (!fields) return res.status(400).json({ error: "No fields to update" });

  db.run(
    `UPDATE students SET ${fields} WHERE id = ?`,
    [...values, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Student not found" });
      res.json({ success: true });
    }
  );
};

// Delete student
exports.deleteStudent = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM students WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Student not found" });
    res.json({ success: true });
  });
};
