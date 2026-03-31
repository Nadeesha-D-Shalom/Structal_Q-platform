const express = require('express');
const router = express.Router();

const subjectRoutes = require('../modules/subject/subject.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const markingGuideRoutes = require('../modules/marking-guide/markingGuide.routes');
const concernRoutes = require('../modules/concern/concern.routes')

const markPublishRoutes =  require('../modules/mark-publish/markPublish.routes')
const aiAnalysisRoutes = require('./modules/ai-analysis/aiAnalysis.routes');
const viewMarksRoutes = require('./modules/mark-publish/viewMarks.routes');

router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marking-guides', markingGuideRoutes);
router.use('/concern', concernRoutes);
router.use("/ai-analysis", aiAnalysisRoutes);
router.use('/marks', markPublishRoutes);
router.use('/student/marks', viewMarksRoutes);

// Member 05 - Evaluation
const evaluationRoutes = require('../modules/evaluation/evaluation.routes');
router.use('/evaluation', evaluationRoutes);


module.exports = router;