import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";

<<<<<<< Updated upstream
=======
import RaiseConcernForm from "./pages/student/RaiseConcernForm";
import PublishMarksConfig from "./pages/lecturer/MarkPublishingInterface";
>>>>>>> Stashed changes

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/lecturer" element={<LecturerDashboard />} />

<<<<<<< Updated upstream
=======
        <Route path="/raise-concern" element={<RaiseConcernForm />} />
        <Route path="/publish-marks" element={<PublishMarksConfig />} />
>>>>>>> Stashed changes
      </Routes>
    </Router>
  );
}

export default App;