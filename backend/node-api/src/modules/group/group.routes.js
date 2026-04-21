const express = require("express");
const router = express.Router();
const ctrl = require("./group.controller");

router.get("/assessment/:assessmentId", ctrl.listByAssessment);
router.post("/", ctrl.create);
router.post("/:groupId/members", ctrl.addMember);
router.delete("/:groupId/members/:studentId", ctrl.removeMember);
router.get("/:groupId", ctrl.getOne);
router.delete("/:groupId", ctrl.deleteGroup);

module.exports = router;
