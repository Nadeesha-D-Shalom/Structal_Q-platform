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
        <Route path="/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/publish-marks" element={<PublishMarksConfig />} />
        <Route path="/view" element={<TimetableRoleView />} />
        <Route path="/create" element={<CreateTimetable />} />
        <Route path="/lecturer-view" element={<LecturerViewTimetable />} />
        <Route path="/student-view" element={<StudentViewTimetable />} />
        <Route path="/edit/:id" element={<EditTimetable />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
