import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LecturerNavbar from "./LecturerNavbar";
import { getApiBaseUrl } from "../../utils/apiBase";

const API_BASE = getApiBaseUrl();

/* ─── Style injection ─── */
const injectStyles = () => {
  if (document.getElementById("vs-styles")) return;
  const s = document.createElement("style");
  s.id = "vs-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    .vs-root { font-family: 'Inter', sans-serif; background: #f8f9fb; min-height: 100vh; }

    @keyframes vs-fadein {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes vs-slideup {
      from { opacity: 0; transform: translateY(28px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes vs-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes vs-pulse-ring {
      0%   { transform: scale(0.85); opacity: 0.9; }
      100% { transform: scale(2.1); opacity: 0; }
    }
    @keyframes vs-ticker {
      0%   { opacity: 0; transform: translateY(7px); }
      12%  { opacity: 1; transform: translateY(0); }
      88%  { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-7px); }
    }
    @keyframes vs-bar {
      from { width: 0%; }
      to   { width: 100%; }
    }
    @keyframes vs-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    @keyframes vs-dot-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40%           { transform: translateY(-6px); opacity: 1; }
    }

    .vs-fade   { animation: vs-fadein 0.38s ease both; }
    .vs-fade-1 { animation-delay: 0.06s; }
    .vs-fade-2 { animation-delay: 0.12s; }

    .vs-field {
      border: 1.5px solid #e8eaf0;
      border-radius: 10px;
      background: #fff;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .vs-field:hover { border-color: #c5c9f5; }
    .vs-field:focus-within {
      border-color: #2e3bbf;
      box-shadow: 0 0 0 3px rgba(46,59,191,0.08);
    }

    .vs-select {
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      cursor: pointer;
      outline: none;
      border: none;
      background-color: transparent;
      width: 100%;
      padding: 0 40px 0 0;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #0f1729;
    }
    .vs-select option { color: #0f1729; background: #fff; }

    .vs-btn {
      position: relative;
      overflow: hidden;
      transition: transform 0.14s ease, box-shadow 0.18s ease, opacity 0.2s;
      border: none;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
    .vs-btn:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(46,59,191,0.38);
    }
    .vs-btn:not(:disabled):active { transform: translateY(0); }
    .vs-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%);
      pointer-events: none;
      border-radius: inherit;
    }

    .vs-overlay {
      position: fixed;
      inset: 0;
      background: rgba(8, 10, 22, 0.65);
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: vs-fadein 0.22s ease;
    }
    .vs-modal {
      animation: vs-slideup 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
      width: 90%;
      max-width: 420px;
    }

    .vs-spinner {
      width: 54px; height: 54px;
      border-radius: 50%;
      border: 3.5px solid rgba(46,59,191,0.18);
      border-top-color: #2e3bbf;
      animation: vs-spin 0.72s linear infinite;
    }
    .vs-ring {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      border: 2px solid rgba(46,59,191,0.38);
      animation: vs-pulse-ring 1.7s ease-out infinite;
    }
    .vs-ring2 { animation-delay: 0.85s; }

    .vs-ticker-text { animation: vs-ticker 2.9s ease infinite; }

    .vs-progress {
      height: 3px;
      background: linear-gradient(90deg, #2e3bbf, #4a58e8, #e8861a);
      border-radius: 2px;
      animation: vs-bar 3.2s ease-out both;
    }

    .vs-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #2e3bbf;
      animation: vs-dot-bounce 1.2s ease infinite;
      display: inline-block;
    }
    .vs-dot:nth-child(2) { animation-delay: 0.18s; }
    .vs-dot:nth-child(3) { animation-delay: 0.36s; }

    .vs-shimmer {
      background: linear-gradient(90deg, #edeef5 25%, #e4e5f0 50%, #edeef5 75%);
      background-size: 600px 100%;
      animation: vs-shimmer 1.5s infinite;
    }

    .vs-pill {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      padding: 4px 11px;
      border-radius: 20px;
    }

    .vs-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #8a90a8;
      display: block;
      margin-bottom: 4px;
    }
  `;
  document.head.appendChild(s);
};

/* ══════════════ MODAL ══════════════ */
const AnalysisModal = ({ messages, msgIdx }) => (
  <div className="vs-overlay">
    <div className="vs-modal">
      <div style={{
        background: "#fff",
        borderRadius: 18,
        padding: "44px 36px 36px",
        boxShadow: "0 28px 72px rgba(8,10,22,0.24), 0 0 0 1px rgba(46,59,191,0.1)",
        textAlign: "center",
      }}>
        {/* Spinner */}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 28, width: 70, height: 70 }}>
          <div className="vs-ring" />
          <div className="vs-ring vs-ring2" />
          <div className="vs-spinner" />
          <div style={{
            position: "absolute", width: 20, height: 20, borderRadius: "50%",
            background: "linear-gradient(135deg, #2e3bbf, #e8861a)",
          }} />
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#edeef5", borderRadius: 2, marginBottom: 24, overflow: "hidden" }}>
          <div className="vs-progress" style={{ width: "100%" }} />
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#8a90a8", textTransform: "uppercase", margin: "0 0 5px" }}>
          Processing
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f1729", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>
          AI Analysis Running
        </h3>

        {/* Ticker */}
        <div style={{ height: 26, overflow: "hidden", marginTop: 10 }}>
          <p key={msgIdx} className="vs-ticker-text" style={{ fontSize: 13.5, color: "#2e3bbf", fontWeight: 500, margin: 0, fontFamily: "'Inter', sans-serif" }}>
            {messages[msgIdx]}
          </p>
        </div>

        {/* Dot loader */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "18px 0 16px" }}>
          <div className="vs-dot" /><div className="vs-dot" /><div className="vs-dot" />
        </div>

        {/* Step pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          {[["Parsing", 0], ["Evaluating", 1], ["Scoring", 3], ["Finalising", 5]].map(([label, threshold]) => {
            const active = msgIdx >= threshold;
            return (
              <span key={label} className="vs-pill" style={{
                background: active ? "#eef0fc" : "#f3f4f8",
                color: active ? "#2e3bbf" : "#9ca3af",
                border: `1px solid ${active ? "#c5caef" : "#e8eaf0"}`,
                transition: "all 0.35s ease",
              }}>
                {active ? "✓ " : ""}{label}
              </span>
            );
          })}
        </div>

        <p style={{ fontSize: 11.5, color: "#b0b5c8", marginTop: 20, marginBottom: 0, fontFamily: "'Inter', sans-serif" }}>
          Please keep this window open
        </p>
      </div>
    </div>
  </div>
);

/* ══════════════ ICONS ══════════════ */
const IcoGroup = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoGuide = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IcoSpark = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IcoWarn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const TICKER_MESSAGES = [
  "Reading submission document…",
  "Parsing marking criteria…",
  "Evaluating answers with AI…",
  "Computing section scores…",
  "Generating detailed feedback…",
  "Finalising result…",
];

/* ══════════════ MAIN ══════════════ */
const ViewSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [data, setData] = useState(null);
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => { injectStyles(); }, []);
  const fetchSubmission = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/submissions/${id}`, {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const extracted = result?.data || result[0] || result;
      if (!extracted) throw new Error("Submission data not found");
      setData(extracted);
    } catch (err) {
      console.error(err);
      setError("Failed to load submission. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchGuides = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/marking-guides`, {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const extracted = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
      setGuides(extracted);
    } catch (err) {
      console.error(err);
      setError("Failed to load marking guides.");
    }
  }, []);

  useEffect(() => { fetchSubmission(); fetchGuides(); }, [fetchSubmission, fetchGuides]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % TICKER_MESSAGES.length), 2700);
    return () => clearInterval(t);
  }, [running]);

  const runAnalysis = async () => {
    setError(""); setInfo("");
    if (!selectedGuide) { setError("Please select a marking guide before running analysis."); return; }
    const guideObj = guides.find((g) => String(g.guide_id) === String(selectedGuide));
    if (!guideObj?.guide_file_path) { setError("Selected guide file is missing."); return; }
    try {
      setRunning(true); setMsgIdx(0);
      const res = await fetch(`${API_BASE}/api/ai-analysis/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          submission_id: id,
          marking_guide_id: selectedGuide,
          submission_path: data?.storage_path,
          guide_file: guideObj.guide_file_path,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "AI analysis failed");
      setInfo("Analysis completed successfully!");
      setTimeout(() => navigate(`/lecturer/analysis/${result.analysis_result_id}`, { state: result.data }), 800);
    } catch (err) {
      console.error(err);
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  const fileName  = data?.original_file_name || data?.file_name || "N/A";
  const groupName = fileName !== "N/A" ? fileName.replace(/\.[^/.]+$/, "") : "N/A";
  const guideName = guides.find((g) => String(g.guide_id) === String(selectedGuide))?.guide_name || null;
  const canRun    = !running && !!selectedGuide;

  /* ── SKELETON ── */
  if (loading) return (
    <div className="vs-root">
      <LecturerNavbar />
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
        {[68, 220, 68].map((h, i) => (
          <div key={i} className="vs-shimmer" style={{ height: h, borderRadius: 12, marginBottom: 14 }} />
        ))}
      </div>
    </div>
  );

  /* ── ERROR STATE ── */
  if (!data) return (
    <div className="vs-root">
      <LecturerNavbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8eaf0", padding: "48px 40px", maxWidth: 400, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff5f5", border: "1.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#dc2626" }}>
            <IcoWarn />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f1729", margin: "0 0 8px", fontFamily: "'Inter',sans-serif" }}>Unable to Load Submission</h3>
          <p style={{ fontSize: 13.5, color: "#6b7280", margin: "0 0 22px", fontFamily: "'Inter',sans-serif" }}>{error || "Submission not found"}</p>
          <button onClick={fetchSubmission} className="vs-btn" style={{ background: "#2e3bbf", color: "#fff", borderRadius: 9, padding: "11px 28px", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 14px rgba(46,59,191,0.28)" }}>
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vs-root">
      <LecturerNavbar />

      {running && <AnalysisModal messages={TICKER_MESSAGES} msgIdx={msgIdx} />}

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 72px" }}>

        {/* Page title */}
        <div className="vs-fade" style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1729", margin: "0 0 5px", letterSpacing: "-0.3px", fontFamily: "'Inter',sans-serif" }}>
            ML Analysis Intelligence Portal
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0, fontFamily: "'Inter',sans-serif" }}>
            Select the parameters below to trigger the intelligence processing engine.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="vs-fade" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 14, color: "#b91c1c" }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}><IcoWarn /></div>
            <p style={{ fontSize: 13.5, margin: 0, fontWeight: 500, fontFamily: "'Inter',sans-serif" }}>{error}</p>
          </div>
        )}
        {info && (
          <div className="vs-fade" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 14, color: "#166534" }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}><IcoCheck /></div>
            <p style={{ fontSize: 13.5, margin: 0, fontWeight: 500, fontFamily: "'Inter',sans-serif" }}>{info}</p>
          </div>
        )}

        {/* Main card */}
        <div className="vs-fade vs-fade-1" style={{
          background: "#fff",
          borderRadius: 14,
          border: "1.5px solid #e8eaf0",
          boxShadow: "0 2px 16px rgba(15,23,41,0.05)",
          overflow: "hidden",
        }}>
          {/* Card header */}
          <div style={{ padding: "20px 26px 18px", borderBottom: "1.5px solid #f0f1f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 14.5, fontWeight: 700, color: "#0f1729", margin: "0 0 3px", fontFamily: "'Inter',sans-serif" }}>
                Run Analysis Configuration
              </h2>
              <p style={{ fontSize: 12.5, color: "#8a90a8", margin: 0, fontFamily: "'Inter',sans-serif" }}>
                Select the parameters below to trigger the intelligence processing engine.
              </p>
            </div>
            {/* Engine ready */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#059669", flexShrink: 0, fontFamily: "'Inter',sans-serif" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Engine Ready
            </span>
          </div>

          {/* Fields */}
          <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Group Name */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a90a8", marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>
                <div style={{ width: 18, height: 18, color: "#2e3bbf" }}><IcoGroup /></div>
                Group Name
              </label>
              <div className="vs-field" style={{ padding: "11px 16px" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f1729", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter',sans-serif" }}>
                  {groupName}
                </p>
              </div>
            </div>

            {/* Uploaded File */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a90a8", marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>
                <div style={{ width: 18, height: 18, color: "#c2600a" }}><IcoFile /></div>
                Uploaded File
              </label>
              <div className="vs-field" style={{ padding: "11px 16px" }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: "#c2600a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {fileName}
                </p>
              </div>
            </div>

            {/* Marking Guide — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a90a8", marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>
                <div style={{ width: 18, height: 18, color: "#7c3aed" }}><IcoGuide /></div>
                Marking Guide / Rubric
              </label>
              <div className="vs-field" style={{ padding: "11px 16px" }}>
                <select
                  className="vs-select"
                  value={selectedGuide}
                  onChange={e => setSelectedGuide(e.target.value)}
                  style={{ color: selectedGuide ? "#0f1729" : "#9ca3af", fontWeight: selectedGuide ? 500 : 400 }}
                >
                  <option value="">Choose a marking guide…</option>
                  {guides.map(g => (
                    <option key={g.guide_id} value={g.guide_id}>{g.guide_name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Action zone */}
          <div style={{ padding: "18px 26px 24px", borderTop: "1.5px solid #f0f1f5", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "#fafbfc" }}>
            <button
              className="vs-btn"
              onClick={runAnalysis}
              disabled={!canRun}
              style={{
                width: "100%", maxWidth: 300,
                padding: "14px 32px",
                borderRadius: 11,
                fontSize: 13.5,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#fff",
                background: canRun ? "linear-gradient(135deg, #2e3bbf 0%, #4a58e8 100%)" : "#c5caef",
                opacity: canRun ? 1 : 0.7,
                cursor: canRun ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                boxShadow: canRun ? "0 4px 18px rgba(46,59,191,0.32)" : "none",
              }}
            >
              <IcoSpark />
              {running ? "Analysing…" : "Run Analysis"}
            </button>

            <p style={{ fontSize: 11, fontWeight: 600, color: "#8a90a8", margin: 0, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif" }}>
              {guideName ? `Rubric: ${guideName}` : "Estimated processing time: ~2 minutes"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ViewSubmission;