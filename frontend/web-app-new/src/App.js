import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import RaiseConcernForm from "./pages/student/RaiseConcernForm";
import PublishMarksConfig from "./pages/lecturer/MarkPublishingInterface";
import StudentMarksList from "./pages/student/StudentsMarkList";
import MarkRevisionAuditLog from "./pages/lecturer/MarkRevisionPanel";
import ConcernReviewResolution from "./pages/lecturer/ReviewConcern";
import StudentConcernsOverview from "./pages/student/ConcernOverview";
import EvaluationScheduling from "./pages/lecturer/EvaluationScheduling";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/lecturer" element={<LecturerDashboard />} />
        <Route path="/student/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/lecturer/publish-marks" element={<PublishMarksConfig />} />
        <Route path="/student/marks" element={<StudentMarksList />} />
        <Route path="/lecturer/marks" element={<MarkRevisionAuditLog />} />
        <Route path="/lecturer/review-concerns" element={<ConcernReviewResolution />} />
        <Route path="/student/concerns" element={<StudentConcernsOverview />} />
        {/* Member 05 - Evaluation Scheduling */}
        <Route path="/lecturer/evaluation" element={<EvaluationScheduling />} />
      </Routes>
    </Router>
  );
}

export default App;
