const express = require('express');
const router = express.Router();

const subjectRoutes = require('../modules/subject/subject.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const markingGuideRoutes = require('../modules/marking-guide/markingGuide.routes');
const concernRoutes = require('../modules/concern/concern.routes');
const markPublishRoutes = require('../modules/mark-publish/markPublish.routes');
const viewMarksRoutes = require('../modules/mark-publish/viewMarks.routes');
const aiAnalysisRoutes = require('../modules/ai-analysis/aiAnalysis.routes');
const evaluationScheduleRoutes = require('../modules/evaluation-scheduling/evaluationSchedule.routes');

// Exam timetable routes depend on middleware/authMiddleware.js; keep disabled here until that file exists again.
// const timetableRoutes = require('../modules/exam-timetable/routes/examTimetable.routes');

router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marking-guides', markingGuideRoutes);
router.use('/concern', concernRoutes);
router.use('/marks', markPublishRoutes);
router.use('/student/marks', viewMarksRoutes);
router.use('/ai-analysis', aiAnalysisRoutes);
router.use('/evaluation-scheduling', evaluationScheduleRoutes);

module.exports = router;
