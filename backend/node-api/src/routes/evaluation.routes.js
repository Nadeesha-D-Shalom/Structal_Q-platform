const express = require("express");
const router = express.Router();
const controller = require("../modules/evaluationSchedule/evaluation.controller");

router.post("/generate", controller.createSchedule);

module.exports = router;