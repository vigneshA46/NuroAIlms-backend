const express = require("express");
const router = express.Router();
const pool = require("../db"); // Use PostgreSQL pool

const {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentsController");

// CRUD routes
router.post("/", createStudent); // Create student
router.get("/", getStudents); // Get all students
router.put("/:id", updateStudent); // Update student
router.delete("/:id", deleteStudent); // Delete student

// GET /api/get-students/:collegeId/:departmentId
router.get("/get-students/:collegeId/:departmentId", async (req, res) => {
  const { collegeId, departmentId } = req.params;

  const sql = `
    SELECT s.id, s.email, s.college_id, s.department_id, s.password_hash,
           c.name AS college_name,
           d.name AS department_name
    FROM students s
    LEFT JOIN colleges c ON s.college_id = c.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE s.college_id = $1 AND s.department_id = $2
  `;

  try {
    const result = await pool.query(sql, [collegeId, departmentId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
