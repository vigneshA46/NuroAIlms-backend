const express = require("express");
const router = express.Router();
const { createCollege, getColleges, deleteCollege, getCollegeById } = require("../controllers/collegesController");

// Create a college
router.post("/", createCollege);

// Get all colleges
router.get("/", getColleges);

router.get('/:id',getCollegeById)

// Delete a college
router.delete("/:id", deleteCollege);

module.exports = router;
 