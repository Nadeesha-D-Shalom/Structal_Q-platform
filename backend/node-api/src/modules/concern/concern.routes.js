const express = require('express');
const router = express.Router();
const concernController = require('./concern.controller');

router.get('/student/:studentId', concernController.getConcernsByStudent);

// Get all concerns
router.get('/', concernController.getAllConcerns);

//Get concerns for specific user id
router.get('/:student_id', concernController.getConcernsForSpecificStudent);

//Create conern
router.post('/', concernController.createConcern);

//Update concerm
router.put('/:concern_id/respond', concernController.updateConcern);

//Delete concern
router.delete('/:concern_id', concernController.deleteConcern);

//Export as a pdf
router.post('/export-pdf', concernController.exportConcernsToPDF);

module.exports = router;