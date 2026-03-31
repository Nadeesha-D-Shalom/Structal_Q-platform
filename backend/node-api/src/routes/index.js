const express = require('express');
const router = express.Router();

const subjectRoutes = require('../modules/subject/subject.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const markingGuideRoutes = require('../modules/marking-guide/markingGuide.routes');
const concernRoutes = require('../modules/concern/concern.routes');
const timetableRoutes = require('./timetableRoutes');

router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marking-guides', markingGuideRoutes);
router.use('/concern', concernRoutes);
router.use('/timetable', timetableRoutes);

// Member 05 - Evaluation scheduling
const evaluationScheduleRoutes = require('../modules/evaluation-scheduling/evaluationSchedule.routes');
router.use('/evaluation', evaluationScheduleRoutes);

module.exports = router;