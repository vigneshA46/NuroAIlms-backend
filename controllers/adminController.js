const db = require("../db");

// --------------------
// Admin Dashboard API
// --------------------
exports.getAdminDashboard = (req, res) => {
  const stats = {};

  // 1️⃣ Total Students
  db.get(`SELECT COUNT(*) AS total_students FROM students`, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.total_students = row.total_students;

    // 2️⃣ Total Colleges
    db.get(`SELECT COUNT(*) AS total_colleges FROM colleges`, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.total_colleges = row.total_colleges;

      // 3️⃣ Total Departments
      db.get(`SELECT COUNT(*) AS total_departments FROM departments`, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.total_departments = row.total_departments;

        // 4️⃣ Total Tests
        db.get(`SELECT COUNT(*) AS total_tests FROM tests`, (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.total_tests = row.total_tests;

          // 5️⃣ Total Coding Challenges
          db.get(`SELECT COUNT(*) AS total_challenges FROM coding_challenges`, (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.total_challenges = row.total_challenges;

            // 6️⃣ AI Reviewed Coding Submissions
            db.get(`SELECT COUNT(*) AS ai_reviewed FROM coding_submissions WHERE ai_score IS NOT NULL`, (err, row) => {
              if (err) return res.status(500).json({ error: err.message });
              stats.ai_reviewed_submissions = row.ai_reviewed;

              // 7️⃣ Average AI Score
              db.get(`SELECT AVG(ai_score) AS avg_ai_score FROM coding_submissions WHERE ai_score IS NOT NULL`, (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.avg_ai_score = row.avg_ai_score ? parseFloat(row.avg_ai_score.toFixed(2)) : 0;

                // 8️⃣ Active Tests (current date between start_date and end_date)
                db.get(
                  `SELECT COUNT(*) AS active_tests FROM tests WHERE datetime('now') BETWEEN start_date AND end_date`,
                  (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.active_tests = row.active_tests;

                    // 9️⃣ Return final stats
                    res.json(stats);
                  }
                );
              });
            });
          });
        });
      });
    });
  });};
