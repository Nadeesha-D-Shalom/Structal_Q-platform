const express = require('express');
const router = express.Router();
const marksController = require('./markPublish.controller');

// Get all assessments for the dropdown
router.get("/assessments", marksController.getAllAssessments);

// Get submissions that haven't been published yet for a specific assessment
router.get("/pending-submissions", marksController.getPendingSubmissions);

// Get the PDF file of student submission or marking guide
router.get("/pdf/:submission_id", marksController.getPdf);

//Save the calculated final mark in the evaluated marks table before publishing
router.post("/evaluated-results/save", marksController.saveEvaluatedResults);

//Get the CSV file with pending marks for publication for mark publish ui
router.get("/export-csv/:assessment_id", marksController.exportPendingMarksCSV);

// Final POST request to publish the marks to the database
router.post("/publish", marksController.bulkPublishMarks);


module.exports = router;