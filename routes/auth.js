const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

// POST /api/student-login
router.post("/student-login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT * FROM students WHERE email = ?";
  db.get(sql, [email], (err, student) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!student) return res.status(401).json({ error: "Invalid email or password" });

    // Directly compare plain text password
    if (password !== student.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      student: {
        id: student.id,
        email: student.email,
        college_id: student.college_id,
        department_id: student.department_id,
      }
    });
  });
});

module.exports = router;

 