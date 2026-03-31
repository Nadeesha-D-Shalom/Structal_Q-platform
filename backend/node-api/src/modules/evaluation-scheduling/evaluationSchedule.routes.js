const express    = require('express');
const router     = express.Router();
const controller = require('./evaluationSchedule.controller');

// ───────── ASSESSMENTS ─────────
router.get('/assessments', controller.getAllAssessments);

// ───────── LOCATION ─────────
router.post(  '/locations',     controller.createLocation);
router.get(   '/locations',     controller.getAllLocations);
router.put(   '/locations/:id', controller.updateLocation);
router.delete('/locations/:id', controller.deleteLocation);

// ───────── SCHEDULE ─────────
router.post(  '/schedules',             controller.createSchedule);
router.put(   '/schedules/:id',         controller.updateSchedule);
router.get(   '/schedules',             controller.getSchedules);
router.patch( '/schedules/:id/publish', controller.publishSchedule);
router.patch( '/schedules/:id/cancel',  controller.cancelSchedule);

// ───────── SLOT + GROUP ASSIGNMENT ─────────
router.get( '/schedules/:id/slots',  controller.getSlotsBySchedule);
router.post('/slots/:slotId/assign', controller.assignGroupToSlot);

// ───────── CONFLICT LOG ─────────
router.get('/schedules/:id/conflicts', controller.getConflicts);

// ───────── EMAIL NOTIFICATION LOG ─────────
router.get( '/schedules/:id/email-logs',    controller.getEmailLogs);

// ───────── DELETE SCHEDULE ─────────
router.delete('/schedules/:id', controller.deleteSchedule);

// ───────── RETRY FAILED EMAILS ─────────
// Retries all FAILED entries in evaluation_email_log for a given schedule
router.post('/schedules/:id/retry-emails', controller.retryFailedEmails);

// ───────── STUDENT VIEW ─────────
router.get('/student/schedules', controller.getStudentScheduleView);

module.exports = router;
