import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UIFeedbackProvider } from "./components/UIFeedback/UIFeedbackProvider";

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
import EvaluationScheduling from "./pages/lecturer/EvaluationScheduling";
import LecturerTimetable from "./pages/lecturer/ExamTimetable";
import MarkingGuideManagement from "./pages/lecturer/MarkingGuideManagement";

import LecturerSubmissions from "./pages/lecturer/LecturerSubmissions";
import LecturerSubjects from "./pages/lecturer/LecturerSubjects";
import LecturerAssignments from "./pages/lecturer/LecturerAssignments";
import LecturerGroups from "./pages/lecturer/LecturerGroups";
import ViewSubmission from "./pages/lecturer/ViewSubmission";

/* AI MODULE */
import MLAnalysisConfig from "./pages/lecturer/MLAnalysisConfig";
import MLAnalysisPortal from "./pages/lecturer/MLAnalysisPortal";
import MLAnalysisResult from "./pages/lecturer/MLAnalysisResult";
import SubmissionComparison from "./pages/lecturer/SubmissionComparison";
import ViewAnalysisResults from "./pages/lecturer/ViewAnalysisResults";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentSubmissions from "./pages/student/StudentSubmissions";
import UserProfilePage from "./pages/common/UserProfilePage";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setStatus(res.ok ? "authenticated" : "unauthenticated");
      })
      .catch(() => setStatus("unauthenticated"));
  }, []);

  if (status === "checking") {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Checking session...</div>;
  }

  if (status !== "authenticated") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <UIFeedbackProvider>
    <Router>
      <Routes>

        {/* ================= AUTH ================= */}
        <Route path="/" element={<LoginPage />} />

        {/* ================= STUDENT ================= */}
        <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/raise-concern" element={<ProtectedRoute><RaiseConcernForm /></ProtectedRoute>} />
        <Route path="/student/marks" element={<ProtectedRoute><StudentMarksList /></ProtectedRoute>} />
        <Route path="/student/concerns" element={<ProtectedRoute><StudentConcernsOverview /></ProtectedRoute>} />
        <Route path="/student/timetable" element={<ProtectedRoute><StudentTimetable /></ProtectedRoute>} />
        <Route path="/student/submissions" element={<ProtectedRoute><StudentSubmissions /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

        {/* ================= LECTURER ================= */}
        <Route path="/lecturer" element={<ProtectedRoute><LecturerDashboard /></ProtectedRoute>} />
        <Route path="/lecturer/subjects" element={<ProtectedRoute><LecturerSubjects /></ProtectedRoute>} />
        <Route path="/lecturer/assignments" element={<ProtectedRoute><LecturerAssignments /></ProtectedRoute>} />
        <Route path="/lecturer/groups" element={<ProtectedRoute><LecturerGroups /></ProtectedRoute>} />
        <Route path="/lecturer/marking-guides" element={<ProtectedRoute><MarkingGuideManagement /></ProtectedRoute>} />
        <Route path="/lecturer/publish-marks" element={<ProtectedRoute><PublishMarksConfig /></ProtectedRoute>} />
        <Route path="/lecturer/marks" element={<ProtectedRoute><MarkRevisionAuditLog /></ProtectedRoute>} />
        <Route path="/lecturer/review-concerns" element={<ProtectedRoute><ConcernReviewResolution /></ProtectedRoute>} />
        <Route path="/lecturer/evaluation" element={<ProtectedRoute><EvaluationScheduling /></ProtectedRoute>} />
        <Route path="/lecturer/timetable" element={<ProtectedRoute><LecturerTimetable /></ProtectedRoute>} />
        <Route path="/lecturer/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

        {/* ================= SUBMISSIONS ================= */}
        <Route path="/lecturer/submissions" element={<ProtectedRoute><LecturerSubmissions /></ProtectedRoute>} />
        <Route path="/lecturer/submissions/:id" element={<ProtectedRoute><ViewSubmission /></ProtectedRoute>} />
        <Route path="/lecturer/view-submission" element={<ProtectedRoute><ViewSubmission /></ProtectedRoute>} />

        {/* ================= AI ANALYSIS ================= */}
        <Route path="/lecturer/ml-analysis" element={<ProtectedRoute><MLAnalysisConfig /></ProtectedRoute>} />
        <Route path="/lecturer/ml-portal" element={<ProtectedRoute><MLAnalysisPortal /></ProtectedRoute>} />
        <Route path="/lecturer/analysis/:id" element={<ProtectedRoute><MLAnalysisResult /></ProtectedRoute>} />

        {/* IMPORTANT: MATCHES YOUR BUTTON */}
        <Route path="/lecturer/compareWithStudents" element={<ProtectedRoute><SubmissionComparison /></ProtectedRoute>} />

        {/* OPTIONAL CLEAN ROUTE */}
        <Route path="/lecturer/submission-compare" element={<ProtectedRoute><SubmissionComparison /></ProtectedRoute>} />

        <Route path="/analysis/:submissionId" element={<ProtectedRoute><ViewAnalysisResults /></ProtectedRoute>} />
      </Routes>
    </Router>
    </UIFeedbackProvider>
  );
}

export default App;
