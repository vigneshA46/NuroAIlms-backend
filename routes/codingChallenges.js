// codingChallenges.js (CommonJS)
const express = require("express");
const axios = require("axios");
const { createCodingChallenge, updateCodingChallenge, deleteCodingChallenge, getAllCodingChallenges, getCodingChallenge, getStudentCodingChallenges, isCodingChallengeAttempted, submitCodingChallengeCode, evaluateCodingChallengeSubmission, getStudentCodingSubmissionResult, getCollegeCodingChallenges, getDepartmentCodingChallenges } = require("../controllers/codingChallengesController");

const router = express.Router();


// --------------------
// Admin Routes
// --------------------

// Create a new coding challenge
router.post("/admin/create", createCodingChallenge);

// Update a coding challenge
router.put("/admin/update/:id", updateCodingChallenge);

// Delete a coding challenge
router.delete("/admin/delete/:id", deleteCodingChallenge);

// Get all coding challenges (optionally can filter by college or department)
router.get("/admin/all", getAllCodingChallenges);

// Get a single coding challenge details
router.get("/admin/:id", getCodingChallenge);

// get coding challenges allocated for a college
router.get("/admin/college/:college_id", getCollegeCodingChallenges);


// --------------------
// Student Routes
// --------------------

// Get all coding challenges allocated to a student
router.get("/student/:student_id", getStudentCodingChallenges);

// Check if student already attempted a challenge
router.get("/student/:challenge_id/:student_id/attempted", isCodingChallengeAttempted);

// Submit code for a challenge
router.post("/student/submit", submitCodingChallengeCode);

// Evaluate a submission (can be admin triggered or AI triggered)
router.put("/student/evaluate/:submission_id", evaluateCodingChallengeSubmission);

// Get a student's result for a challenge
router.get("/student/:challenge_id/:student_id/result", getStudentCodingSubmissionResult);

router.get("/student/department/:department_id",getDepartmentCodingChallenges);






router.post("/run", async (req, res) => {
  const { code, language } = req.body;

  const langMap = { python: 71, cpp: 54, java: 62 };

  try {
    const submission = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: langMap[language],
      },
      {
        headers: {
          "X-RapidAPI-Key": "1f68e199e3mshcef6d8b90f5f208p10ad62jsn4ca44d32d418",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    res.json(submission.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Execution failed" });
  }
});

module.exports = router;
