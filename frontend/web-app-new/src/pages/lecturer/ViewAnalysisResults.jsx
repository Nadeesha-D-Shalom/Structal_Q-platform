import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LecturerNavbar from "./LecturerNavbar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, CartesianGrid, Legend,
} from "recharts";

const API_BASE = "http://localhost:5000/api";

/* ─────────────────────────────────────────
   STYLE INJECTION  (shared with MLAnalysisResult)
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
    @keyframes mr-ring-spin {
      from { stroke-dashoffset: 283; }
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

    .mr-info-cell {
      border: 1.5px solid #e8eaf0;
      border-radius: 10px;
      padding: 14px 16px;
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
const fmt = (val, decimals = 1) =>
  val != null ? Number(val).toFixed(decimals) : "—";

const scoreColor = (pct) => {
  if (pct >= 75) return { bg: "#ecfdf5", text: "#059669", bar: "#10b981" };
  if (pct >= 50) return { bg: "#eff6ff", text: "#2e3bbf", bar: "#4a58e8" };
  if (pct >= 30) return { bg: "#fff7ed", text: "#c2600a", bar: "#f97316" };
  return { bg: "#fef2f2", text: "#dc2626", bar: "#ef4444" };
};

const riskColor = (level) => {
  const l = (level ?? "").toLowerCase();
  if (l === "low")    return { bg: "#ecfdf5", text: "#059669" };
  if (l === "medium") return { bg: "#fff7ed", text: "#c2600a" };
  return { bg: "#fef2f2", text: "#dc2626" };
};

const BRAND_BARS = ["#2e3bbf", "#4a58e8", "#6b7cf0", "#8f9df4", "#b3baf7", "#d6dafb"];

/* ─────────────────────────────────────────
   RING CHART (SVG)
───────────────────────────────────────── */
const RingChart = ({ value, max, label, color, delay = 0 }) => {
  const pctVal = max ? (value / max) * 100 : 0;
  const radius = 38;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (pctVal / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#f0f1f6" strokeWidth="7" />
          <circle
            cx="48" cy="48" r={radius}
            fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: `stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1) ${delay}s`, animation: `mr-ring-spin 1s cubic-bezier(0.22,1,0.36,1) ${delay}s both` }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#0f1729", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
            {pctVal.toFixed(0)}%
          </span>
          <span style={{ fontSize: 10, color: "#8a90a8", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
            score
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
   CUSTOM TOOLTIPS
───────────────────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e8eaf0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontFamily: "'Inter',sans-serif" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#8a90a8", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#0f1729", margin: 0 }}>{payload[0]?.value?.toFixed(1)}</p>
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
   SKELETON LOADER
───────────────────────────────────────── */
const Skeleton = ({ h = 20, w = "100%", r = 8 }) => (
  <div style={{
    height: h, width: w, borderRadius: r,
    background: "linear-gradient(90deg, #f0f1f6 25%, #e8eaf0 50%, #f0f1f6 75%)",
    backgroundSize: "600px 100%",
    animation: "mr-shimmer 1.4s infinite linear",
  }} />
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const ViewAnalysisResults = () => {
  const { submissionId } = useParams();
  const navigate         = useNavigate();
  const [data, setData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    injectStyles();
    fetch(`${API_BASE}/ai-analysis/results/${submissionId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(true);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [submissionId]);

  /* ── Similarity bar chart data ── */
  const simBarData = data
    ? [
        { name: "Similarity Avg",   value: parseFloat(data.similarity_avg ?? 0) * 100 },
        { name: "Structural Sim",   value: parseFloat(data.structural_similarity_avg ?? 0) * 100 },
        { name: "Risk Score",       value: parseFloat(data.risk_score ?? 0) },
      ]
    : [];

  /* ── Radar data ── */
  const radarData = data
    ? [
        { name: "Similarity",    value: parseFloat(data.similarity_avg ?? 0) * 100 },
        { name: "Structural",    value: parseFloat(data.structural_similarity_avg ?? 0) * 100 },
        { name: "Risk Score",    value: Math.min(100, parseFloat(data.risk_score ?? 0)) },
        { name: "OCR Used",      value: data.ocr_used ? 100 : 0 },
        { name: "CV Used",       value: data.cv_used  ? 100 : 0 },
      ]
    : [];

  const simPct  = data ? parseFloat(data.similarity_avg ?? 0) * 100 : 0;
  const strPct  = data ? parseFloat(data.structural_similarity_avg ?? 0) * 100 : 0;
  const riskPct = data ? Math.min(100, parseFloat(data.risk_score ?? 0)) : 0;
  const simCol  = scoreColor(simPct);
  const strCol  = scoreColor(strPct);
  const rCol    = riskColor(data?.risk_level);

  /* ── Ring metrics ── */
  const rings = data
    ? [
        { label: "Similarity",  pct: simPct,  color: simCol.bar },
        { label: "Structural",  pct: strPct,  color: strCol.bar },
        { label: "Risk Score",  pct: riskPct, color: scoreColor(100 - riskPct).bar },
      ]
    : [];

  /* ── Error state ── */
  if (error) return (
    <div className="mr-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LecturerNavbar />
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #fecaca", padding: "48px 40px", maxWidth: 400, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginTop: 80 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#dc2626" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f1729", margin: "0 0 8px", fontFamily: "'Inter',sans-serif" }}>
          Failed to load analysis result
        </h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px", fontFamily: "'Inter',sans-serif" }}>
          Submission ID: {submissionId}
        </p>
        <button onClick={() => navigate(-1)} style={{ background: "#2e3bbf", color: "#fff", border: "none", borderRadius: 9, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="mr-root">
      <LecturerNavbar />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 72px" }}>

        {/* ── PAGE HEADER ── */}
        <div className="mr-fade" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1729", margin: "0 0 4px", letterSpacing: "-0.3px", fontFamily: "'Inter',sans-serif" }}>
              Saved Analysis Result
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0, fontFamily: "'Inter',sans-serif" }}>
              {loading ? "Loading analysis data…" : `Submission #${data?.submission_id} · ${data?.analysis_type ?? "—"}`}
            </p>
          </div>
          <button className="mr-back-btn" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back
          </button>
        </div>

        {/* ── TOP SUMMARY CARDS ── */}
        <div className="mr-fade mr-fade-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 22 }}>

          {/* Similarity Avg */}
          <div className="mr-card" style={{ padding: "20px 22px", borderLeft: "4px solid #2e3bbf" }}>
            <p className="mr-stat-label">Similarity Avg</p>
            {loading ? <Skeleton h={40} w="60%" /> : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, color: "#2e3bbf", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
                    {simPct.toFixed(1)}%
                  </span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="mr-progress-track">
                    <div className="mr-progress-fill" style={{ width: `${simPct}%`, background: "linear-gradient(90deg, #2e3bbf, #4a58e8)" }} />
                  </div>
                  <p style={{ fontSize: 11, color: "#8a90a8", margin: "5px 0 0", fontFamily: "'Inter',sans-serif" }}>content similarity</p>
                </div>
              </>
            )}
          </div>

          {/* Structural Similarity */}
          <div className="mr-card" style={{ padding: "20px 22px", borderLeft: "4px solid #10b981" }}>
            <p className="mr-stat-label">Structural Similarity</p>
            {loading ? <Skeleton h={40} w="60%" /> : (
              <>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#059669", fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
                  {strPct.toFixed(1)}%
                </span>
                <div style={{ marginTop: 10 }}>
                  <div className="mr-progress-track">
                    <div className="mr-progress-fill" style={{ width: `${strPct}%`, background: "#10b981", animationDelay: "0.1s" }} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Risk Level */}
          <div className="mr-card" style={{ padding: "20px 22px", borderLeft: "4px solid #f97316" }}>
            <p className="mr-stat-label">Risk Level</p>
            {loading ? <Skeleton h={40} w="60%" /> : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: rCol.text, fontFamily: "'Inter',sans-serif", lineHeight: 1, textTransform: "capitalize" }}>
                    {data?.risk_level ?? "—"}
                  </span>
                  <span className="mr-badge" style={{ background: rCol.bg, color: rCol.text }}>
                    {data?.risk_score ?? "—"} pts
                  </span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="mr-progress-track">
                    <div className="mr-progress-fill" style={{ width: `${Math.min(100, riskPct)}%`, background: "#f97316", animationDelay: "0.2s" }} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Analysis Type */}
          <div className="mr-card" style={{ padding: "20px 22px", borderLeft: "4px solid #7c3aed" }}>
            <p className="mr-stat-label">Analysis Type</p>
            {loading ? <Skeleton h={40} w="60%" /> : (
              <>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed", fontFamily: "'Inter',sans-serif", lineHeight: 1.2, textTransform: "capitalize" }}>
                  {data?.analysis_type ?? "—"}
                </span>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="mr-badge" style={{ background: data?.ocr_used ? "#ecfdf5" : "#fef2f2", color: data?.ocr_used ? "#059669" : "#dc2626" }}>
                    OCR {data?.ocr_used ? "✓" : "✗"}
                  </span>
                  <span className="mr-badge" style={{ background: data?.cv_used ? "#ecfdf5" : "#fef2f2", color: data?.cv_used ? "#059669" : "#dc2626" }}>
                    CV {data?.cv_used ? "✓" : "✗"}
                  </span>
                </div>
              </>
            )}
          </div>

        </div>

        {/* ── TWO-COLUMN ROW: DETAILS + RADAR ── */}
        <div className="mr-fade mr-fade-2" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 16 }}>

          {/* Submission Details */}
          <div className="mr-card" style={{ padding: "22px 24px" }}>
            <h3 className="mr-section-title">Submission Details</h3>
            {loading
              ? <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{[1,2,3,4].map(i => <Skeleton key={i} h={16} />)}</div>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "Submission ID",  value: data?.submission_id, mono: true },
                    { label: "Analysis Type",  value: data?.analysis_type },
                    { label: "Started At",     value: data?.started_at  ? new Date(data.started_at).toLocaleString()  : "—" },
                    { label: "Completed At",   value: data?.completed_at ? new Date(data.completed_at).toLocaleString() : "—" },
                  ].map(({ label, value, mono }) => (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: "#374151", fontFamily: "'Inter',sans-serif" }}>{label}</span>
                        <span style={{
                          fontFamily: mono ? "'JetBrains Mono',monospace" : "'Inter',sans-serif",
                          fontSize: 12, fontWeight: 600, color: "#0f1729",
                          background: "#f8f9fb", padding: "3px 10px", borderRadius: 6,
                          border: "1px solid #e8eaf0",
                        }}>
                          {value ?? "—"}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Similarity row with progress */}
                  {[
                    { label: "Similarity Avg",        val: simPct, col: simCol },
                    { label: "Structural Similarity",  val: strPct, col: strCol },
                  ].map(({ label, val, col }, i) => (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: 6, background: "#eef0fc", color: "#2e3bbf",
                            fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Inter',sans-serif", flexShrink: 0,
                          }}>{i + 1}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 500, color: "#374151", fontFamily: "'Inter',sans-serif" }}>{label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 500, color: "#0f1729" }}>
                            {val.toFixed(1)}%
                          </span>
                          <span className="mr-badge" style={{ background: col.bg, color: col.text }}>{val.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="mr-progress-track">
                        <div className="mr-progress-fill" style={{ width: `${val}%`, background: col.bar, animationDelay: `${i * 0.1}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Radar */}
          <div className="mr-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column" }}>
            <h3 className="mr-section-title">Quality Radar</h3>
            {loading
              ? <Skeleton h={260} r={12} />
              : (
                <div style={{ flex: 1, minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                      <PolarGrid stroke="#f0f1f6" />
                      <PolarAngleAxis dataKey="name" tick={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600, fill: "#6b7280" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fill: "#9ca3af" }} tickCount={4} />
                      <Radar dataKey="value" stroke="#2e3bbf" strokeWidth={2} fill="#2e3bbf" fillOpacity={0.12} dot={{ fill: "#2e3bbf", r: 3 }} />
                      <Tooltip content={<CustomRadarTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
          </div>
        </div>

        {/* ── BAR CHART ── */}
        <div className="mr-fade mr-fade-3 mr-card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <h3 className="mr-section-title">Score Distribution</h3>
          {loading
            ? <Skeleton h={230} r={12} />
            : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={simBarData} barGap={4} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(46,59,191,0.04)" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
                    {simBarData.map((_, i) => <Cell key={i} fill={BRAND_BARS[i % BRAND_BARS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* ── RING CHARTS ── */}
        <div className="mr-fade mr-fade-4 mr-card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <h3 className="mr-section-title">Metric Score Rings</h3>
          {loading
            ? <div style={{ display: "flex", gap: 40, justifyContent: "center" }}>{[1,2,3].map(i => <Skeleton key={i} h={96} w={96} r={999} />)}</div>
            : (
              <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24, paddingTop: 8 }}>
                {rings.map(({ label, pct: p, color }, i) => (
                  <RingChart key={label} value={p} max={100} label={label} color={color} delay={i * 0.1} />
                ))}
              </div>
            )}
        </div>

        {/* ── ANALYSIS METADATA ── */}
        <div className="mr-fade mr-fade-5 mr-card" style={{ padding: "22px 24px", marginBottom: 16 }}>
          <h3 className="mr-section-title">Analysis Metadata</h3>
          {loading
            ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>{[1,2,3,4].map(i => <Skeleton key={i} h={72} r={10} />)}</div>
            : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                {[
                  { label: "Submission ID",  value: data?.submission_id,  color: "#2e3bbf", bg: "#eef0fc" },
                  { label: "Analysis Type",  value: data?.analysis_type,  color: "#c2600a", bg: "#fff4ea" },
                  { label: "Risk Level",     value: data?.risk_level,     color: rCol.text, bg: rCol.bg  },
                  { label: "Risk Score",     value: data?.risk_score,     color: "#7c3aed", bg: "#f5f0ff" },
                  { label: "OCR Used",       value: data?.ocr_used ? "Yes" : "No", color: data?.ocr_used ? "#059669" : "#dc2626", bg: data?.ocr_used ? "#ecfdf5" : "#fef2f2" },
                  { label: "CV Used",        value: data?.cv_used  ? "Yes" : "No", color: data?.cv_used  ? "#059669" : "#dc2626", bg: data?.cv_used  ? "#ecfdf5" : "#fef2f2" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ background: bg, borderRadius: 10, padding: "14px 16px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#8a90a8", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "'Inter',sans-serif" }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 17, fontWeight: 700, color, margin: 0, fontFamily: "'Inter',sans-serif", textTransform: "capitalize" }}>
                      {value ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* ── TIMELINE ── */}
        <div className="mr-fade mr-fade-6 mr-card" style={{ padding: "22px 24px" }}>
          <h3 className="mr-section-title">Analysis Timeline</h3>
          {loading
            ? <Skeleton h={80} r={10} />
            : (
              <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
                {[
                  { label: "Started",   ts: data?.started_at,   color: "#2e3bbf", bg: "#eef0fc" },
                  { label: "Completed", ts: data?.completed_at, color: "#059669", bg: "#ecfdf5" },
                ].map(({ label, ts, color, bg }, i, arr) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color, margin: "0 0 2px", fontFamily: "'Inter',sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: 0, fontFamily: "'JetBrains Mono',monospace" }}>
                          {ts ? new Date(ts).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ width: 80, height: 2, background: "linear-gradient(90deg, #2e3bbf, #10b981)", borderRadius: 2, margin: "0 12px", marginBottom: 36, flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default ViewAnalysisResults;