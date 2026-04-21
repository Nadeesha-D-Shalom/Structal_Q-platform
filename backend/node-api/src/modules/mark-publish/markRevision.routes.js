const express = require('express');
const router = express.Router();
const markRevisionController = require('./markRevision.controller');

//fetch all the mark audits
router.get('/audits/', markRevisionController.getAllMarkAudits);

//fetch all the marks 
router.get('/', markRevisionController.getPublishedMarks);

//update mark endpoint
router.put('/update', markRevisionController.updateMark);

//delete mark endpoint
router.delete('/delete/:submission_id', markRevisionController.deleteMark);

//generate marks report
router.get('/report', markRevisionController.generateMarksReport);

//generate audits report
router.get('/audits/report', markRevisionController.generateAuditsReport);

module.exports = router;