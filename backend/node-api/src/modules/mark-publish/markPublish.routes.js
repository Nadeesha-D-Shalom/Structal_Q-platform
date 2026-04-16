const express = require('express');
const router = express.Router();
const marksController = require('./markPublish.controller');

// Get all assessments for the dropdown
router.get("/assessments", marksController.getAllAssessments);

// Get submissions that haven't been published yet for a specific assessment
router.get("/pending-submissions", marksController.getPendingSubmissions);

// Get the PDF file of student submission or marking guide
router.get("/pdf/:submission_id", marksController.getPdf);

<<<<<<< HEAD
//Save the calculated final mark in the evaluated marks table before publishing
router.post("/evaluated-results/save", marksController.saveEvaluatedResults);
=======
// Get published marks for audit and revision
router.get("/published-marks", marksController.getPublishedMarks);

// Update a published mark after review
router.put("/update-mark", marksController.updatePublishedMark);

// Delete a published mark and archive the revision reason
router.delete("/delete-mark/:submission_id", marksController.deletePublishedMark);

// Get the AI calculated marks 
router.get("/ai-scores/:submission_id", marksController.getAiScores);
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)

//Get the CSV file with pending marks for publication for mark publish ui
router.get("/export-csv/:assessment_id", marksController.exportPendingMarksCSV);

// Final POST request to publish the marks to the database
router.post("/publish", marksController.bulkPublishMarks);


// CONCERN WINDOW MANAGEMENT
router.post("/concern-windows", marksController.createConcernWindow);
router.get("/concern-windows", marksController.getConcernWindows);
router.get("/concern-windows/:id", marksController.getConcernWindowById);
router.put("/concern-windows/:id", marksController.updateConcernWindow);
router.delete("/concern-windows/:id", marksController.deleteConcernWindow);

// STUDENT CONCERNS
router.post("/concerns", marksController.raiseConcern);
router.get("/concerns", marksController.getConcerns);
router.put("/concerns/:id/resolve", marksController.resolveConcern);

module.exports = router;