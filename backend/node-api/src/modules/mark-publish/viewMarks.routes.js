const express = require("express");
const router = express.Router();
const viewMarksController = require("./viewMarks.controller");

// Static paths MUST be registered before /:student_id
router.get("/subjects", viewMarksController.getAllSubjects);
router.get("/details/:submission_id", viewMarksController.getDetailsForConcernForm);
router.get("/stats/:student_id", viewMarksController.getStats);
router.get("/:student_id", viewMarksController.getMarks);

module.exports = router;
