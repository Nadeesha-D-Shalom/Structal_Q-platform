const express = require("express");
const router = express.Router();
const controller = require("./timetable.controller");

// Static paths MUST be registered before "/:id" so "student", "rooms" are not captured as ids.
router.get("/", controller.getAllTimetables);
router.post("/", controller.createTimetable);

router.get("/rooms", controller.getExamRooms);
router.get("/student/view", controller.getStudentTimetableView);

router.patch("/:id/publish", controller.publishTimetable);
router.delete("/:id", controller.deleteTimetable);

router.get("/:id/sessions", controller.getSessions);
router.post("/:id/sessions", controller.createSession);
router.put("/:id/sessions/:sessionId", controller.updateSession);
router.delete("/:id/sessions/:sessionId", controller.deleteSession);

router.get("/:id/conflicts", controller.getConflicts);

router.put("/:id", controller.updateTimetable);
router.get("/:id", controller.getTimetableById);

module.exports = router;
