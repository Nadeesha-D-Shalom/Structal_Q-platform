const express = require('express');
const router = express.Router();
const concernController = require('./concern.controller');
const EmailServices = require('./EmailService');

// Get all concerns
router.get('/', concernController.getAllConcerns);

//Get concerns for specific user id
router.get('/:student_id', concernController.getConcernsForSpecificStudent);

//Create concern
router.post('/', concernController.createConcern);

//Update concern
router.put('/:concern_id/respond', concernController.updateConcern);

//Delete concern
router.delete('/:concern_id', concernController.deleteConcern);

//Export as a pdf
router.post('/export-pdf', concernController.exportConcernsToPDF);

//Email Sender
router.post('/send-response-email', EmailServices);

module.exports = router;
