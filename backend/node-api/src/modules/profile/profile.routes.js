const express = require("express");
const router = express.Router();
const ctrl = require("./profile.controller");
const { requireRole } = require("../../middleware/authMiddleware");

router.get("/me", ctrl.getMe);
router.post("/change-password", ctrl.changePassword);
router.post("/users", requireRole(["lecturer"]), ctrl.createUser);

module.exports = router;
