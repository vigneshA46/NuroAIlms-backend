const pool = require("../db"); // PostgreSQL connection pool

// ------------------------
// Create College
// ------------------------
exports.createCollege = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const result = await pool.query(
      "INSERT INTO colleges (name) VALUES ($1) RETURNING id, name",
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------
// Get All Colleges
// ------------------------
exports.getColleges = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM colleges ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------
// Get College by ID
// ------------------------
exports.getCollegeById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM colleges WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "College not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------
// Delete College
// ------------------------
exports.deleteCollege = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM colleges WHERE id = $1", [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "College not found" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
