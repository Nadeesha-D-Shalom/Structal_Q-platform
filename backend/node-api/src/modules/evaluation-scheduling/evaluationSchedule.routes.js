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
router.delete('/locations/:id/hard', controller.hardDeleteLocation);

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

// ───────── DELETE SCHEDULE ─────────
router.delete('/schedules/:id', controller.deleteSchedule);

// ───────── STUDENT VIEW ─────────
router.get('/student/schedules', controller.getStudentScheduleView);

module.exports = router;
