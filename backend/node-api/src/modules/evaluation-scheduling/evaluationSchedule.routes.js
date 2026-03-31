const express = require('express');
const router = express.Router();
const controller = require('./evaluationSchedule.controller');

//Location routes
router.post('/locations', controller.createLocation);
router.get('/locations', controller.getAllLocations);


//schedule routes
router.post('/schedules', controller.createSchedule);
router.post('/schedules/:id/publish', controller.publishSchedule);
router.put('/schedules/:id/cancel', controller.cancelSchedule);


//slot & group routes
router.post('/slots/:slotId/assign', controller.assignGroupToSlot);

//conflict routes
router.get('/schedules/:id/conflicts', controller.getConflicts);

module.exports = router;