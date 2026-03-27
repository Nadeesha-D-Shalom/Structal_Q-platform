const express = require('express');
const router = express.Router();

const subjectRoutes = require('../modules/subject/subject.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const markingGuideRoutes = require('../modules/marking-guide/markingGuide.routes');
const concernRoutes = require('../modules/concern/concern.routes')
<<<<<<< Updated upstream
=======
const aiAnalysisRoutes = require("../modules/ai-analysis/aiAnalysis.routes");
const MarkPublishRoutes = require('./modules/mark-publish/markPublish.routes')

>>>>>>> Stashed changes

router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marking-guides', markingGuideRoutes);
router.use('/concern', concernRoutes);
<<<<<<< Updated upstream
=======
router.use("/ai-analysis", aiAnalysisRoutes);
router.use('/marks', MarkPublishRoutes);


// Member 05 - Evaluation
const evaluationRoutes = require('../modules/evaluation/evaluation.routes');
router.use('/evaluation', evaluationRoutes);
>>>>>>> Stashed changes

module.exports = router;