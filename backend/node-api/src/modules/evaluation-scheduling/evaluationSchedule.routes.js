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
router.get(   '/schedules',             controller.getSchedules);
router.patch( '/schedules/:id/publish', controller.publishSchedule);
router.patch( '/schedules/:id/cancel',  controller.cancelSchedule);

// ───────── SLOT + GROUP ASSIGNMENT ─────────
router.get( '/schedules/:id/slots',  controller.getSlotsBySchedule);
router.post('/slots/:slotId/assign', controller.assignGroupToSlot);

// ───────── CONFLICT LOG ─────────
router.get('/schedules/:id/conflicts',  controller.getConflicts);

// ───────── EMAIL NOTIFICATION LOG ─────────
router.get('/schedules/:id/email-logs', controller.getEmailLogs);

module.exports = router;
