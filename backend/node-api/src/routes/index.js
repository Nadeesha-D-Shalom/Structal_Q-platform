const express = require('express');
const router = express.Router();

const subjectRoutes = require('../modules/subject/subject.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const markingGuideRoutes = require('../modules/marking-guide/markingGuide.routes');
const concernRoutes = require('../modules/concern/concern.routes');
const timetableRoutes = require('../modules/exam-timetable/routes/examTimetable.routes');
const markPublishRoutes = require('../modules/mark-publish/markPublish.routes');
const aiAnalysisRoutes = require("../modules/ai-analysis/aiAnalysis.routes");
const evaluationScheduleRoutes = require('../modules/evaluation-scheduling/evaluationSchedule.routes');

router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marking-guides', markingGuideRoutes);
router.use('/concern', concernRoutes);
router.use('/timetable', timetableRoutes);
router.use('/evaluation', evaluationScheduleRoutes);
router.use("/ai-analysis", aiAnalysisRoutes);
router.use('/marks', markPublishRoutes);


module.exports = router;