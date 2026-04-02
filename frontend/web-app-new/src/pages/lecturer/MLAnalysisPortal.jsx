import LecturerNavbar from "./LecturerNavbar";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const MLAnalysisPortal = () => {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [guides, setGuides] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGuide, setSelectedGuide] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [subRes, guideRes, submissionRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/subjects`),
        fetch(`${API_BASE_URL}/api/marking-guides`),
        fetch(`${API_BASE_URL}/api/submission/lecturer/all`)
      ]);

      const subjectsData = await subRes.json();
      const guidesData = await guideRes.json();
      const submissionsData = await submissionRes.json();

      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setGuides(Array.isArray(guidesData) ? guidesData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);

    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedGuide || !selectedSubmission) {
      alert("Please select marking guide and submission");
      return;
    }

    setLoading(true);

    try {
      const guide = guides.find(
        g => Number(g.marking_guide_id) === Number(selectedGuide)
      );

      const submission = submissions.find(
        s => Number(s.submission_id) === Number(selectedSubmission)
      );

      if (!guide || !submission) {
        alert("Invalid selection. Please try again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: Number(selectedSubmission),
          marking_guide_id: Number(selectedGuide),
          submission_path: submission.submission_path,
          guide_file: guide.file_path,
        }),
      });

      const result = await res.json();

      if (result.success) {
        navigate(`/lecturer/compare-guide?analysis_id=${result.analysis_result_id}`);
      } else {
        alert("Analysis failed: " + result.error);
      }

    } catch (err) {
      console.error("Analysis error:", err);
      alert("Network error while running analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f8fb] min-h-screen">
      <LecturerNavbar activePage="Submissions" />

      <div className="p-8">
        <h1 className="text-[24px] font-bold text-[#1c2b3a] mb-6">
          ML Analysis Intelligence Portal
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border p-6">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[16px] font-semibold text-gray-800">
                Run Analysis Configuration
              </h2>
              <p className="text-[12px] text-gray-400 mt-1">
                Select the parameters below to trigger the intelligence processing engine.
              </p>
            </div>

            <div className="px-4 py-1 rounded-full text-[11px] bg-green-100 text-green-600 font-medium">
              ● Engine Ready
            </div>
          </div>

          {/* FORM */}
          <div className="grid grid-cols-2 gap-6">

            {/* SUBJECT */}
            <div>
              <p className="text-[12px] text-gray-500 mb-2">Subject</p>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-[44px] bg-[#f4f6f9] rounded-xl px-4 text-sm w-full"
              >
                <option value="">— Select Subject —</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* GUIDE */}
            <div>
              <p className="text-[12px] text-gray-500 mb-2">Marking Guide</p>
              <select
                value={selectedGuide}
                onChange={(e) => setSelectedGuide(e.target.value)}
                className="h-[44px] bg-[#f4f6f9] rounded-xl px-4 text-sm w-full"
              >
                <option value="">— Select Guide —</option>
                {guides
                  .filter(g => !selectedSubject || Number(g.subject_id) === Number(selectedSubject))
                  .map((g) => (
                    <option key={g.marking_guide_id} value={g.marking_guide_id}>
                      {g.guide_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* SUBMISSION */}
            <div>
              <p className="text-[12px] text-gray-500 mb-2">Submission</p>
              <select
                value={selectedSubmission}
                onChange={(e) => setSelectedSubmission(e.target.value)}
                className="h-[44px] bg-[#f4f6f9] rounded-xl px-4 text-sm w-full"
              >
                <option value="">— Select Submission —</option>
                {submissions
                  .filter(s => !selectedSubject || Number(s.subject_id) === Number(selectedSubject))
                  .map((s) => (
                    <option key={s.submission_id} value={s.submission_id}>
                      {s.original_file_name} (Group {s.group_name})
                    </option>
                  ))}
              </select>
            </div>

          </div>

          {/* BUTTON */}
          <div className="flex flex-col items-center mt-10">
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="px-10 py-3 rounded-full bg-blue-600 text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Running Analysis..." : "RUN ANALYSIS"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MLAnalysisPortal;