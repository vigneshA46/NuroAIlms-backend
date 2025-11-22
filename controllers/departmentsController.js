const pool = require("../db");

// ✅ Create Department
exports.createDepartment = async (req, res) => {
  try {
    const { name, college_id } = req.body;
    if (!name || !college_id) {
      return res.status(400).json({ error: "name and college_id are required" });
    }

    const result = await pool.query(
      "INSERT INTO departments (name, college_id) VALUES ($1, $2) RETURNING id",
      [name, college_id]
    );

    res.json({ message: "Department created", id: result.rows[0].id });
  } catch (err) {
    console.error("Error creating department:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get All Departments
exports.getDepartments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, c.name AS college_name
      FROM departments d
      LEFT JOIN colleges c ON d.college_id = c.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching departments:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Departments by College ID
exports.getDepartmentsByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const result = await pool.query(
      `
      SELECT d.*, c.name AS college_name
      FROM departments d
      LEFT JOIN colleges c ON d.college_id = c.id
      WHERE d.college_id = $1
      ORDER BY d.created_at DESC
      `,
      [collegeId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching departments by college:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, college_id } = req.body;

    if (!name && !college_id) {
      return res
        .status(400)
        .json({ error: "At least one field (name or college_id) required" });
    }

    const result = await pool.query(
      `
      UPDATE departments
      SET name = COALESCE($1, name),
          college_id = COALESCE($2, college_id)
      WHERE id = $3
      RETURNING *
      `,
      [name || null, college_id || null, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Department not found" });

    res.json({ message: "Department updated" });
  } catch (err) {
    console.error("Error updating department:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM departments WHERE id = $1", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Department not found" });

    res.json({ message: "Department deleted" });
  } catch (err) {
    console.error("Error deleting department:", err.message);
    res.status(500).json({ error: err.message });
  }
};
