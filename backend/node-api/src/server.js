const express = require('express');
require('dotenv').config();

const { poolConnect } = require('./config/db');

// KEEP ONLY WORKING MODULES
const subjectRoutes = require('./modules/subject/subject.routes');
const assessmentRoutes = require('./modules/assessment/assessment.routes');
const markingGuideRoutes = require('./modules/marking-guide/markingGuide.routes');
const concernRoutes = require('./modules/concern/concern.routes');
const markPublishRoutes = require('./modules/mark-publish/markPublish.routes');
const viewMarksRoutes = require('./modules/mark-publish/viewMarks.routes');

// (MAIN FOCUS)
const aiAnalysisRoutes = require('./modules/ai-analysis/aiAnalysis.routes');

const app = express();
const PORT = process.env.PORT || 5000;


// ================= MIDDLEWARE =================
app.use(express.json());


// ================= DATABASE =================
poolConnect
    .then(() => console.log("DB Connected Successfully"))
    .catch(err => console.error("Database connection failed:", err));


// ================= ROUTES =================

// Other stable modules
app.use('/api/subjects', subjectRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/marking-guides', markingGuideRoutes);
app.use('/api/concern', concernRoutes);
app.use('/api/marks', markPublishRoutes);
app.use('/api/student/marks', viewMarksRoutes);

// AI MODULE
app.use('/api/ai-analysis', aiAnalysisRoutes);


// ================= HEALTH =================
app.get('/health', (req, res) => {
    res.json({
        status: "Backend running",
        port: PORT
    });
});


// ================= ROOT =================
app.get('/', (req, res) => {
    res.send("StructaIQ Backend API running");
});


// ================= ERROR =================
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err.stack);

    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: err.message
    });
});


// ================= START =================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});