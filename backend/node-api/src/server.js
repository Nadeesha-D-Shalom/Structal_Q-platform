

const express = require('express');
const sql = require('mssql');
const config = require('./config/db');   
const cors = require("cors"); 

const subjectRoutes = require('./modules/subject/subject.routes');
const assessmentRoutes = require('./modules/assessment/assessment.routes');
const markingGuideRoutes = require('./modules/marking-guide/markingGuide.routes');
const evaluationRoutes = require('./modules/evaluation-scheduling/evaluationSchedule.routes');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

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
app.use('/api/evaluation-scheduling', evaluationRoutes);

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


