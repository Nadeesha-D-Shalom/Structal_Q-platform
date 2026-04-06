import { useEffect, useState } from "react";
import LecturerNavbar from "./LecturerNavbar";
import { useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

//  Evaluation pipeline steps
const EVAL_STEPS = [
  "Loading submissions",
  "Running similarity",
  "ML analysis",
  "Risk scoring",
  "Saving results",
];

const LecturerSubmissions = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatedResults, setEvaluatedResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  //  Step tracker: -1 = idle, 0..N = active step, N+1 = all done
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/submissions/lecturer/all`);
      const result = await res.json();
      if (Array.isArray(result)) {
        setData(result);
      } else if (result.success && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3.1 ── fetch evaluated results
  const fetchEvaluatedResults = async () => {
    try {
      setResultsLoading(true);

      const res = await axios.get(`${API_BASE}/api/ai-analysis/results/all`);

      if (res.data.success) {
        setEvaluatedResults(res.data.data);
      } else {
        setEvaluatedResults([]);
      }

    } catch (err) {
      console.error(err);
      setEvaluatedResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  // ===================== ACTIONS =====================
  const handleEvaluateAll = async () => {
    try {
      setIsEvaluating(true);
      setCurrentStep(0);

      const assessmentId = data[0]?.assessment_id;
      if (!assessmentId) {
        alert("No assessment found. Please load submissions first.");
        return;
      }

      // Simulate step-by-step progress visually while real API runs
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < EVAL_STEPS.length - 1) return prev + 1;
          clearInterval(stepInterval);
          return prev;
        });
      }, 900);

      const res = await fetch(
        `${API_BASE}/api/ai-analysis/evaluate-all/${assessmentId}`,
        { method: "POST" }
      );

      const result = await res.json();

      if (!res.ok) {
        clearInterval(stepInterval);
        throw new Error(result.error || result.message || "Evaluation failed");
      }

      clearInterval(stepInterval);
      setCurrentStep(EVAL_STEPS.length); // all done

      console.log("SUCCESS:", result);

      setTimeout(() => {
        fetchSubmissions();
        setTimeout(() => setCurrentStep(-1), 2000);
      }, 1000);

    } catch (err) {
      console.error("REAL ERROR:", err);
      alert(err.message);
      setCurrentStep(-1);
    } finally {
      setIsEvaluating(false);
    }
  };

  /* ===================== HELPERS ===================== */

  const getSimilarity = (val) => {
    if (!val) return { text: "0%", color: "bg-gray-100 text-gray-500" };
    const percent = Math.round(val * 100);
    if (percent < 30) return { text: `${percent}% Low`, color: "bg-green-100 text-green-600" };
    if (percent < 70) return { text: `${percent}% Medium`, color: "bg-yellow-100 text-yellow-600" };
    return { text: `${percent}% High`, color: "bg-red-100 text-red-600" };
  };

  const getRisk = (score) => {
    if (!score) return { text: "PASSED", color: "bg-green-500" };
    if (score > 0.8) return { text: "CRITICAL", color: "bg-red-500" };
    if (score > 0.5) return { text: "REVIEW", color: "bg-yellow-500" };
    return { text: "PASSED", color: "bg-green-500" };
  };

  /* ===================== NAVIGATION ===================== */

  const handleView = (id) => navigate(`/lecturer/submissions/${id}`);

  const handleAnalyze = (row) =>
    navigate("/lecturer/ml-analysis", {
      state: {
        submission_id: row.submission_id,
        marking_guide_id: row.marking_guide_id || 1,
        submission_path: row.storage_path,
        guide_file: row.guide_path || "",
      },
    });

  const handleCompare = (row) =>
    navigate(`/analysis/${row.submission_id}`, {
      state: {
        submission_id: row.submission_id,
        file_id: row.file_id,
        file_name: row.original_file_name,
        storage_path: row.storage_path,
      },
    });

  /* ===================== STEP CIRCLE COMPONENT ===================== */

  const StepCircle = ({ index, label }) => {
    const isDone = currentStep > index;
    const isActive = currentStep === index;

    return (
      <div className="flex flex-col items-center">
        <div
          className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center
            text-xs font-medium transition-all duration-300 relative
            ${isDone
              ? "border-green-500 bg-green-500 text-white"
              : isActive
                ? "border-blue-500 text-blue-500"
                : "border-gray-300 text-gray-400"
            }
          `}
        >
          {isDone ? (
            <svg
              className="animate-[popIn_0.35s_ease_forwards]"
              width="14" height="14" viewBox="0 0 14 14" fill="none"
            >
              <path
                d="M3.5 7l2.5 2.5 4.5-4.5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : isActive ? (
            <>
              <span>{index + 1}</span>
              <span
                className="absolute inset-[-3px] rounded-full border-2 border-transparent border-t-blue-500 animate-spin"
              />
            </>
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
        <span
          className={`
            text-[10px] mt-1 text-center leading-tight max-w-[60px]
            ${isDone ? "text-green-600 font-medium" : "text-gray-400"}
          `}
        >
          {label}
        </span>
      </div>
    );
  };

  const allDone = currentStep === EVAL_STEPS.length;

  return (
    <div className="bg-[#f6f8fb] min-h-screen">
      <LecturerNavbar activePage="Submissions" />

      <div className="p-8">

        {/* HEADER ROW — title left, buttons right */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-bold text-[#1f2d3d]">
              ML-Enhanced Submissions
            </h1>
            <p className="text-gray-500 text-sm">
              AI-powered evaluation, similarity detection, and risk analysis
            </p>
          </div>

          {/* BUTTONS — right side */}
          <div className="flex items-center gap-3">
            {/* ── STEP 3.1 ── Load Evaluated Results button */}
            <button
              onClick={fetchEvaluatedResults}
              disabled={resultsLoading}
              className="flex items-center gap-2 bg-slate-700 text-white px-5 py-2.5 rounded-lg
                         hover:bg-slate-800 disabled:opacity-50 transition font-medium text-sm
                         shadow-sm whitespace-nowrap"
            >
              {resultsLoading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5"
                      strokeDasharray="20 10" strokeLinecap="round" />
                  </svg>
                  Loading Results...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-table-list text-xs" />
                  Load Evaluated Results
                </>
              )}
            </button>

            {/* Evaluate All button */}
            <button
              onClick={handleEvaluateAll}
              disabled={isEvaluating || data.length === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg
                         hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm
                         shadow-sm whitespace-nowrap"
            >
              {isEvaluating ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5"
                      strokeDasharray="20 10" strokeLinecap="round" />
                  </svg>
                  Evaluating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rotate-right text-xs" />
                  Evaluate All
                </>
              )}
            </button>
          </div>
        </div>

        {/* STEP PROGRESS BAR — appears only while evaluating or done */}
        {currentStep >= 0 && (
          <div className="bg-white rounded-xl border px-6 py-4 mb-5 shadow-sm">
            <div className="flex items-center">
              {EVAL_STEPS.map((label, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <StepCircle index={i} label={label} />
                  {i < EVAL_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-1 mb-4 transition-colors duration-500
                        ${currentStep > i ? "bg-green-500" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <p className={`text-xs mt-1 ${allDone ? "text-green-600 font-medium" : "text-gray-400"}`}>
              {allDone
                ? `✓ All ${EVAL_STEPS.length} steps complete — ${data.length} submissions processed`
                : `Step ${currentStep + 1} of ${EVAL_STEPS.length}: ${EVAL_STEPS[currentStep]}...`}
            </p>
          </div>
        )}

        {/* ── EXISTING SUBMISSIONS TABLE ── */}
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
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      G{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Group {index + 1}</div>
                      <div className="text-xs text-gray-400">Submission #{row.submission_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <i className="fa-regular fa-file text-gray-400"></i>
                    {row.original_file_name}
                  </div>
                  <div>
                    <span className="px-3 py-1 text-xs bg-gray-100 rounded-full text-gray-600">
                      v{row.attempt_no || 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    On-Time
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-xs rounded-full ${sim.color}`}>
                      {sim.text}
                    </span>
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-xs text-white rounded-full ${risk.color}`}>
                      {risk.text}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleView(row.submission_id)}
                      title="View"
                      className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center hover:bg-purple-600 transition"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-white"></i>
                    </button>
                    <button
                      onClick={() => handleAnalyze(row)}
                      title="AI Analysis"
                      className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition"
                    >
                      <i className="fa-solid fa-code-compare text-white"></i>
                    </button>
                    <button
                      onClick={() => handleCompare(row)}
                      title="Compare"
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    >
                      <i className="fa-regular fa-eye text-gray-600"></i>
                    </button>
                    <button
                      title="More"
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    >
                      <i className="fa-solid fa-ellipsis-vertical text-gray-600"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── STEP 3.2 ── EVALUATED RESULTS TABLE */}
        <div className="mt-8 bg-white rounded-2xl shadow border overflow-hidden">

          {/* HEADER */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">
              Evaluated Results
            </h2>
            <p className="text-sm text-gray-400">
              AI scores + manual evaluation (diagrams)
            </p>
          </div>

          {/* TABLE HEADER */}
          <div className="grid grid-cols-8 px-6 py-4 text-xs text-gray-400 border-b font-semibold">
            <div>GROUP</div>
            <div>STUDENT FILE</div>
            <div>GUIDE</div>
            <div>ASSIGNMENT</div>
            <div>AI SCORE</div>
            <div>MANUAL</div>
            <div>FINAL</div>
            <div>RISK</div>
          </div>

          {/* TABLE BODY */}
          {resultsLoading ? (
            <div className="p-6 text-gray-400">Loading results...</div>
          ) : evaluatedResults.length === 0 ? (
            <div className="p-6 text-gray-400">
              No evaluated results — click &ldquo;Load Evaluated Results&rdquo; to fetch
            </div>
          ) : (
            evaluatedResults.map((row, index) => (
              <div
                key={row.analysis_result_id}
                className="grid grid-cols-8 px-6 py-4 items-center text-sm border-b hover:bg-gray-50 transition"
              >
                <div className="font-medium text-gray-700">G{index + 1}</div>

                <div className="flex items-center gap-2 text-gray-700 truncate">
                  <i className="fa-regular fa-file text-gray-400 shrink-0"></i>
                  <span className="truncate">{row.student_file}</span>
                </div>

                <div className="text-gray-600 truncate">{row.guide_file}</div>

                <div className="text-gray-600 truncate">{row.assessment_name}</div>

                {/* AI SCORE */}
                <div className="font-semibold text-blue-600">
                  {row.final_score ?? 0}
                </div>

                {/* MANUAL INPUT */}
                <div>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-16 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                {/* FINAL SCORE (AI score for now — calculated in next step) */}
                <div className="font-semibold text-green-600">
                  {row.final_score ?? 0}
                </div>

                {/* RISK */}
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${row.risk_level === "HIGH"
                    ? "bg-red-100 text-red-600"
                    : row.risk_level === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-green-100 text-green-600"
                    }`}>
                    {row.risk_level ?? "LOW"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default LecturerSubmissions;