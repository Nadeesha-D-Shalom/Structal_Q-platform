const express = require("express");
const router = express.Router();
const ctrl = require("./notification.controller");

router.get("/", ctrl.list);
router.get("/unread-count", ctrl.unreadCount);
router.patch("/:id/read", ctrl.markRead);
router.post("/read-all", ctrl.markAllRead);

module.exports = router;
