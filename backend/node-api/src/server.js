const express = require('express');
const sql = require('mssql');
const config = require('./config/db');   

const subjectRoutes = require('./modules/subject/subject.routes');
const assessmentRoutes = require('./modules/assessment/assessment.routes');
const markingGuideRoutes = require('./modules/marking-guide/markingGuide.routes');
<<<<<<< Updated upstream
const concernRoutes = require('./modules/concern/concern.routes')
=======
const concernRoutes = require('./modules/concern/concern.routes');
const MarkPublishRoutes = require('./modules/mark-publish/markPublish.routes')

// (MAIN FOCUS)
const aiAnalysisRoutes = require('./modules/ai-analysis/aiAnalysis.routes');
>>>>>>> Stashed changes

const app = express();
const PORT = 3000;

app.use(express.json());

// Database Connection
sql.connect(config)
    .then(() => {
        console.log("Database connected successfully!");
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });

// Routes (Professional Version)
app.use('/api/subjects', subjectRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/marking-guides', markingGuideRoutes);
app.use('/api/concern', concernRoutes);
app.use('/api/marks', MarkPublishRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: "Backend running",
        database: "Connected",
        port: PORT
    });
});

// Root
app.get('/', (req, res) => {
    res.send("StructaIQ Backend API is running");
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});