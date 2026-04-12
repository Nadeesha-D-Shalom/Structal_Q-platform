const express = require("express");
const router = express.Router();
const marksController = require("./markPublish.controller");
const viewMarksController = require("./viewMarks.controller");

// Get all assessments for the dropdown
router.get("/assessments", marksController.getAllAssessments);

// Alias for Raise Concern / clients expecting /api/marks/details/:submission_id
router.get("/details/:submission_id", viewMarksController.getDetailsForConcernForm);

// Get submissions that haven't been published yet for a specific assessment
router.get("/pending-submissions", marksController.getPendingSubmissions);

// Get the PDF file stream for the viewer
router.get("/pdf/:submission_id", marksController.getPdf);

// Get the AI calculated marks 
router.get("/ai-scores/:submission_id", marksController.getAiScores);

//Get the pages containing diagrams for manual review
router.get("/diagram-pages/:submission_id", marksController.getDiagramPages);

// Final POST request to publish the marks to the database
router.post("/publish", marksController.publishingleMark);

router.get("/published-marks", marksController.getPublishedMarks);
router.put("/update-mark", marksController.updatePublishedMark);
router.delete("/delete-mark/:submission_id", marksController.deletePublishedMark);

module.exports = router;