const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const subjectRoutes = require('../modules/subject/subject.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const markingGuideRoutes = require('../modules/marking-guide/markingGuide.routes');
const concernRoutes = require('../modules/concern/concern.routes');
const markPublishRoutes =  require('../modules/mark-publish/markPublish.routes');
const aiAnalysisRoutes = require('../modules/ai-analysis/aiAnalysis.routes');
const viewMarksRoutes = require('../modules/mark-publish/viewMarks.routes');
const markRevisionRoutes = require('../modules/mark-publish/markRevision.routes');
const timetableRoutes = require('../modules/timetable/timetable.routes');
const evaluationSchedulingRoutes = require('../modules/evaluation-scheduling/evaluationSchedule.routes');
const submissionRoutes = require('../modules/submission/submission.routes');
const markComparisonRoutes = require('../modules/mark-comparison/markComparison.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

<<<<<<< HEAD
router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marking-guides', markingGuideRoutes);
router.use('/concerns', concernRoutes);
router.use('/timetable', timetableRoutes);
router.use('/evaluation-scheduling', evaluationSchedulingRoutes);
router.use('/marks', markPublishRoutes);
router.use('/student/marks', viewMarksRoutes);
router.use('/lecturer/marks', markRevisionRoutes);
router.use('/submissions', submissionRoutes);
router.use('/ai-analysis', aiAnalysisRoutes);
router.use('/mark-comparison', markComparisonRoutes);
=======
router.use('/subjects', verifyToken, subjectRoutes);
router.use('/assessments', verifyToken, assessmentRoutes);
router.use('/marking-guides', verifyToken, markingGuideRoutes);
router.use('/concerns', verifyToken, concernRoutes);
router.use('/timetable', verifyToken, timetableRoutes);
router.use('/evaluation-scheduling', verifyToken, evaluationRoutes);
router.use('/marks', verifyToken, markPublishRoutes);
router.use('/student/marks', verifyToken, viewMarksRoutes);
router.use('/submissions', verifyToken, submissionRoutes);
router.use('/ai-analysis', verifyToken, aiAnalysisRoutes);
router.use('/mark-comparison', verifyToken, markComparisonRoutes);
router.use('/dashboard', verifyToken, dashboardRoutes);
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)

module.exports = router;