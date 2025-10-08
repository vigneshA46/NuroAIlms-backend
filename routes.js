const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const router = express.Router();

/**
 * 1. Create College
 * Endpoint: /create-college
 */
router.post("/create-college", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const sql = "INSERT INTO colleges (name) VALUES (?)";
  db.run(sql, [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "College created", collegeId: this.lastID });
  });
});

/**
 * 2. Create Department
 * Endpoint: /create-department
 */
router.post("/create-department", (req, res) => {
  console.log("Incoming body:", req.body);
  const { name, college_id } = req.body;
  if (!name || !college_id) {
    return res.status(400).json({ error: "Name and college_id are required" });
  }

  const sql = "INSERT INTO departments (name, college_id) VALUES (?, ?)";
  db.run(sql, [name, college_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Department created", departmentId: this.lastID });
  });
});

/**
 * 3. Create Student
 * Endpoint: /create-student
 */
router.post("/create-student", async (req, res) => {
  const { email, password, college_id, department_id } = req.body;
  if (!email || !password || !college_id || !department_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const password_hash = password

    const sql = `
      INSERT INTO students (email, password_hash, college_id, department_id)
      VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [email, password_hash, college_id, department_id], function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Student created", studentId: this.lastID });
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/colleges
router.get("/get-colleges", (req, res) => {
  const sql = "SELECT * FROM colleges";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// GET /api/departments
router.get("/get-departments", (req, res) => {
  const sql = `
    SELECT d.id, d.name, d.college_id, c.name AS college_name
    FROM departments d
    LEFT JOIN colleges c ON d.college_id = c.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/departments/:collegeId
router.get("/get-departments/:collegeId", (req, res) => {
  const { collegeId } = req.params;
  const sql = `
    SELECT d.id, d.name, d.college_id, c.name AS college_name
    FROM departments d
    LEFT JOIN colleges c ON d.college_id = c.id
    WHERE d.college_id = ?
  `;
  db.all(sql, [collegeId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});



// GET /api/students
router.get("/get-students", (req, res) => {
  const sql = `
    SELECT s.id, s.email, s.password_hash, s.college_id, s.department_id,
           c.name AS college_name,
           d.name AS department_name
    FROM students s
    LEFT JOIN colleges c ON s.college_id = c.id
    LEFT JOIN departments d ON s.department_id = d.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});






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
