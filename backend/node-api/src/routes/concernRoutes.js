const express = require('express');
const router = express.Router();
const multer = require('multer');
const concernController = require('../modules/concernController');

//for memory storage (save pdf as a binary value in db)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

//Endpoints
router.post('/submit-concern', upload.single('assesment_pdf'), concernController.createConcern);
//router.patch('/:id/update-status', concernController.updateConcernStatus);

module.exports = router;