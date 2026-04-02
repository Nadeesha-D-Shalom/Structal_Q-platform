import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";

import SubjectPage from "./modules/subject/SubjectPage";
import AssessmentPage from "./modules/Assessment/AssessmentPage";
import GuidePage from "./modules/marking-guide/GuidePage";

import GuideBuilderPage from "./modules/marking-guide/GuideBuilderPage";
import GuidePreviewPage from "./modules/marking-guide/GuidePreviewPage";

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<LoginPage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/lecturer" element={<LecturerDashboard />} />

        <Route path="/subjects" element={<SubjectPage />} />
        <Route path="/assessments" element={<AssessmentPage />} />
        <Route path="/guides" element={<GuidePage />} />

        <Route path="/guide-builder/:id" element={<GuideBuilderPage />} />
        <Route path="/guide-preview/:id" element={<GuidePreviewPage />} />

      </Routes>
    </Router>
  );
}

export default App;