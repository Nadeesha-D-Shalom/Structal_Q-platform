const express = require("express");
const router = express.Router();
const viewMarksController = require("./viewMarks.controller");

// Get marks for student view
router.get('/:student_id', viewMarksController.getMarks);

//Get stats
router.get('/stats/:student_id', viewMarksController.getStats);

//Get all subjects list for filter option in view marks
router.get('/subjects', viewMarksController.getAllSubjects);

//Get details in selected column for raise concern form
router.get('/details', viewMarksController.getDetailsForConcernForm);

module.exports = router;