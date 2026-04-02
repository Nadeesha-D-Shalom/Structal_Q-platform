import { useEffect, useState } from "react";
import LecturerNavbar from "./LecturerNavbar";
import { useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_BASE = import.meta.env.REACT_APP_API_URL || "http://localhost:5000";

const LecturerSubmissions = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/submission/lecturer/all`);
      const result = await res.json();

      console.log("SUBMISSIONS API RESPONSE:", result);

      // HANDLE BOTH STRUCTURES
      if (Array.isArray(result)) {
        setData(result);
      }
      else if (result.success && Array.isArray(result.data)) {
        setData(result.data);
      }
      else {
        setData([]);
      }

    } catch (err) {
      console.error("Fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== HELPERS ===================== */

  const getSimilarity = (val) => {
    if (!val) return { text: "0%", color: "bg-gray-100 text-gray-500" };

    const percent = Math.round(val * 100);

    if (percent < 30)
      return { text: `${percent}% Low`, color: "bg-green-100 text-green-600" };

    if (percent < 70)
      return { text: `${percent}% Medium`, color: "bg-yellow-100 text-yellow-600" };

    return { text: `${percent}% High`, color: "bg-red-100 text-red-600" };
  };

  const getRisk = (score) => {
    if (!score) return { text: "PASSED", color: "bg-green-500" };

    if (score > 0.8) return { text: "CRITICAL", color: "bg-red-500" };
    if (score > 0.5) return { text: "REVIEW", color: "bg-yellow-500" };

    return { text: "PASSED", color: "bg-green-500" };
  };

  /* ===================== NAVIGATION ===================== */

  const handleView = (id) => {
    navigate(`/lecturer/submissions/${id}`);
  };

  const handleAnalyze = (row) => {
    navigate("/lecturer/ml-analysis", {
      state: {
        submission_id: row.submission_id,
        marking_guide_id: row.marking_guide_id || 1,
        submission_path: row.storage_path,
        guide_file: row.guide_path || ""
      }
    });
  };

  const handleCompare = (row) => {
    navigate(`/analysis/${row.submission_id}`, {
      state: {
        submission_id: row.submission_id,
        file_id: row.file_id,
        file_name: row.original_file_name,
        storage_path: row.storage_path
      }
    });
  };

  return (
    <div className="bg-[#f6f8fb] min-h-screen">
      <LecturerNavbar activePage="Submissions" />

      <div className="p-8">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-[24px] font-bold text-[#1f2d3d]">
            ML-Enhanced Submissions
          </h1>
          <p className="text-gray-500 text-sm">
            AI-powered evaluation, similarity detection, and risk analysis
          </p>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-2xl shadow border overflow-hidden">

          {/* TABLE HEADER */}
          <div className="grid grid-cols-7 px-6 py-4 text-xs text-gray-400 border-b font-semibold">
            <div>GROUP</div>
            <div>SUBMISSION</div>
            <div>VERSION</div>
            <div>STATUS</div>
            <div>SIMILARITY</div>
            <div>ML RISK</div>
            <div className="text-right">ACTIONS</div>
          </div>

          {/* TABLE BODY */}
          {loading ? (
            <div className="p-6 text-gray-400">Loading...</div>
          ) : data.length === 0 ? (
            <div className="p-6 text-gray-400">No submissions found</div>
          ) : (
            data.map((row, index) => {
              const sim = getSimilarity(row.similarity_avg);
              const risk = getRisk(row.risk_score);

              return (
                <div
                  key={row.submission_id}
                  className="grid grid-cols-7 px-6 py-4 items-center text-sm border-b hover:bg-gray-50 transition"
                >
                  {/* GROUP */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      G{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">
                        Group {index + 1}
                      </div>
                      <div className="text-xs text-gray-400">
                        Submission #{row.submission_id}
                      </div>
                    </div>
                  </div>

                  {/* FILE */}
                  <div className="flex items-center gap-2 text-gray-700">
                    <i className="fa-regular fa-file text-gray-400"></i>
                    {row.original_file_name}
                  </div>

                  {/* VERSION */}
                  <div>
                    <span className="px-3 py-1 text-xs bg-gray-100 rounded-full text-gray-600">
                      v{row.attempt_no || 1}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    On-Time
                  </div>

                  {/* SIMILARITY */}
                  <div>
                    <span className={`px-3 py-1 text-xs rounded-full ${sim.color}`}>
                      {sim.text}
                    </span>
                  </div>

                  {/* RISK */}
                  <div>
                    <span className={`px-3 py-1 text-xs text-white rounded-full ${risk.color}`}>
                      {risk.text}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end gap-3">

                    {/* VIEW */}
                    <button
                      onClick={() => handleView(row.submission_id)}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    >
                      <i className="fa-regular fa-eye text-gray-600"></i>
                    </button>

                    {/* AI ANALYSIS */}
                    <button
                      onClick={() => handleAnalyze(row)}
                      className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-white"></i>
                    </button>

                    {/* COMPARE */}
                    <button
                      onClick={() => handleCompare(row)}
                      className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center hover:bg-purple-600 transition"
                    >
                      <i className="fa-solid fa-code-compare text-white"></i>
                    </button>

                    {/* MORE */}
                    <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                      <i className="fa-solid fa-ellipsis-vertical text-gray-600"></i>
                    </button>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerSubmissions;