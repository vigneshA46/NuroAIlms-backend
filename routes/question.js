const express = require("express");
const router = express.Router();
const { addQuestion, getQuestionsByTestId, updateQuestion, deleteQuestion, getQuestionbyindex, bulkAddQuestions } = require("../controllers/quetionController");

// Add a question
router.post("/", addQuestion);

// Get all questions for a test
router.get("/:testId", getQuestionsByTestId);

// Update a question
router.put("/:id", updateQuestion);

// Delete a question
router.delete("/:id", deleteQuestion);

router.get('/:test_id/question/:index',getQuestionbyindex);

router.post('/bulk',bulkAddQuestions)

module.exports = router;
 