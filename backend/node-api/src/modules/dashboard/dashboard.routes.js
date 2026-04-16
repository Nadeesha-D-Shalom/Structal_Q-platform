const express = require("express");
const router = express.Router();
const controller = require("./dashboard.controller");

// Lecturer + student dashboard summaries (no email sending, no hashing, lecturer/student focused)
router.get("/lecturer/summary", controller.getLecturerDashboardSummary);
router.get("/student/summary", controller.getStudentDashboardSummary);

module.exports = router;

