import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import RaiseConcernForm from "./pages/student/RaiseConcernForm";
import PublishMarksConfig from "./pages/lecturer/MarkPublishingInterface";
<<<<<<< HEAD
=======
<<<<<<< HEAD
import StudentMarksList from "./pages/student/StudentsMarkList";
import MarkRevisionAuditLog from "./pages/lecturer/MarkRevisionPanel";
import ConcernReviewResolution from "./pages/lecturer/ReviewConcern";
import StudentConcernsOverview from "./pages/student/ConcernOverview";
=======
>>>>>>> 728836d (this is backend part)
>>>>>>> main

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/lecturer" element={<LecturerDashboard />} />
<<<<<<< HEAD
        <Route path="/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/publish-marks" element={<PublishMarksConfig />} />
=======
<<<<<<< HEAD
        <Route path="/student/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/lecturer/publish-marks" element={<PublishMarksConfig />} />
        <Route path="/student/marks" element={<StudentMarksList />} />
        <Route path="/lecturer/marks" element={<MarkRevisionAuditLog />} />
        <Route path="/lecturer/review-concerns" element={<ConcernReviewResolution />} />
        <Route path="/student/concerns" element={<StudentConcernsOverview />} />
=======
        <Route path="/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/publish-marks" element={<PublishMarksConfig />} />

        <Route path="/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/publish-marks" element={<PublishMarksConfig />} />
>>>>>>> 728836d (this is backend part)
>>>>>>> main
      </Routes>
    </Router>
  );
}

export default App;
