import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import RaiseConcernForm from "./pages/student/RaiseConcernForm";
import PublishMarksConfig from "./pages/lecturer/MarkPublishingInterface";
import CreateTimetable from "./pages/lecturer/CreateTimetable";
import EditTimetable from "./pages/lecturer/EditTimetable";
import LecturerViewTimetable from "./pages/lecturer/LecturerViewTimetable";
import StudentViewTimetable from "./pages/student/StudentViewTimetable";
import StudentMarksList from "./pages/student/StudentsMarkList";
import MarkRevisionAuditLog from "./pages/lecturer/MarkRevisionPanel";
import ConcernReviewResolution from "./pages/lecturer/ReviewConcern";
import StudentConcernsOverview from "./pages/student/ConcernOverview";

function resolveUserRole() {
  const directRole =
    localStorage.getItem("role") ||
    localStorage.getItem("userRole") ||
    localStorage.getItem("user_type");

  if (directRole) return String(directRole).toLowerCase();

  const rawUser = localStorage.getItem("user");
  if (!rawUser) return "";

  try {
    const parsed = JSON.parse(rawUser);
    return String(parsed?.role || parsed?.userRole || parsed?.type || "").toLowerCase();
  } catch {
    return "";
  }
}

function TimetableRoleView() {
  const role = resolveUserRole();
  const isStudent = role.includes("student");
  return isStudent ? <StudentViewTimetable /> : <LecturerViewTimetable />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/lecturer" element={<LecturerDashboard />} />

        {/* Concerns & marks — canonical paths (navbars) + legacy short paths */}
        <Route path="/student/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/lecturer/publish-marks" element={<PublishMarksConfig />} />
        <Route path="/publish-marks" element={<PublishMarksConfig />} />
        <Route path="/student/marks" element={<StudentMarksList />} />
        <Route path="/lecturer/marks" element={<MarkRevisionAuditLog />} />
        <Route path="/lecturer/review-concerns" element={<ConcernReviewResolution />} />
        <Route path="/student/concerns" element={<StudentConcernsOverview />} />

        {/* Timetable */}
        <Route path="/view" element={<TimetableRoleView />} />
        <Route path="/create" element={<CreateTimetable />} />
        <Route path="/lecturer-view" element={<LecturerViewTimetable />} />
        <Route path="/student-view" element={<StudentViewTimetable />} />
        <Route path="/student/timetable" element={<StudentViewTimetable />} />
        <Route path="/lecturer/timetable" element={<LecturerViewTimetable />} />
        <Route path="/edit/:id" element={<EditTimetable />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
