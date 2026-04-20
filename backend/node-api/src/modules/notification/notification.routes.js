const express = require("express");
const router = express.Router();
const notificationController = require('../notification/notification.controller');

// Get all notifications
router.get('/student/:student_id', notificationController.getAllNotifications);

// Get unread count
router.get('/student/:student_id/unread-count', notificationController.getUnreadCount);

// Update status
router.put('/:notification_id/read', notificationController.UpdateStatus);

// Handle Read All 
router.put('/student/:student_id/read-all', notificationController.setReadAll);

module.exports = router;