require("dotenv").config();

const express = require("express");
const app = require("./app");
const { poolConnect } = require("./config/db");
const { startConcernWindowScheduler } = require('./modules/concern/concernWindowAutomation');




const subjectRoutes = require('./modules/subject/subject.routes');
const assessmentRoutes = require('./modules/assessment/assessment.routes');
const markingGuideRoutes = require('./modules/marking-guide/markingGuide.routes');
const guideQuestionRoutes = require('./modules/guide-question/guideQuestion.routes');
const questionKeywordRoutes = require('./modules/question-keyword/questionKeyword.routes');
const guideRubricRoutes = require('./modules/guide-rubric/guideRubric.routes');


const concernRoutes = require('./modules/concern/concern.routes');
const markPublishRoutes = require('./modules/mark-publish/markPublish.routes');
const viewMarksRoutes = require('./modules/mark-publish/viewMarks.routes');
const markRevisionRoutes = require('./modules/mark-publish/markRevision.routes');

// AI module
const aiAnalysisRoutes = require('./modules/ai-analysis/aiAnalysis.routes');

const PORT = process.env.PORT || 5000;


// ===== DB CONNECTION =====
poolConnect
    .then(() => {
        console.log("✅ DB Connected Successfully");

        // Start scheduler
        startConcernWindowScheduler();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ Database connection failed:", err);
    });


// ===== ROUTES =====
app.use('/api/subjects', subjectRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/marking-guides', markingGuideRoutes);


app.use('/api/guide-questions', guideQuestionRoutes);
app.use('/api/question-keywords', questionKeywordRoutes);
app.use('/api/guide-rubric', guideRubricRoutes);


app.use('/api/concern', concernRoutes);
app.use('/api/marks', markPublishRoutes);
app.use('/api/student/marks', viewMarksRoutes);
app.use('/api/lecturer/marks', markRevisionRoutes);

// AI
app.use('/api/ai-analysis', aiAnalysisRoutes);


// ===== HEALTH =====
app.get('/health', (req, res) => {
    res.json({
        status: "Backend running",
        port: PORT
    });
});


// ===== ROOT =====
app.get('/', (req, res) => {
    res.send("StructaIQ Backend API running");
});


// ===== GLOBAL ERROR =====
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err.stack);

    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: err.message
    });
});