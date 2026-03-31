const express = require('express');
const router = express.Router();

const subjectRoutes = require('../modules/subject/subject.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const markingGuideRoutes = require('../modules/marking-guide/markingGuide.routes');

router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marking-guides', markingGuideRoutes);


// Member 05 - Evaluation
const evaluationRoutes = require('../modules/evaluation-scheduling/evaluationSchedule.routes');
router.use('/evaluation-scheduling', evaluationRoutes);

module.exports = router;
