const express = require('express');
const router = express.Router();
const controller = require('./assessment.controller');

router.post('/', controller.createAssessment);
router.get('/', controller.getAssessments);
/** Student lab portal — must be registered before /:id */
router.get('/student/labs', controller.getStudentLabAssignments);
router.get('/:id', controller.getAssessmentById);
router.put('/:id', controller.updateAssessment);
router.delete('/:id', controller.deleteAssessment);

module.exports = router;