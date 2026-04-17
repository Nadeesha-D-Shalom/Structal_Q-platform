import { useLocation, useNavigate, useParams } from "react-router-dom";
import LecturerNavbar from "./LecturerNavbar";
import { useEffect, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, CartesianGrid, Legend,
} from "recharts";
import { getApiBaseUrl } from "../../utils/apiBase";
import {
  hasUsableAnalysisPayload,
  normalizeAnalysisPayload,
  unwrapAnalysisApiData,
} from "../../utils/analysisPayload";
import { normalizeRouteId } from "../../utils/routeHelpers";

const API_BASE = getApiBaseUrl();

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ─────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────── */
const injectStyles = () => {
  if (document.getElementById("mr-styles")) return;
  const s = document.createElement("style");
  s.id = "mr-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    .mr-root {
      font-family: 'Inter', sans-serif;
      background: #f8f9fb;
      min-height: 100vh;
    }

    @keyframes mr-fadein {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes mr-bar-fill {
      from { width: 0%; }
    }
    @keyframes mr-count {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes mr-ring-spin {
      from { stroke-dashoffset: 283; }
    }
    @keyframes mr-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }

    .mr-fade   { animation: mr-fadein 0.4s ease both; }
    .mr-fade-1 { animation-delay: 0.05s; }
    .mr-fade-2 { animation-delay: 0.1s; }
    .mr-fade-3 { animation-delay: 0.15s; }
    .mr-fade-4 { animation-delay: 0.2s; }
    .mr-fade-5 { animation-delay: 0.25s; }
    .mr-fade-6 { animation-delay: 0.3s; }

    .mr-card {
      background: #ffffff;
      border: 1.5px solid #e8eaf0;
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(15, 23, 41, 0.04);
    }

    .mr-section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f1729;
      letter-spacing: -0.1px;
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mr-section-title::before {
      content: '';
      display: block;
      width: 3px;
      height: 14px;
      border-radius: 2px;
      background: linear-gradient(180deg, #2e3bbf, #4a58e8);
      flex-shrink: 0;
    }

    .mr-stat-label {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #8a90a8;
      margin: 0 0 6px;
    }

    .mr-progress-track {
      width: 100%;
      height: 6px;
      background: #f0f1f6;
      border-radius: 4px;
      overflow: hidden;
    }
    .mr-progress-fill {
      height: 100%;
      border-radius: 4px;
      animation: mr-bar-fill 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .mr-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.03em;
    }

    .mr-signal-card {
      border: 1.5px solid #e8eaf0;
      border-radius: 10px;
      padding: 14px 16px;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .mr-signal-card:hover {
      border-color: #c5c9f5;
      box-shadow: 0 2px 10px rgba(46, 59, 191, 0.06);
    }

    .mr-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 9px;
      border: 1.5px solid #e8eaf0;
      background: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #4b5563;
      cursor: pointer;
      transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    }
    .mr-back-btn:hover {
      border-color: #c5c9f5;
      background: #f8f9fb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    /* Recharts override */
    .recharts-tooltip-wrapper .recharts-default-tooltip {
      border-radius: 8px !important;
      border: 1.5px solid #e8eaf0 !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
      font-family: 'Inter', sans-serif !important;
      font-size: 12px !important;
    }
  `;
  document.head.appendChild(s);
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const pct = (val) => (val * 100).toFixed(1);

const scoreColor = (pct) => {
  if (pct >= 75) return { bg: "#ecfdf5", text: "#059669", bar: "#10b981" };
  if (pct >= 50) return { bg: "#eff6ff", text: "#2e3bbf", bar: "#4a58e8" };
  if (pct >= 30) return { bg: "#fff7ed", text: "#c2600a", bar: "#f97316" };
  return { bg: "#fef2f2", text: "#dc2626", bar: "#ef4444" };
};

const BRAND_BARS = ["#2e3bbf", "#4a58e8", "#6b7cf0", "#8f9df4", "#b3baf7", "#d6dafb"];

/* ─────────────────────────────────────────
   RING CHART (SVG)
───────────────────────────────────────── */
const RingChart = ({ value, max, label, color, delay = 0 }) => {
  const pctVal = max ? (value / max) * 100 : 0;
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pctVal / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#f0f1f6" strokeWidth="7" />
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: `stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
              animation: `mr-ring-spin 1s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
            }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#0f1729", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
            {value}
          </span>
          <span style={{ fontSize: 10, color: "#8a90a8", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
            / {max}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.04em", fontFamily: "'Inter',sans-serif", textAlign: "center" }}>
        {label}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────
   CUSTOM TOOLTIP
───────────────────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e8eaf0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontFamily: "'Inter',sans-serif" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#8a90a8", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>Section {label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#0f1729", margin: 0 }}>{payload[0].value} <span style={{ fontSize: 12, color: "#8a90a8", fontWeight: 500 }}>pts</span></p>
      {payload[1] && <p style={{ fontSize: 12, color: "#8a90a8", margin: "2px 0 0" }}>Max: {payload[1].value}</p>}
    </div>
  );
};

const CustomRadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e8eaf0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontFamily: "'Inter',sans-serif" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#0f1729", margin: "0 0 2px" }}>{payload[0]?.payload?.name}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#2e3bbf", margin: 0 }}>{payload[0]?.value?.toFixed(1)}%</p>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const MLAnalysisResult = () => {
  const location = useLocation();
  const { id: rawId } = useParams();
  const id = normalizeRouteId(rawId);
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState(() =>
    normalizeAnalysisPayload(location.state || null)
  );
  const analysisDataRef = useRef(analysisData);
  useEffect(() => {
    analysisDataRef.current = analysisData;
  }, [analysisData]);
  const [errorDetail, setErrorDetail] = useState("");
  const [loading, setLoading] = useState(
    () => !hasUsableAnalysisPayload(normalizeAnalysisPayload(location.state || null))
  );
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErrorDetail("Missing id in URL.");
      return;
    }

    let cancelled = false;

    const fetchAnalysisById = async () => {
      setErrorDetail("");
      if (!hasUsableAnalysisPayload(analysisDataRef.current)) {
        setLoading(true);
      }

      const tryApply = (raw) => {
        try {
          const normalized = normalizeAnalysisPayload(raw);
          if (!hasUsableAnalysisPayload(normalized)) return false;
          setAnalysisData(normalized);
          setErrorDetail("");
          setLoading(false);
          return true;
        } catch (e) {
          console.warn("tryApply analysis row", e);
          return false;
        }
      };

      let lastErrorJson = {};
      let sawUnauthorized = false;

      const tryFetchRow = async (url) => {
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (res.status === 401) sawUnauthorized = true;
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          lastErrorJson = json;
          return false;
        }
        const row = unwrapAnalysisApiData(json);
        if (row && tryApply(row)) return true;
        lastErrorJson = json;
        return false;
      };

      try {
        // /lecturer/analysis/:id may be analysis_result_id, submission_id, file_id, or marking_guide_id.
        // ALWAYS call lookup FIRST — it resolves all of the above via getAnalysisResultByLookupId().
        // Do NOT call /results/:id before lookup: that endpoint is WHERE submission_id = :id only,
        // so /results/124 would wrongly look for submission_id = 124 when 124 is analysis_result_id.
        // Order: lookup → result (analysis id) → results (submission id) as fallbacks only.
        if (!cancelled) {
          const ok =
            (await tryFetchRow(
              `${API_BASE}/api/ai-analysis/lookup/${encodeURIComponent(id)}`
            )) ||
            (await tryFetchRow(
              `${API_BASE}/api/ai-analysis/result/${encodeURIComponent(id)}`
            )) ||
            (await tryFetchRow(
              `${API_BASE}/api/ai-analysis/results/${encodeURIComponent(id)}`
            ));
          if (ok) return;
        }

        if (!cancelled) {
          const fromState = normalizeAnalysisPayload(location.state || null);
          const preserved =
            hasUsableAnalysisPayload(fromState) ? fromState
            : hasUsableAnalysisPayload(analysisDataRef.current) ? analysisDataRef.current
            : null;
          if (hasUsableAnalysisPayload(preserved)) {
            setAnalysisData(preserved);
            setErrorDetail("");
            setLoading(false);
            return;
          }
          setAnalysisData(null);
          const apiMsg = lastErrorJson.error || lastErrorJson.message || "";
          setErrorDetail(
            sawUnauthorized
              ? "Authentication failed (401). Sign out, sign in again, and reopen this report."
              : apiMsg ||
                  "No completed AI analysis was found for this id. You can use analysis result id, submission id, student file id, marking guide file id, or marking_guide_id. Open Submissions → load evaluated results → click the AI score to open the report for that run."
          );
        }
      } catch (err) {
        console.error("Fetch analysis by id failed", err);
        if (!cancelled) {
          const fromState = normalizeAnalysisPayload(location.state || null);
          const preserved =
            hasUsableAnalysisPayload(fromState) ? fromState
            : hasUsableAnalysisPayload(analysisDataRef.current) ? analysisDataRef.current
            : null;
          if (hasUsableAnalysisPayload(preserved)) {
            setAnalysisData(preserved);
            setErrorDetail("");
          } else {
            setAnalysisData(null);
            setErrorDetail(err?.message || "Network error while loading analysis.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAnalysisById();
    return () => {
      cancelled = true;
    };
  }, [id, location.state]);

  const handleDownloadReport = async () => {
    const submissionId = analysisData?.submission_id;
    if (!submissionId) {
      alert("Submission id not found for report generation.");
      return;
    }

    try {
      setReportLoading(true);
      const res = await fetch(
        `${API_BASE}/api/ai-analysis/report/${submissionId}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to generate report");
      const report = await res.json();

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis_report_submission_${submissionId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.message || "Report download failed");
    } finally {
      setReportLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="mr-root" style={{ minHeight: "100vh", background: "#f8f9fb" }}>
        <LecturerNavbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <p style={{ fontFamily: "'Inter',sans-serif", color: "#6b7280", fontSize: 14 }}>
            Loading analysis…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (!hasUsableAnalysisPayload(analysisData)) {
    return (
      <div className="mr-root" style={{ minHeight: "100vh", background: "#f8f9fb", padding: "24px" }}>
        <LecturerNavbar />
        <div
          style={{
            margin: "0 auto",
            marginTop: 24,
            background: "#fff",
            borderRadius: 14,
            border: "1.5px solid #fecaca",
            padding: "40px 36px",
            maxWidth: 460,
            textAlign: "left",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f1729", margin: "0 0 8px", fontFamily: "'Inter',sans-serif" }}>
                No analysis to show yet
              </h3>
              <p style={{ fontSize: 13, color: "#4b5563", margin: "0 0 12px", lineHeight: 1.5, fontFamily: "'Inter',sans-serif" }}>
                {errorDetail ||
                  "We could not find a saved AI result for this link. Analysis is only created after the ML service runs successfully."}
              </p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.55, fontFamily: "'Inter',sans-serif" }}>
                <strong style={{ color: "#374151" }}>What you need first:</strong> an <strong>assignment</strong> (assessment) under a subject, a <strong>marking guide</strong> for that assignment, and at least one <strong>student submission</strong> (file). Then run <strong>AI analysis</strong> from Submissions or ML Analysis. This page opens after a successful run, or you can open it with the analysis id or submission id from the database.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    background: "#2e3bbf",
                    color: "#fff",
                    border: "none",
                    borderRadius: 9,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter',sans-serif",
                  }}
                >
                  Go back
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/lecturer/submissions")}
                  style={{
                    background: "#f3f4f6",
                    color: "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: 9,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter',sans-serif",
                  }}
                >
                  Open Submissions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data = analysisData;
  const sections = ["A", "B", "C", "D", "E", "F"];

  /* Chart datasets */
  const barData = sections.map((key) => ({
    name: key,
    Score: data[`section_${key}`] ?? 0,
    Max: data.guide_weights?.[key]?.marks ?? 0,
  }));

  const radarData = [
    { name: "Semantic\nSimilarity", value: parseFloat(pct(data.semantic_similarity ?? 0)) },
    { name: "Diagram\nClarity",     value: parseFloat(pct(data.diagram_clarity ?? 0)) },
    { name: "Word\nRatio",          value: parseFloat(pct(data.unique_word_ratio ?? 0)) },
    { name: "OCR\nConfidence",      value: parseFloat(data.diagram_analysis?.ocr_avg_confidence ?? 0) },
    { name: "Image\nScore",         value: Math.min(100, (data.diagram_analysis?.image_count ?? 0) * 12) },
  ];

  const totalScore = data.final_score ?? 0;
  const maxTotal   = sections.reduce((s, k) => s + (data.guide_weights?.[k]?.marks ?? 0), 0);
  const totalPct   = maxTotal ? ((totalScore / maxTotal) * 100).toFixed(1) : 0;
  return (
    <div className="mr-root">
      <LecturerNavbar />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}>

        {/* ── PAGE HEADER ── */}
        <div className="mr-fade" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1729", margin: "0 0 4px", letterSpacing: "-0.3px", fontFamily: "'Inter',sans-serif" }}>
              AI Analysis Result
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0, fontFamily: "'Inter',sans-serif" }}>
              Detailed breakdown of the submission evaluation
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="mr-back-btn"
              onClick={handleDownloadReport}
              disabled={reportLoading}
              style={{ opacity: reportLoading ? 0.6 : 1 }}
              title="Download generated analysis report"
            >
              {reportLoading ? "Generating..." : "Download Report"}
            </button>
            <button className="mr-back-btn" onClick={() => navigate(-1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* ── TOP SUMMARY CARDS ── */}
        <div className="mr-fade mr-fade-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 22 }}>

          {/* Final Score — hero card */}
          <div className="mr-card" style={{ padding: "20px 22px", borderLeft: `4px solid #2e3bbf`, gridColumn: "span 1" }}>
            <p className="mr-stat-label">Final Score</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#2e3bbf", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
                {totalScore}
              </span>
              <span style={{ fontSize: 14, color: "#8a90a8", fontWeight: 600 }}>/ {maxTotal}</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="mr-progress-track">
                <div className="mr-progress-fill" style={{ width: `${totalPct}%`, background: "linear-gradient(90deg, #2e3bbf, #4a58e8)" }} />
              </div>
              <p style={{ fontSize: 11, color: "#8a90a8", margin: "5px 0 0", fontFamily: "'Inter',sans-serif" }}>{totalPct}% overall</p>
            </div>
          </div>

          {/* Semantic Similarity */}
          <div className="mr-card" style={{ padding: "20px 22px", borderLeft: "4px solid #10b981" }}>
            <p className="mr-stat-label">Semantic Similarity</p>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#059669", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
              {pct(data.semantic_similarity ?? 0)}%
            </span>
            <div style={{ marginTop: 10 }}>
              <div className="mr-progress-track">
                <div className="mr-progress-fill" style={{ width: `${pct(data.semantic_similarity ?? 0)}%`, background: "#10b981", animationDelay: "0.1s" }} />
              </div>
            </div>
          </div>

          {/* Diagram Clarity */}
          <div className="mr-card" style={{ padding: "20px 22px", borderLeft: "4px solid #e8861a" }}>
            <p className="mr-stat-label">Diagram Clarity</p>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#c2600a", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
              {pct(data.diagram_clarity ?? 0)}%
            </span>
            <div style={{ marginTop: 10 }}>
              <div className="mr-progress-track">
                <div className="mr-progress-fill" style={{ width: `${pct(data.diagram_clarity ?? 0)}%`, background: "#e8861a", animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>

          {/* Unique Word Ratio */}
          <div className="mr-card" style={{ padding: "20px 22px", borderLeft: "4px solid #7c3aed" }}>
            <p className="mr-stat-label">Unique Word Ratio</p>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#7c3aed", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
              {pct(data.unique_word_ratio ?? 0)}%
            </span>
            <div style={{ marginTop: 10 }}>
              <div className="mr-progress-track">
                <div className="mr-progress-fill" style={{ width: `${pct(data.unique_word_ratio ?? 0)}%`, background: "#7c3aed", animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>

        </div>

        {/* ── TWO-COLUMN ROW: SECTION BREAKDOWN + RADAR ── */}
        <div className="mr-fade mr-fade-2" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 16 }}>

          {/* Section Breakdown */}
          <div className="mr-card" style={{ padding: "22px 24px" }}>
            <h3 className="mr-section-title">Section Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {sections.map((key, i) => {
                const score = data[`section_${key}`] ?? 0;
                const max   = data.guide_weights?.[key]?.marks ?? 0;
                const pctV  = max ? (score / max) * 100 : 0;
                const col   = scoreColor(pctV);
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: "#eef0fc", color: "#2e3bbf",
                          fontSize: 11, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Inter',sans-serif", flexShrink: 0,
                        }}>{key}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: "#374151", fontFamily: "'Inter',sans-serif" }}>
                          {data.guide_weights?.[key]?.title || `Section ${key}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 500, color: "#0f1729" }}>
                          {score} / {max}
                        </span>
                        <span className="mr-badge" style={{ background: col.bg, color: col.text }}>
                          {pctV.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="mr-progress-track">
                      <div
                        className="mr-progress-fill"
                        style={{ width: `${pctV}%`, background: col.bar, animationDelay: `${i * 0.08}s` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar chart */}
          <div className="mr-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column" }}>
            <h3 className="mr-section-title">Quality Radar</h3>
            <div style={{ flex: 1, minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#f0f1f6" />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600, fill: "#6b7280" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fill: "#9ca3af" }}
                    tickCount={4}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#2e3bbf"
                    strokeWidth={2}
                    fill="#2e3bbf"
                    fillOpacity={0.12}
                    dot={{ fill: "#2e3bbf", r: 3 }}
                  />
                  <Tooltip content={<CustomRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── SCORE DISTRIBUTION BAR CHART ── */}
        <div className="mr-fade mr-fade-3 mr-card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <h3 className="mr-section-title">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={barData} barGap={4} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f6" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, fill: "#6b7280" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fill: "#9ca3af" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(46,59,191,0.04)" }} />
              <Legend
                wrapperStyle={{ fontFamily: "'Inter',sans-serif", fontSize: 12, paddingTop: 12 }}
                iconType="circle" iconSize={8}
              />
              <Bar dataKey="Max" fill="#f0f1f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={BRAND_BARS[i % BRAND_BARS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── SECTION RING CARDS ── */}
        <div className="mr-fade mr-fade-4 mr-card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <h3 className="mr-section-title">Per-Section Score Rings</h3>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24, paddingTop: 8 }}>
            {sections.map((key, i) => {
              const score = data[`section_${key}`] ?? 0;
              const max   = data.guide_weights?.[key]?.marks ?? 0;
              const pctV  = max ? (score / max) * 100 : 0;
              const col   = scoreColor(pctV);
              return (
                <RingChart
                  key={key}
                  value={score}
                  max={max}
                  label={data.guide_weights?.[key]?.title?.split(" ").slice(0, 2).join(" ") || `Section ${key}`}
                  color={col.bar}
                  delay={i * 0.1}
                />
              );
            })}
          </div>
        </div>

        {/* ── DIAGRAM ANALYSIS ── */}
        <div className="mr-fade mr-fade-5 mr-card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <h3 className="mr-section-title">Diagram Analysis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { label: "Document Type",   value: data.diagram_analysis?.doc_type,            color: "#2e3bbf", bg: "#eef0fc" },
              { label: "Image Count",     value: data.diagram_analysis?.image_count,          color: "#c2600a", bg: "#fff4ea" },
              { label: "OCR Confidence",  value: `${data.diagram_analysis?.ocr_avg_confidence}%`, color: "#059669", bg: "#ecfdf5" },
              { label: "Word Count",      value: data.diagram_analysis?.ocr_word_count,       color: "#7c3aed", bg: "#f5f0ff" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 10, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#8a90a8", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "'Inter',sans-serif" }}>
                  {label}
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color, margin: 0, fontFamily: "'Inter',sans-serif" }}>
                  {value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── DETECTION SIGNALS ── */}
        <div className="mr-fade mr-fade-6 mr-card" style={{ padding: "22px 24px" }}>
          <h3 className="mr-section-title">Diagram Detection Signals</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {Object.entries(data.diagram_analysis?.detected_signals ?? {}).map(([key, val]) => {
              const boolEntries = Object.entries(val).filter(([k]) => k !== "signal_score");
              const trueCount   = boolEntries.filter(([, v]) => v).length;
              const sigPct      = boolEntries.length ? (trueCount / boolEntries.length) * 100 : 0;
              const sigCol      = scoreColor(sigPct);
              return (
                <div key={key} className="mr-signal-card">
                  {/* Signal header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#0f1729", margin: 0, textTransform: "capitalize", fontFamily: "'Inter',sans-serif" }}>
                      {key.replace(/_/g, " ")}
                    </h4>
                    <span className="mr-badge" style={{ background: sigCol.bg, color: sigCol.text }}>
                      {val.signal_score ?? 0} pts
                    </span>
                  </div>

                  {/* Bool rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {boolEntries.map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Inter',sans-serif", textTransform: "capitalize" }}>
                          {k.replace(/_/g, " ")}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, fontFamily: "'Inter',sans-serif",
                          color: v ? "#059669" : "#dc2626",
                          background: v ? "#ecfdf5" : "#fef2f2",
                          padding: "2px 9px", borderRadius: 20,
                        }}>
                          {v ? "Yes" : "No"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Signal mini progress */}
                  <div style={{ marginTop: 10 }}>
                    <div className="mr-progress-track" style={{ height: 4 }}>
                      <div className="mr-progress-fill" style={{ width: `${sigPct}%`, background: sigCol.bar }} />
                    </div>
                    <p style={{ fontSize: 10.5, color: "#8a90a8", margin: "4px 0 0", fontFamily: "'Inter',sans-serif" }}>
                      {trueCount}/{boolEntries.length} signals detected
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MLAnalysisResult;


