const express = require("express");
const router = express.Router();
const viewMarksController = require("./viewMarks.controller");

<<<<<<< HEAD
=======
//Get all subjects list for filter option in view marks
router.get('/subjects', viewMarksController.getAllSubjects);

>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
//Get stats
router.get('/stats/:student_id', viewMarksController.getStats);

//Get details in selected column for raise concern form
router.get('/details/:submission_id', viewMarksController.getDetailsForConcernForm);

// Get marks for student view
router.get('/:student_id', viewMarksController.getMarks);

// Get marks for student view
router.get('/:student_id', viewMarksController.getMarks);

//pdf export
router.post('/export-pdf', viewMarksController.exportMarksToPDF);


module.exports = router;