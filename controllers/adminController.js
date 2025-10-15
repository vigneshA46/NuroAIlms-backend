const db = require("../db");

// --------------------
// Admin Dashboard API
// --------------------
exports.getAdminDashboard = (req, res) => {
  Promise.all([

    // 1️⃣ Overview metrics
    new Promise((resolve, reject) => {
      db.get(
        `
        SELECT
          (SELECT COUNT(*) FROM students) AS total_students,
          (SELECT COUNT(*) FROM colleges) AS total_colleges,
          (SELECT COUNT(*) FROM tests WHERE datetime(end_date) >= datetime('now')) AS active_mcq_tests,
          (SELECT COUNT(*) FROM coding_challenges WHERE datetime(end_date) >= datetime('now')) AS active_coding_challenges,
          (SELECT COUNT(*) FROM test_submissions) + (SELECT COUNT(*) FROM coding_submissions) AS total_submissions,
          ROUND((SELECT AVG(score) FROM coding_submissions WHERE score IS NOT NULL), 2) AS average_ai_score
        `,
        (err, row) => (err ? reject(err) : resolve(row))
      );
    }),

    // 2️⃣ Test participation (recent 7 days)
    new Promise((resolve, reject) => {
      db.all(
        `SELECT date(submitted_at) AS date, COUNT(*) AS participants
         FROM test_submissions
         GROUP BY date(submitted_at)
         ORDER BY date(submitted_at) DESC LIMIT 7`,
        (err, rows) => (err ? reject(err) : resolve(rows.reverse()))
      );
    }),

    // 3️⃣ Department average scores (top 5)
    new Promise((resolve, reject) => {
      db.all(
        `SELECT d.name AS department, ROUND(AVG(ts.score),1) AS avg_score
         FROM test_submissions ts
         JOIN students s ON s.id = ts.student_id
         JOIN departments d ON d.id = s.department_id
         GROUP BY d.id
         ORDER BY avg_score DESC
         LIMIT 5`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    }),

    // 4️⃣ Coding submissions per college
    new Promise((resolve, reject) => {
      db.all(
        `SELECT c.name AS college, COUNT(cs.id) AS submissions
         FROM coding_submissions cs
         JOIN students s ON s.id = cs.student_id
         JOIN colleges c ON c.id = s.college_id
         GROUP BY c.id
         ORDER BY submissions DESC
         LIMIT 5`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    }),

    // 5️⃣ Recent coding submissions
    new Promise((resolve, reject) => {
      db.all(
        `SELECT s.email AS student_email, ch.title AS challenge_title, cs.score, cs.submitted_at
         FROM coding_submissions cs
         JOIN students s ON s.id = cs.student_id
         JOIN coding_challenges ch ON ch.id = cs.challenge_id
         ORDER BY cs.submitted_at DESC
         LIMIT 5`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    }),

    // 6️⃣ Recent tests created
    new Promise((resolve, reject) => {
      db.all(
        `SELECT t.title, c.name AS college_name, t.created_at
         FROM tests t
         JOIN colleges c ON c.id = t.college_id
         ORDER BY t.created_at DESC
         LIMIT 5`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    }),

    // 7️⃣ Newly joined students
    new Promise((resolve, reject) => {
      db.all(
        `SELECT s.email AS name, c.name AS college, s.created_at AS joined_at
         FROM students s
         LEFT JOIN colleges c ON c.id = s.college_id
         ORDER BY s.created_at DESC
         LIMIT 5`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    }),

    // 8️⃣ Top performing students in coding
    new Promise((resolve, reject) => {
      db.all(
        `SELECT s.email AS student, ROUND(AVG(cs.score),1) AS avg_score
         FROM coding_submissions cs
         JOIN students s ON s.id = cs.student_id
         GROUP BY s.id
         ORDER BY avg_score DESC
         LIMIT 3`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    }),

    // 9️⃣ Language performance (if language column exists)
    new Promise((resolve, reject) => {
      db.all(
        `SELECT language, ROUND(AVG(score),1) AS avg_score
         FROM coding_submissions
         WHERE score IS NOT NULL
         GROUP BY language
         ORDER BY avg_score DESC`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    })
  ])
    .then(
      ([
        overview,
        testParticipation,
        deptAvgScores,
        codingByCollege,
        recentSubmissions,
        recentTests,
        newStudents,
        topStudents,
        langPerformance
      ]) => {
        res.json({
          overview,
          charts: {
            test_participation: testParticipation,
            department_average_scores: deptAvgScores,
            coding_challenge_submissions: codingByCollege
          },
          recent: {
            submissions: recentSubmissions,
            tests_created: recentTests,
            new_students: newStudents
          },
          ai_insights: {
            top_performing_students: topStudents,
            language_performance: langPerformance
          }
        });
      }
    )
    .catch((error) => {
      console.error("❌ Dashboard Controller Error:", error);
      res.status(500).json({ error: error });
    });
};
