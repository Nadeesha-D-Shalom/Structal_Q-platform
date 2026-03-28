const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./submission.controller');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 20 * 1024 * 1024 }
});

router.post('/upload', upload.single('file'), controller.uploadSubmission);
router.get('/student/:id', controller.getStudentSubmissions);
router.get('/:id/ai-metadata', controller.getAIMetadata);
router.delete('/:id', controller.softDeleteSubmission);

module.exports = router;