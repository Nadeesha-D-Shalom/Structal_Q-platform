const express = require('express');
const router = express.Router();
const concernController = require('./concern.controller');
const multer = require('multer');

const upload = multer();

// Create conern
router.post('/', upload.single('assessment_pdf'), concernController.createConcern);

// Get all concerns
router.get('/', concernController.getAllConcerns);

// Update concerm
router.put('/:id', concernController.updateConcern);

//Delete concern
router.delete('/:id', concernController.deleteConcern);

module.exports = router;