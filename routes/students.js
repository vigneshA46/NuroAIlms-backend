const express = require("express");
const router = express.Router();
const db = require("../db");

const { createStudent, getStudents, updateStudent, deleteStudent } = require("../controllers/studentsController");

router.post("/", createStudent);        // Create student
router.get("/", getStudents);           // Get all students
router.put("/:id", updateStudent);      // Update student (partial update supported)
router.delete("/:id", deleteStudent);   // Delete student


// GET /api/get-students/:collegeId/:departmentId
router.get("/get-students/:collegeId/:departmentId", (req, res) => {
  const { collegeId, departmentId } = req.params;

  const sql = `
    SELECT s.id, s.email, s.college_id, s.department_id, s.password_hash,
           c.name AS college_name,
           d.name AS department_name
    FROM students s
    LEFT JOIN colleges c ON s.college_id = c.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE s.college_id = ? AND s.department_id = ?
  `;

  db.all(sql, [collegeId, departmentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
