const express = require("express");
const router = express.Router();
const {
  submitTest,
  getStudentSubmissions,
  getSubmissionDetails,
  submitCodingChallenge,
  getCodingSubmissions,
  checkTestAttempt,
  getStudentResult,
  getAllCodingSubmissions
} = require("../controllers/submissionsController");

// MCQ Test Submissions
router.post("/test", submitTest);               // student submits test
router.get("/student/:id", getStudentSubmissions); // all submissions of a student
router.get("/test/:id", getSubmissionDetails);     // get details of a test submission

// Coding Challenge Submissions
router.post("/coding", submitCodingChallenge);       // submit code
router.get("/coding/student/:id", getCodingSubmissions); // get coding submissions of student
router.get("/:testId/student/:studentId/attempted",checkTestAttempt);
router.get("/:testId/student/:studentId/result",getStudentResult)
router.get("/submission/:challengeid",getAllCodingSubmissions)

module.exports = router;
