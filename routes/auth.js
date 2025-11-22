const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");

const router = express.Router();

// POST /api/student-login
router.post("/student-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // First: get student account data
    const sql = "SELECT * FROM students WHERE email = $1";
    const result = await pool.query(sql, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const student = result.rows[0];

    // Password check (plain text)
    if (password !== student.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Second: get additional profile info from studentdata
    const dataSql = "SELECT * FROM studentdata WHERE student_id = $1";
    const dataResult = await pool.query(dataSql, [student.id]);

    const extraData = dataResult.rows[0] || null; // in case no data exists

    // Final response
    res.json({
      message: "Login successful",
      student: {
        id: student.id,
        email: student.email,
        college_id: student.college_id,
        department_id: student.department_id,
        ...extraData // merged additional details
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
