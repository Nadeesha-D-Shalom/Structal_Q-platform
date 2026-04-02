import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

/* AUTH */
import LoginPage from "./pages/auth/LoginPage";

/* STUDENT */
import StudentDashboard from "./pages/student/StudentDashboard";
import RaiseConcernForm from "./pages/student/RaiseConcernForm";
import StudentMarksList from "./pages/student/StudentsMarkList";
import StudentConcernsOverview from "./pages/student/ConcernOverview";

/* LECTURER */
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import PublishMarksConfig from "./pages/lecturer/MarkPublishingInterface";
import MarkRevisionAuditLog from "./pages/lecturer/MarkRevisionPanel";
import ConcernReviewResolution from "./pages/lecturer/ReviewConcern";

import LecturerSubmissions from "./pages/lecturer/LecturerSubmissions";
import ViewSubmission from "./pages/lecturer/ViewSubmission";

/* AI MODULE */
import MLAnalysisConfig from "./pages/lecturer/MLAnalysisConfig";
import MLAnalysisResult from "./pages/lecturer/MLAnalysisResult";
import SubmissionComparison from "./pages/lecturer/SubmissionComparison";
import ViewAnalysisResults from "./pages/lecturer/ViewAnalysisResults";
function App() {
  return (
    <Router>
      <Routes>

        {/* ================= AUTH ================= */}
        <Route path="/" element={<LoginPage />} />

        {/* ================= STUDENT ================= */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/student/marks" element={<StudentMarksList />} />
        <Route path="/student/concerns" element={<StudentConcernsOverview />} />

        {/* ================= LECTURER ================= */}
        <Route path="/lecturer" element={<LecturerDashboard />} />
        <Route path="/lecturer/publish-marks" element={<PublishMarksConfig />} />
        <Route path="/lecturer/marks" element={<MarkRevisionAuditLog />} />
        <Route path="/lecturer/review-concerns" element={<ConcernReviewResolution />} />

        {/* ================= SUBMISSIONS ================= */}
        <Route path="/lecturer/submissions" element={<LecturerSubmissions />} />
        <Route path="/lecturer/submissions/:id" element={<ViewSubmission />} />
        <Route path="/lecturer/view-submission" element={<ViewSubmission />} />

        {/* ================= AI ANALYSIS ================= */}
        <Route path="/lecturer/ml-analysis" element={<MLAnalysisConfig />} />
        <Route path="/lecturer/analysis/:id" element={<MLAnalysisResult />} />

        {/* IMPORTANT: MATCHES YOUR BUTTON */}
        <Route path="/lecturer/compareWithStudents" element={<SubmissionComparison />} />

        {/* OPTIONAL CLEAN ROUTE */}
        <Route path="/lecturer/submission-compare" element={<SubmissionComparison />} />

        <Route path="/analysis/:submissionId" element={<ViewAnalysisResults />} />
      </Routes>
    </Router>
  );
}

export default App;
