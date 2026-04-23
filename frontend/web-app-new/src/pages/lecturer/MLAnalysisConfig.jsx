import { useEffect, useState, useCallback } from "react";
import LecturerNavbar from "./LecturerNavbar";
import { useLocation } from "react-router-dom";
import { appToast } from "../../components/UIFeedback/appNotify";

const API_BASE = process.env.REACT_APP_API_URL || "";

// ─────────────────────────────────────────
// STYLES (Kept but cleaned)
const injectStyles = () => {
  if (document.getElementById("mac-styles")) return;

  const style = document.createElement("style");
  style.id = "mac-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .mac-root {
      font-family: 'DM Sans', sans-serif;
      background: #f0f2f8;
      min-height: 100vh;
    }

    @keyframes mac-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes mac-spin  { to { transform: rotate(360deg); } }
    @keyframes mac-pop   { 0% { transform: scale(0.93); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

    .mac-card {
      background: #fff;
      border: 1.5px solid #e2e5f0;
      border-radius: 18px;
      box-shadow: 0 1px 3px rgba(14,20,50,0.04), 0 4px 16px rgba(14,20,50,0.05);
    }

    .mac-slot {
      flex: 1;
      min-width: 0;
      border: 2px dashed #d4d9ee;
      border-radius: 14px;
      padding: 18px 16px;
      cursor: pointer;
      background: #fafbff;
      transition: all 0.18s ease;
      position: relative;
      user-select: none;
    }

    .mac-slot:hover,
    .mac-slot.slot-open {
      border-color: #6878e8;
      background: #f4f5ff;
      box-shadow: 0 0 0 4px rgba(104,120,232,0.08);
    }

    .mac-slot.slot-filled-a { border-style: solid; border-color: #6878e8; background: #f7f8ff; }
    .mac-slot.slot-filled-b { border-style: solid; border-color: #9f6fe8; background: #f9f7ff; }

    .mac-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0; right: 0;
      background: #fff;
      border: 1.5px solid #e2e5f0;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(14,20,50,0.12);
      z-index: 200;
      max-height: 240px;
      overflow-y: auto;
      animation: mac-pop 0.22s cubic-bezier(0.22,1,0.36,1) both;
    }

    .mac-opt {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #1a2050;
      border-bottom: 1px solid #f4f5fb;
      transition: background 0.12s;
    }

    .mac-opt:hover { background: #f4f5ff; }
    .mac-opt.opt-selected { background: #eef0ff; color: #3d52d5; font-weight: 700; }

    .mac-run-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 13px 32px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #3d52d5 0%, #6366f1 100%);
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(61,82,213,0.30);
      transition: all 0.15s ease;
    }

    .mac-run-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(61,82,213,0.36);
    }

    .mac-run-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .mac-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 11px;
      border-radius: 99px;
      font-size: 11.5px;
      font-weight: 700;
    }

    .mac-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #8a92b8;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mac-label::before {
      content: '';
      display: block;
      width: 3px;
      height: 13px;
      border-radius: 2px;
      background: linear-gradient(180deg, #3d52d5, #6366f1);
    }
  `;
  document.head.appendChild(style);
};

// ─────────────────────────────────────────
// HELPERS
const getRiskLevel = (pct) => {
  if (pct >= 75) return { label: "High Risk",    icon: "⚠", bg: "#fff1f1", text: "#c9302c", bar: "#e84040" };
  if (pct >= 50) return { label: "Medium Risk",  icon: "⚡", bg: "#fff8ed", text: "#b85d10", bar: "#f59430" };
  if (pct >= 25) return { label: "Low Risk",     icon: "ℹ", bg: "#edf2ff", text: "#3d52d5", bar: "#6878e8" };
  return { label: "Minimal Risk", icon: "✓", bg: "#edfaf4", text: "#1a7a4a", bar: "#22c77a" };
};

// ─────────────────────────────────────────
// REUSABLE COMPONENTS
const FileSVG = ({ color = "#8a92b8" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const Ring = ({ percentage, color }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 130, height: 130 }}>
      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#edf0fb" strokeWidth="10" />
        <circle 
          cx="65" 
          cy="65" 
          r={radius} 
          fill="none" 
          stroke={color} 
          strokeWidth="10" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#1a2050", lineHeight: 1 }}>
          {percentage.toFixed(0)}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#8a92b8" }}>%</span>
      </div>
    </div>
  );
};

const FileSlot = ({ 
  label, 
  accentColor, 
  accentSoft, 
  filledClass, 
  submission, 
  submissions, 
  onSelect 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback((submission) => {
    if (!submission.storage_path) {
      appToast("Invalid file (missing path)", "warning");
      return;
    }
    onSelect(submission);
    setIsOpen(false);
  }, [onSelect]);

  return (
    <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
      <div 
        className={`mac-slot ${isOpen ? "slot-open" : ""} ${submission ? filledClass : ""}`}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: submission ? 14 : 0 }}>
          <span style={{ 
            fontSize: 11, 
            fontWeight: 700, 
            letterSpacing: "0.09em", 
            textTransform: "uppercase", 
            color: submission ? accentColor : "#8a92b8" 
          }}>
            {label}
          </span>
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={submission ? accentColor : "#8a92b8"} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>

        {!submission ? (
          <div style={{ paddingTop: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#edf0fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileSVG />
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#8a92b8", textAlign: "center", lineHeight: 1.5 }}>
              Click to choose<br />a submission
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileSVG color={accentColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1a2050", lineHeight: 1.35, marginBottom: 3, wordBreak: "break-word" }}>
                {submission.original_file_name}
              </p>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#8a92b8" }}>
                ID #{submission.submission_id}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setIsOpen(false)} />
          <div className="mac-dropdown">
            {submissions.length === 0 ? (
              <div className="mac-opt" style={{ color: "#8a92b8", cursor: "default" }}>No submissions found</div>
            ) : (
              submissions.map(sub => (
                <div
                  key={sub.submission_id}
                  className={`mac-opt ${submission?.submission_id === sub.submission_id ? "opt-selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(sub);
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: "#edf0fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileSVG color="#6878e8" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 1 }}>
                      {sub.original_file_name}
                    </p>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#8a92b8" }}>
                      #{sub.submission_id}
                    </span>
                  </div>
                  {submission?.submission_id === sub.submission_id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d52d5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// MAIN COMPONENT
const MLAnalysisConfig = () => {
  const location = useLocation();
  const [submissions, setSubmissions] = useState([]);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    injectStyles();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch submissions
  useEffect(() => {
    fetch(`${API_BASE}/api/submissions/lecturer/all`, {
      headers: getAuthHeaders(),
    })
      .then(res => res.json())
      .then(data => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]));
  }, []);

  // Pre-select from navigation state
  useEffect(() => {
    if (location.state?.submission_id && submissions.length > 0) {
      const found = submissions.find(s => String(s.submission_id) === String(location.state.submission_id));
      if (found) setFile1(found);
    }
  }, [submissions, location.state]);

  const handleCompare = async () => {
    if (!file1?.storage_path || !file2?.storage_path) {
      appToast("Please select both files", "warning");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/ai-analysis/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          file1: file1.storage_path,
          file2: file2.storage_path
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        appToast(data.error || "Comparison failed", "error");
      }
    } catch (err) {
      appToast("Network error during comparison", "error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile1(null);
    setFile2(null);
    setResult(null);
  };

  const simPct = result ? parseFloat(result.similarity_percentage) || 0 : 0;
  const risk = getRiskLevel(simPct);
  const isSameFile = file1 && file2 && file1.submission_id === file2.submission_id;

  return (
    <div className="mac-root">
      <LecturerNavbar />

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13,
            background: "linear-gradient(135deg,#3d52d5,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(61,82,213,0.28)"
          }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2050", letterSpacing: "-0.4px" }}>
              Document Comparison (Student to Student)
            </h1>
            <p style={{ fontSize: 13.5, color: "#6b7499", marginTop: 4 }}>
              AI-powered semantic similarity detection between student submissions
            </p>
          </div>
        </div>

        {/* Selection Card */}
        <div className="mac-card" style={{ padding: "28px", marginBottom: 20 }}>
          <p className="mac-label">Choose Submissions to Compare</p>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <FileSlot
              label="Submission A"
              accentColor="#3d52d5"
              accentSoft="#eef0ff"
              filledClass="slot-filled-a"
              submission={file1}
              submissions={submissions}
              onSelect={setFile1}
            />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <button
                className="mac-swap"
                onClick={() => { setFile1(file2); setFile2(file1); }}
                style={{
                  width: 42, height: 42, borderRadius: "50%", border: "2px solid #e2e5f0",
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#8a92b8", transition: "all 0.3s"
                }}
                title="Swap A ↔ B"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/>
                  <path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
                </svg>
              </button>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: "#b0b7d6" }}>VS</span>
            </div>

            <FileSlot
              label="Submission B"
              accentColor="#7c3aed"
              accentSoft="#f3eeff"
              filledClass="slot-filled-b"
              submission={file2}
              submissions={submissions}
              onSelect={setFile2}
            />
          </div>

          <div style={{ height: 1, background: "#edf0f8", marginBottom: 22 }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="mac-pill" style={{ background: file1 ? "#eef0ff" : "#f4f5fb", color: file1 ? "#3d52d5" : "#8a92b8" }}>
                ● A: {file1 ? file1.original_file_name.substring(0, 20) + "..." : "Not selected"}
              </span>
              <span className="mac-pill" style={{ background: file2 ? "#f3eeff" : "#f4f5fb", color: file2 ? "#7c3aed" : "#8a92b8" }}>
                ● B: {file2 ? file2.original_file_name.substring(0, 20) + "..." : "Not selected"}
              </span>
              {isSameFile && <span className="mac-pill" style={{ background: "#fff1f1", color: "#c9302c" }}>⚠ Same file</span>}
            </div>

            <button
              className="mac-run-btn"
              onClick={handleCompare}
              disabled={loading || !file1 || !file2 || isSameFile}
            >
              {loading ? (
                <>Processing…</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Run Comparison
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mac-card" style={{ padding: "32px 28px", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", width: 56, height: 56 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ animation: "mac-spin 1.1s linear infinite" }}>
                <circle cx="28" cy="28" r="22" fill="none" stroke="#edf0fb" strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="#3d52d5" strokeWidth="5" strokeLinecap="round" strokeDasharray="138" strokeDashoffset="100" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2050", marginBottom: 4 }}>
                Running semantic analysis…
              </p>
              <p style={{ fontSize: 13, color: "#8a92b8" }}>
                Comparing "{file1?.original_file_name}" vs "{file2?.original_file_name}"
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Main Result Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Similarity Ring */}
              <div className="mac-card" style={{ padding: "28px 32px", textAlign: "center" }}>
                <Ring percentage={simPct} color={risk.bar} />
                <div className="mac-pill" style={{ background: risk.bg, color: risk.text, marginTop: 14 }}>
                  {risk.icon} {risk.label}
                </div>
              </div>

              {/* Score Details */}
              <div className="mac-card" style={{ padding: "26px", borderLeft: `4px solid ${risk.bar}` }}>
                <p className="mac-label">Similarity Score</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 18 }}>
                  <span style={{ fontSize: 52, fontWeight: 800, color: risk.text }}>
                    {simPct.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 22, color: "#b0b7d6", fontWeight: 600 }}>%</span>
                </div>
                <div style={{ height: 5, background: "#edf0fb", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ height: "100%", width: `${simPct}%`, background: risk.bar, transition: "width 1s ease" }} />
                </div>
                <p style={{ fontSize: 12, color: "#8a92b8" }}>Content overlap between documents</p>
              </div>

              {/* Interpretation */}
              <div className="mac-card" style={{ padding: "26px", borderLeft: "4px solid #6878e8" }}>
                <p className="mac-label">AI Interpretation</p>
                <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5, color: "#1a2050", marginBottom: 20 }}>
                  {result.interpretation || "No interpretation available"}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[{ label: "A", file: file1, color: "#3d52d5", soft: "#eef0ff" },
                    { label: "B", file: file2, color: "#7c3aed", soft: "#f3eeff" }].map(({ label, file, color, soft }) => (
                    <div key={label} style={{ padding: "8px 12px", borderRadius: 9, background: soft, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: color, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {label}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1a2050" }}>{file?.original_file_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            {Object.keys(result).length > 2 && (
              <div className="mac-card" style={{ padding: "24px 26px", marginBottom: 16 }}>
                <p className="mac-label">Additional Metrics</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
                  {Object.entries(result)
                    .filter(([key]) => !["similarity_percentage", "interpretation"].includes(key))
                    .map(([key, value], i) => {
                      const colors = [
                        { bg: "#eef0ff", text: "#3d52d5" },
                        { bg: "#fff4ea", text: "#b85d10" },
                        { bg: "#edfaf4", text: "#1a7a4a" },
                        { bg: "#f9f0ff", text: "#7c3aed" }
                      ];
                      const { bg, text } = colors[i % colors.length];

                      return (
                        <div key={key} style={{ background: bg, padding: "16px 18px", borderRadius: 12 }}>
                          <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a92b8", marginBottom: 6 }}>
                            {key.replace(/_/g, " ")}
                          </p>
                          <p style={{ fontSize: 18, fontWeight: 800, color: text }}>
                            {typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "—"}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Reset Button */}
            <div className="mac-card" style={{ padding: "18px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1a2050" }}>Run another comparison?</p>
                <p style={{ fontSize: 12.5, color: "#8a92b8" }}>Change selections or reset to start fresh.</p>
              </div>
              <button
                onClick={reset}
                style={{
                  padding: "10px 22px",
                  border: "1.5px solid #e2e5f0",
                  borderRadius: 10,
                  background: "#fff",
                  fontWeight: 700,
                  color: "#5a6380",
                  cursor: "pointer"
                }}
              >
                Reset All
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MLAnalysisConfig;