import LecturerNavbar from "./LecturerNavbar";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { appToast } from "../../components/UIFeedback/appNotify";

const API_BASE_URL = process.env.REACT_APP_API_URL || "";

const MLAnalysisPortal = () => {
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [subjects, setSubjects] = useState([]);
  const [guides, setGuides] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGuide, setSelectedGuide] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState("");

  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [subRes, guideRes, submissionRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/subjects`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/marking-guides`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/submissions/lecturer/all`, { headers: getAuthHeaders() }),
      ]);

      const subjectsData = await subRes.json();
      const guidesData = await guideRes.json();
      const submissionsData = await submissionRes.json();

      // Subjects: API returns a plain array. Marking guides: { success, data: [] }. Submissions: plain array.
      const subjectsList = Array.isArray(subjectsData)
        ? subjectsData
        : Array.isArray(subjectsData?.data)
          ? subjectsData.data
          : [];
      const guidesList = Array.isArray(guidesData)
        ? guidesData
        : Array.isArray(guidesData?.data)
          ? guidesData.data
          : [];
      const submissionsList = Array.isArray(submissionsData)
        ? submissionsData
        : Array.isArray(submissionsData?.data)
          ? submissionsData.data
          : [];

      setSubjects(subjectsList);
      setGuides(guidesList);
      setSubmissions(submissionsList);

    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRunAnalysis = async () => {
    if (!selectedGuide || !selectedSubmission) {
      appToast("Please select marking guide and submission", "warning");
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
        appToast("Invalid selection. Please try again.", "warning");
        setLoading(false);
        return;
      }

      const guidePath = guide.guide_file_path || guide.storage_path;
      if (!guidePath) {
        appToast("Selected marking guide has no file path. Re-upload the guide or pick another guide.", "warning");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          submission_id: Number(selectedSubmission),
          marking_guide_id: Number(selectedGuide),
          submission_path: submission.storage_path,
          guide_file: guidePath,
        }),
      });

      const result = await res.json();

      if (result.success && result.analysis_result_id) {
        navigate(`/analysis/${result.analysis_result_id}`, {
          state: { analysis_result_id: result.analysis_result_id, fromMlPortal: true },
        });
      } else {
        appToast("Analysis failed: " + (result.error || result.message || "Unknown error"), "error");
      }

    } catch (err) {
      console.error("Analysis error:", err);
      appToast("Network error while running analysis", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f8fb] min-h-screen">
      <LecturerNavbar />

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
                      {s.original_file_name} (Student {s.student_id})
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