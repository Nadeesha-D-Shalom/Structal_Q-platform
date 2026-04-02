const express = require('express');
const router = express.Router();

// MODULE ROUTES
const subjectRoutes = require('../modules/subject/subject.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const markingGuideRoutes = require('../modules/marking-guide/markingGuide.routes');
const concernRoutes = require('../modules/concern/concern.routes');
const timetableRoutes = require('../modules/timetable/timetable.routes');
const evaluationScheduleRoutes = require('../modules/evaluation-scheduling/evaluationSchedule.routes');
const markPublishRoutes = require('../modules/mark-publish/markPublish.routes');
const viewMarksRoutes = require('../modules/mark-publish/viewMarks.routes');
const submissionRoutes = require('../modules/submission/submission.routes');
const aiAnalysisRoutes = require('../modules/ai-analysis/aiAnalysis.routes');
const markComparisonRoutes = require('../modules/mark-comparison/markComparison.routes');

// ROUTES
router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marking-guides', markingGuideRoutes);


// Member 05 - Evaluation
const evaluationRoutes = require('../modules/evaluation-scheduling/evaluationSchedule.routes');
router.use('/evaluation-scheduling', evaluationRoutes);
router.use('/concerns', concernRoutes);

router.use('/timetable', timetableRoutes);
router.use('/evaluation', evaluationScheduleRoutes);

router.use('/marks', markPublishRoutes);
router.use('/student/marks', viewMarksRoutes);

router.use('/submissions', submissionRoutes);

router.use('/ai-analysis', aiAnalysisRoutes);
router.use('/mark-comparison', markComparisonRoutes);

module.exports = router;
