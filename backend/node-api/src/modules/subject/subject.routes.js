const express = require('express');
const router = express.Router();
const subjectController = require('./subject.controller');

router.post('/', subjectController.createSubject);
router.get('/', subjectController.getSubjects);
/** Must be before /:id so "offerings" is not parsed as an id */
router.get('/offerings', subjectController.listSubjectOfferings);
router.post('/offerings', subjectController.createSubjectOffering);
router.get('/:id', subjectController.getSubjectById);
router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;