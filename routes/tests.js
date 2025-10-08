const express = require("express");
const router = express.Router();
const {
  createTest,
  getAllTests,
  getTestsByCollege,
  assignDepartmentsToTest,
  getDepartmentsForTest,
  deleteTest,
  getSingleTestDetails,
  getTestsByCollegeAndDepartment
} = require("../controllers/testsController");

// Create a new test
router.post("/", createTest);

// Get all tests
router.get("/", getAllTests);

// Get tests by college
router.get("/college/:collegeId", getTestsByCollege);

// Assign test to multiple departments
router.post("/:testId/departments", assignDepartmentsToTest);

// Get departments assigned to a test
router.get("/:testId/departments", getDepartmentsForTest);

// Delete a test
router.delete("/:id", deleteTest);

router.get('/:id',getSingleTestDetails)

router.get('/college/:collegeId/department/:departmentId',getTestsByCollegeAndDepartment)

module.exports = router;
 