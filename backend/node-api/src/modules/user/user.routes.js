const express = require("express");
const { verifyToken } = require("../../middleware/authMiddleware");
const controller = require("./user.controller");

const router = express.Router();

router.get("/me", verifyToken, controller.getMyProfile);
router.get("/me/modules", verifyToken, controller.getMyModules);
router.put("/me/password", verifyToken, controller.changeMyPassword);
router.post("/", verifyToken, controller.createUser);

module.exports = router;
