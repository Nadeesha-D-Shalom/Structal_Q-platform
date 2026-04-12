const express = require("express");
require("dotenv").config();

const { poolConnect } = require("./config/db");

const authRoutes = require("./modules/auth/auth.routes");
const subjectRoutes = require("./modules/subject/subject.routes");
const assessmentRoutes = require("./modules/assessment/assessment.routes");
const markingGuideRoutes = require("./modules/marking-guide/markingGuide.routes");
const concernRoutes = require("./modules/concern/concern.routes");
const markPublishRoutes = require("./modules/mark-publish/markPublish.routes");
const viewMarksRoutes = require("./modules/mark-publish/viewMarks.routes");
const submissionRoutes = require("./modules/submission/submission.routes");
const aiAnalysisRoutes = require("./modules/ai-analysis/aiAnalysis.routes");
const examTimetableRoutes = require("./modules/exam-timetable/routes/examTimetable.routes");
const evaluationScheduleRoutes = require("./modules/evaluation-scheduling/evaluationSchedule.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — required when frontend uses absolute REACT_APP_API_URL (e.g. http://localhost:5000)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, role, X-Requested-With"
    );
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());

poolConnect
    .then(() => console.log("DB Connected Successfully"))
    .catch((err) => console.error("Database connection failed:", err));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/marking-guides", markingGuideRoutes);
app.use("/api/concern", concernRoutes);
app.use("/api/marks", markPublishRoutes);
app.use("/api/student/marks", viewMarksRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/ai-analysis", aiAnalysisRoutes);
app.use("/api/timetable", examTimetableRoutes);
app.use("/api/evaluation-scheduling", evaluationScheduleRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "Backend running",
        port: PORT,
    });
});

app.get("/", (req, res) => {
    res.send("StructaIQ Backend API running");
});

app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: err.message,
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
