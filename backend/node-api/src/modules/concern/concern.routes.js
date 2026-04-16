const express = require('express');
const router = express.Router();
const concernController = require('./concern.controller');
<<<<<<< HEAD
=======

// Create concern
router.post('/', concernController.createConcern);
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)

// Get all concerns
router.get('/', concernController.getAllConcerns);

<<<<<<< HEAD
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
=======
// Get concerns for a specific student
router.get('/student/:student_id', concernController.getConcernsByStudent);

// Update concern
router.put('/:id', concernController.updateConcern);

// Delete concern
router.delete('/:id', concernController.deleteConcern);
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)

module.exports = router;