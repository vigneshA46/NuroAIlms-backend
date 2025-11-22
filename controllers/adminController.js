const pool = require("../db"); // PostgreSQL pool connection

// --------------------
// Admin Dashboard API
// --------------------
exports.getAdminDashboard = async (req, res) => {
  try {
    const stats = {};

    // 1️⃣ Total Students
    const totalStudents = await pool.query(`SELECT COUNT(*) AS total_students FROM students`);
    stats.total_students = parseInt(totalStudents.rows[0].total_students) || 0;

    // 2️⃣ Total Colleges
    const totalColleges = await pool.query(`SELECT COUNT(*) AS total_colleges FROM colleges`);
    stats.total_colleges = parseInt(totalColleges.rows[0].total_colleges) || 0;

    // 3️⃣ Total Departments
    const totalDepartments = await pool.query(`SELECT COUNT(*) AS total_departments FROM departments`);
    stats.total_departments = parseInt(totalDepartments.rows[0].total_departments) || 0;

    // 4️⃣ Total Tests
    const totalTests = await pool.query(`SELECT COUNT(*) AS total_tests FROM tests`);
    stats.total_tests = parseInt(totalTests.rows[0].total_tests) || 0;

    // 5️⃣ Total Coding Challenges
    const totalChallenges = await pool.query(`SELECT COUNT(*) AS total_challenges FROM coding_challenges`);
    stats.total_challenges = parseInt(totalChallenges.rows[0].total_challenges) || 0;

    // 6️⃣ AI Reviewed Coding Submissions
    const aiReviewed = await pool.query(`SELECT COUNT(*) AS ai_reviewed FROM coding_submissions WHERE ai_score IS NOT NULL`);
    stats.ai_reviewed_submissions = parseInt(aiReviewed.rows[0].ai_reviewed) || 0;

    // 7️⃣ Average AI Score
    const avgScore = await pool.query(`SELECT AVG(ai_score) AS avg_ai_score FROM coding_submissions WHERE ai_score IS NOT NULL`);
    stats.avg_ai_score = avgScore.rows[0].avg_ai_score
      ? parseFloat(avgScore.rows[0].avg_ai_score).toFixed(2)
      : 0;

    // 8️⃣ Active Tests (current date between start_date and end_date)
    const activeTests = await pool.query(`
      SELECT COUNT(*) AS active_tests
      FROM tests
      WHERE NOW() BETWEEN start_date AND end_date
    `);
    stats.active_tests = parseInt(activeTests.rows[0].active_tests) || 0;

    // ✅ Return final stats
    res.json(stats);
  } catch (err) {
    console.error("Error fetching dashboard data:", err.message);
    res.status(500).json({ error: err.message });
  }
};
