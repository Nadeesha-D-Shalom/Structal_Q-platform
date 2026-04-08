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

// Success Popup Component
const SuccessPopup = ({ isVisible, onClose, message, title, details }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div style={popupOverlayStyle} onClick={onClose}>
      <div style={popupContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={popupAnimationStyle}>
          <div style={successIconContainerStyle}>
            <div style={successIconStyle}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <h2 style={popupTitleStyle}>{title || "✓ Success!"}</h2>
          <p style={popupMessageStyle}>{message}</p>
          
          {details && Object.keys(details).length > 0 && (
            <div style={popupDetailsStyle}>
              {Object.entries(details).map(([key, value]) => (
                <div key={key} style={detailRowStyle}>
                  <span style={detailLabelStyle}>{key}:</span>
                  <span style={detailValueStyle}>{value}</span>
                </div>
              ))}
            </div>
          )}
          
          <div style={popupFooterStyle}>
            <button onClick={onClose} style={popupButtonStyle}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LecturerSubmissions = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatedResults, setEvaluatedResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  //  Step tracker: -1 = idle, 0..N = active step, N+1 = all done
  const [currentStep, setCurrentStep] = useState(-1);

  // State for manual marks and final marks
  const [manualMarks, setManualMarks] = useState({});
  const [finalMarks, setFinalMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDetails, setPopupDetails] = useState({});
  const [savedResults, setSavedResults] = useState([]);

  useEffect(() => {
    fetchSubmissions();
    fetchEvaluatedResults(); // Load results automatically when component mounts
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
      
      console.log("API Response:", res.data); // Debug: Check what's coming from API
      
      if (res.data.success && Array.isArray(res.data.data)) {
        console.log("Results data:", res.data.data); // Debug: Check the data array
        setEvaluatedResults(res.data.data);
        // Initialize manual marks and final marks state
        const initialManualMarks = {};
        const initialFinalMarks = {};
        res.data.data.forEach(result => {
          initialManualMarks[result.analysis_result_id] = "";
          // Use final_score from API, not a non-existent field
          initialFinalMarks[result.analysis_result_id] = result.final_score || 0;
        });
        setManualMarks(initialManualMarks);
        setFinalMarks(initialFinalMarks);
      } else {
        console.error("Invalid response structure:", res.data);
        setEvaluatedResults([]);
      }
      
    } catch (err) {
      console.error("Error fetching evaluated results:", err);
      setEvaluatedResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  // Handle manual mark change with validation
  const handleManualMarkChange = (analysisResultId, aiScore, maxMark = 100) => {
    return (e) => {
      let value = e.target.value;
      
      // Allow empty string
      if (value === "") {
        setManualMarks(prev => ({ ...prev, [analysisResultId]: "" }));
        setFinalMarks(prev => ({ ...prev, [analysisResultId]: aiScore || 0 }));
        return;
      }
      
      let numValue = parseFloat(value);
      
      // Validate if it's a valid number
      if (isNaN(numValue)) {
        return;
      }
      
      // Clamp between 0 and maxMark (100)
      if (numValue < 0) numValue = 0;
      if (numValue > maxMark) numValue = maxMark;
      
      // Round to 2 decimal places
      numValue = Math.round(numValue * 100) / 100;
      
      setManualMarks(prev => ({ ...prev, [analysisResultId]: numValue }));
      
      // Calculate final mark: (AI score + manual mark) / 2 (capped at 100)
      let finalMark = ((aiScore || 0) + numValue) / 2;
      if (finalMark > 100) finalMark = 100;
      if (finalMark < 0) finalMark = 0;
      finalMark = Math.round(finalMark * 100) / 100;
      
      setFinalMarks(prev => ({ ...prev, [analysisResultId]: finalMark }));
    };
  };

  // Save all evaluated results (only those with manual marks entered)
  const handleSaveAllResults = async () => {
    // Filter only results that have manual marks entered
    const resultsToSave = evaluatedResults
      .map(result => ({
        analysis_result_id: result.analysis_result_id,
        submission_id: result.submission_id,
        ai_marks: result.final_score || 0,
        diagram_marks: manualMarks[result.analysis_result_id] || 0,
        final_mark: finalMarks[result.analysis_result_id] || result.final_score || 0
      }))
      .filter(r => r.diagram_marks > 0 && r.diagram_marks !== "" && r.diagram_marks !== null);
    
    if (resultsToSave.length === 0) {
      alert("No manual marks entered to save. Please enter manual marks for diagrams first.");
      return;
    }
    
    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE}/api/marks/evaluated-results/save`, {
        results: resultsToSave
      });
      
      if (response.data.success) {
        setSavedResults(prev => [...prev, ...resultsToSave.map(r => r.submission_id)]);
        setPopupTitle("✓ Results Saved Successfully");
        setPopupMessage(`${response.data.saved.length} evaluated results have been saved.`);
        setPopupDetails({
          "Total Saved": response.data.saved.length,
          "AI Processed": evaluatedResults.length,
          "Manual Entries": resultsToSave.length,
          "Status": "Completed"
        });
        setShowSuccessPopup(true);
        
        // Refresh the evaluated results to show saved state
        await fetchEvaluatedResults();
      } else {
        alert(response.data.message || "Failed to save results");
      }
    } catch (err) {
      console.error("Error saving results:", err);
      alert("Failed to save evaluated results");
    } finally {
      setSaving(false);
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
        fetchEvaluatedResults(); // Refresh evaluated results after evaluation
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

      {/* Success Popup */}
      <SuccessPopup
        isVisible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={popupTitle}
        message={popupMessage}
        details={popupDetails}
      />

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

          {/* HEADER with Save Button */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">
                Evaluated Results
              </h2>
              <p className="text-sm text-gray-400">
                AI scores + manual evaluation (diagrams)
              </p>
            </div>
            
            {/* Save All Button - Top Right Corner */}
            {evaluatedResults.length > 0 && !resultsLoading && (
              <button
                onClick={handleSaveAllResults}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg
                           hover:bg-green-700 disabled:opacity-50 transition font-medium text-sm
                           shadow-sm whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5"
                        strokeDasharray="20 10" strokeLinecap="round" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-save text-xs" />
                    Save All Results
                  </>
                )}
              </button>
            )}
          </div>

          {/* TABLE HEADER */}
          <div className="grid grid-cols-9 px-6 py-4 text-xs text-gray-400 border-b font-semibold">
            <div>GROUP</div>
            <div>STUDENT FILE</div>
            <div>GUIDE</div>
            <div>ASSIGNMENT</div>
            <div>AI SCORE</div>
            <div>MANUAL</div>
            <div>FINAL</div>
            <div>RISK</div>
            <div className="text-center">STATUS</div>
          </div>

          {/* TABLE BODY */}
          {resultsLoading ? (
            <div className="p-6 text-gray-400">Loading results...</div>
          ) : evaluatedResults.length === 0 ? (
            <div className="p-6">
              <div className="text-gray-400 mb-2">
                No evaluated results — click "Load Evaluated Results" to fetch
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <div>Debug Info:</div>
                <div>API Endpoint: {API_BASE}/api/ai-analysis/results/all</div>
                <div>Check browser console for API response</div>
                <button 
                  onClick={async () => {
                    const res = await fetch(`${API_BASE}/api/ai-analysis/results/all`);
                    const data = await res.json();
                    console.log("Manual fetch:", data);
                  }}
                  className="mt-2 text-blue-500 underline"
                >
                  Test API in Console
                </button>
              </div>
            </div>
          ) : (
            evaluatedResults.map((row, index) => {
              console.log("Rendering row:", row); // Debug each row
              const isSaved = savedResults.some(s => s === row.submission_id);
              const hasManualMark = manualMarks[row.analysis_result_id] && manualMarks[row.analysis_result_id] !== "";
              return (
                <div
                  key={row.analysis_result_id}
                  className="grid grid-cols-9 px-6 py-4 items-center text-sm border-b hover:bg-gray-50 transition"
                >
                  <div className="font-medium text-gray-700">G{index + 1}</div>

                  {/* STUDENT FILE */}
                  <a 
                    href={`${API_BASE}/api/marks/pdf/${row.student_file_id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 no-underline"
                  >
                    <i className="fas fa-file-pdf"></i>
                    <span>Submission File</span>
                  </a>
                
                  {/* MARKING GUIDE */}
                  <a 
                    href={`${API_BASE}/api/marks/pdf/${row.guide_file_id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 no-underline"
                  >
                    <i className="fas fa-file-pdf"></i>
                    <span>Marking Guide</span>
                  </a>
                  
                  <div className="text-gray-600 truncate">{row.assessment_name || "N/A"}</div>

                  {/* AI SCORE */}
                  <div className="font-semibold text-blue-600">
                    {row.final_score ?? 0}
                  </div>

                  {/* MANUAL INPUT */}
                  <div>
                    <input
                      type="number"
                      placeholder="0"
                      value={manualMarks[row.analysis_result_id] !== undefined ? manualMarks[row.analysis_result_id] : ""}
                      onChange={handleManualMarkChange(row.analysis_result_id, row.final_score, 100)}
                      disabled={isSaved}
                      className={`w-20 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300
                        ${isSaved ? "bg-gray-100 text-gray-500" : ""}`}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                  </div>

                  {/* FINAL SCORE */}
                  <div className="font-semibold text-green-600">
                    {finalMarks[row.analysis_result_id]?.toFixed(2) ?? row.final_score ?? 0}
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

                  {/* STATUS */}
                  <div className="text-center">
                    {isSaved ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                        ✓ Saved
                      </span>
                    ) : hasManualMark ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                        Ready
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">
                        Pending
                      </span>
                    )}
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

// Popup Styles
const popupOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  animation: "fadeIn 0.3s ease-out"
};

const popupContainerStyle = {
  position: "relative",
  maxWidth: "450px",
  width: "90%",
  margin: "20px"
};

const popupAnimationStyle = {
  backgroundColor: "#fff",
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
  overflow: "hidden",
  animation: "slideUp 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)"
};

const successIconContainerStyle = {
  display: "flex",
  justifyContent: "center",
  marginTop: "30px",
  marginBottom: "20px"
};

const successIconStyle = {
  width: "80px",
  height: "80px",
  backgroundColor: "#52c41a",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
  animation: "scaleIn 0.5s ease-out"
};

const popupTitleStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center",
  color: "#2e3b52",
  margin: "0 0 12px 0"
};

const popupMessageStyle = {
  fontSize: "14px",
  textAlign: "center",
  color: "#64748b",
  margin: "0 24px 16px 24px",
  lineHeight: "1.5"
};

const popupDetailsStyle = {
  backgroundColor: "#f8f9fa",
  margin: "0 24px 24px 24px",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e9ecef"
};

const detailRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid #e9ecef"
};

const detailLabelStyle = {
  fontSize: "12px",
  color: "#74839a",
  fontWeight: "500"
};

const detailValueStyle = {
  fontSize: "12px",
  color: "#2e3b52",
  fontWeight: "600"
};

const popupFooterStyle = {
  padding: "0 24px 24px 24px",
  display: "flex",
  justifyContent: "center"
};

const popupButtonStyle = {
  backgroundColor: "#3d6df2",
  color: "#fff",
  border: "none",
  padding: "10px 32px",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s"
};

export default LecturerSubmissions;