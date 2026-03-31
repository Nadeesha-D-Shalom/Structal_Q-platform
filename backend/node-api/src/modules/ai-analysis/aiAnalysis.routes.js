const express = require("express");
const router = express.Router();

const { analyzeSubmission } = require("./aiAnalysis.controller");

router.post("/analyze", analyzeSubmission);

module.exports = router;