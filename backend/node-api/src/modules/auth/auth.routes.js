const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");

router.post("/login", controller.login);
router.get("/session", controller.session);
router.post("/logout", controller.logout);

module.exports = router;