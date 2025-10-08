const db = require("../db");

// ✅ Create Department
exports.createDepartment = (req, res) => {
  const { name, college_id } = req.body;
  if (!name || !college_id) {
    return res.status(400).json({ error: "name and college_id are required" });
  }

  const sql = "INSERT INTO departments (name, college_id) VALUES (?, ?)";
  db.run(sql, [name, college_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Department created", id: this.lastID });
  });
};

// ✅ Get All Departments
exports.getDepartments = (req, res) => {
  const sql = `
    SELECT d.*, c.name AS college_name
    FROM departments d
    LEFT JOIN colleges c ON d.college_id = c.id
    ORDER BY d.created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// ✅ Get Departments by College ID
exports.getDepartmentsByCollege = (req, res) => {
  const { collegeId } = req.params;
  const sql = `
    SELECT d.*, c.name AS college_name
    FROM departments d
    LEFT JOIN colleges c ON d.college_id = c.id
    WHERE d.college_id = ?
    ORDER BY d.created_at DESC
  `;
  db.all(sql, [collegeId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// ✅ Update Department
exports.updateDepartment = (req, res) => {
  const { id } = req.params;
  const { name, college_id } = req.body;

  if (!name && !college_id) {
    return res.status(400).json({ error: "At least one field (name or college_id) required" });
  }

  const sql = `
    UPDATE departments
    SET name = COALESCE(?, name),
        college_id = COALESCE(?, college_id)
    WHERE id = ?
  `;
  db.run(sql, [name, college_id, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Department not found" });
    res.json({ message: "Department updated" });
  });
};

// ✅ Delete Department
exports.deleteDepartment = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM departments WHERE id = ?";
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Department not found" });
    res.json({ message: "Department deleted" });
  });
};


