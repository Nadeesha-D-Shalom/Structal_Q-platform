const express = require("express");
const router = express.Router();
const controller = require("./timetable.controller");

// GET ALL TIMETABLES
router.get("/", controller.getAllTimetables);

// CREATE TIMETABLE
router.post("/", controller.createTimetable);

// GET TIMETABLE BY ID
router.get("/:id", controller.getTimetableById);

// UPDATE TIMETABLE
router.put("/:id", controller.updateTimetable);

// PUBLISH TIMETABLE
router.patch("/:id/publish", controller.publishTimetable);

// DELETE TIMETABLE
router.delete("/:id", controller.deleteTimetable);

// GET SESSIONS FOR TIMETABLE
router.get("/:id/sessions", controller.getSessions);

// CREATE SESSION
router.post("/:id/sessions", controller.createSession);

// UPDATE SESSION
router.put("/:id/sessions/:sessionId", controller.updateSession);

// DELETE SESSION
router.delete("/:id/sessions/:sessionId", controller.deleteSession);

// GET CONFLICTS
router.get("/:id/conflicts", controller.getConflicts);

// STUDENT VIEW
router.get("/student/view", controller.getStudentTimetableView);

module.exports = router;