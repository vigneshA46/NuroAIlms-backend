const express = require("express");
const router = express.Router();
const {
  createDepartment,
  getDepartments,
  getDepartmentsByCollege,
  updateDepartment,
  deleteDepartment
} = require("../controllers/departmentsController");

// Create Department


router.post("/", createDepartment);


// Get All Departments
router.get("/:id", getDepartments);

// Get Departments by College ID
router.get("/college/:collegeId", getDepartmentsByCollege);

// Update Department (edit name or college_id)
router.put("/:id", updateDepartment);

// Delete Department
router.delete("/:id", deleteDepartment);

module.exports = router;

