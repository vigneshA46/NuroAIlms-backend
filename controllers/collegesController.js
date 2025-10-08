const db = require("../db");

// Create college
exports.createCollege = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  db.run("INSERT INTO colleges (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
};

// Get colleges
exports.getColleges = (req, res) => {
  db.all("SELECT * FROM colleges", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Get single college by ID
exports.getCollegeById = (req, res) => {
  const { id } = req.params;

  const sql = `SELECT * FROM colleges WHERE id = ?`;

  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "College not found" });

    res.json(row);
  });
};

// Delete college
exports.deleteCollege = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM colleges WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "College not found" });
    res.json({ success: true });
  });
};
