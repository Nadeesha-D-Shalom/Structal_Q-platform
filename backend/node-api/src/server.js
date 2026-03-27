const express = require('express');
const cors = require('cors');

const subjectRoutes = require('./modules/subject/subject.routes');
const assessmentRoutes = require('./modules/assessment/assessment.routes');
const markingGuideRoutes = require('./modules/marking-guide/markingGuide.routes');
const guideQuestionRoutes = require('./modules/guide-question/guideQuestion.routes');
const questionKeywordRoutes = require('./modules/question-keyword/questionKeyword.routes');


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ROUTES
app.use('/api/subjects', subjectRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/marking-guides', markingGuideRoutes);
app.use('/api/guide-questions', guideQuestionRoutes);
app.use('/api/question-keywords', questionKeywordRoutes);

app.get('/health', (req, res) => {
    res.json({ status: "Backend running" });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});