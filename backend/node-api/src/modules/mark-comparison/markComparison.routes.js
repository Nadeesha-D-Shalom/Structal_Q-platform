const express = require("express");
const router = express.Router();

const { compareMarks } = require("./markComparison.controller");

router.post("/compare", compareMarks);

module.exports = router;