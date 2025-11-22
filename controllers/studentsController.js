const pool = require("../db");

// ✅ Create student
exports.createStudent = async (req, res) => {
  const { email, password, college_id, department_id } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Step 1️⃣ Insert student
    const insertStudent = await pool.query(
      `INSERT INTO students (email, password_hash, college_id, department_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [email, password, college_id, department_id]
    );

    const newStudentId = insertStudent.rows[0].id;

    // Step 2️⃣ Immediately create blank studentdata row
    await pool.query(
      `INSERT INTO studentdata (student_id, full_name, gender, location, dob, about_you)
       VALUES ($1, '', '', '', '', '')`,
      [newStudentId]
    );

    res.json({
      id: newStudentId,
      email,
      college_id,
      department_id,
      message: "Student and StudentData row created successfully",
    });
  } catch (err) {
    console.error("Error creating student:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all students
exports.getStudents = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM students ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching students:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update student (PATCH-style)
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = Object.keys(updates);
  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const values = [...Object.values(updates), id];

  try {
    const result = await pool.query(
      `UPDATE students SET ${setClause} WHERE id = $${fields.length + 1}`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ success: true, message: "Student updated successfully" });
  } catch (err) {
    console.error("Error updating student:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete student
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM students WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err.message);
    res.status(500).json({ error: err.message });
  }
};
