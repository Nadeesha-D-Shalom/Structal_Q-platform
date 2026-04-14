const express = require("express");
const router = express.Router();
const controller = require("./timetable.controller");

// GET ALL TIMETABLES
router.get("/", controller.getAllTimetables);

module.exports = router;