const express = require("express");
const router = express.Router();
const {getStudentData , updateStudentData, createStudentDataForStudent} = require("../controllers/studentdatacontroller");

// GET student data by student_id
router.get("/:student_id", getStudentData);

// UPDATE student data by student_id (partial update)
router.put("/:student_id", updateStudentData);

router.post("/",createStudentDataForStudent)

module.exports = router;
 