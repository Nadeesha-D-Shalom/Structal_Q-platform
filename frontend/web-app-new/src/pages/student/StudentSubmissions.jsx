import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import StudentNavbar from "./StudentNavbar";
import { getApiBaseUrl } from "../../utils/apiBase";

const API_BASE = getApiBaseUrl();

const getAuthHeaders = (json = false) => {
  const token = localStorage.getItem("auth_token");
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};
const api = (path) => `${API_BASE}${path}`;

const formatCountdown = (sec) => {
  if (sec == null || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return (
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    ", " +
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
};

const STATUS_CFG = {
  not_available: { label: "Not Available", color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" },
  open:          { label: "Open",          color: "#0369a1", bg: "#e0f2fe", dot: "#0ea5e9" },
  open_late:     { label: "Late Open",     color: "#9a3412", bg: "#ffedd5", dot: "#f97316" },
  open_resubmit: { label: "Resubmit",      color: "#6d28d9", bg: "#ede9fe", dot: "#8b5cf6" },
  submitted:     { label: "Submitted",     color: "#854d0e", bg: "#fef9c3", dot: "#eab308" },
  resubmitted:   { label: "Resubmitted",   color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  closed:        { label: "Closed",        color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" },
  evaluated:     { label: "Evaluated",     color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  published:     { label: "Published",     color: "#14532d", bg: "#dcfce7", dot: "#22c55e" },
};

const getStatusCfg = (lab) => STATUS_CFG[lab.lab_status] || STATUS_CFG.closed;

const canManage = (dueDate) => {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  return !isNaN(d.getTime()) && Date.now() <= d.getTime();
};

const urgencyColor = (sec) => {
  if (!sec || sec <= 0) return "#94a3b8";
  if (sec < 3600) return "#dc2626";
  if (sec < 86400) return "#d97706";
  return "#16a34a";
};

/* ── SVG Icons ── */
const Icon = {
  upload: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  folder: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  check: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  clock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  lock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  settings: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  alert: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  checkCircle: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronUp: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  beaker: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11l-4 4a2 2 0 0 0 1.414 3.414H17.586A2 2 0 0 0 19 18l-4-4V3"/>
    </svg>
  ),
  inbox: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  clipboardList: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/><line x1="9" y1="8" x2="11" y2="8"/>
    </svg>
  ),
  paperclip: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  ),
};

/* ── File Drop Zone ── */
function FileDropZone({ value, onChange, compact = false }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onChange(f);
  };
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      style={{
        border: `1.5px dashed ${drag ? "#2563eb" : value ? "#16a34a" : "#d1d5db"}`,
        borderRadius: compact ? 8 : 10,
        padding: compact ? "9px 13px" : "16px 18px",
        background: drag ? "#f0f6ff" : value ? "#f6fef9" : "#fafafa",
        cursor: "pointer", transition: "all 0.15s ease",
        display: "flex", alignItems: "center", gap: 10,
      }}
    >
      <input
        ref={ref} type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <span style={{ color: value ? "#16a34a" : "#9ca3af", flexShrink: 0 }}>
        {value ? Icon.file : Icon.folder}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: compact ? 12 : 13, fontWeight: 500, color: value ? "#15803d" : "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? value.name : "Drop file here or click to browse"}
        </p>
        {!compact && !value && (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>Accepted formats: PDF, DOC, DOCX</p>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", padding: 2, borderRadius: 4, transition: "color 0.12s" }}
        >
          {Icon.x}
        </button>
      )}
    </div>
  );
}

/* ── Status Badge ── */
function StatusBadge({ lab }) {
  const c = getStatusCfg(lab);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.bg, color: c.color,
      borderRadius: 6, padding: "3px 9px",
      fontSize: 11, fontWeight: 600, letterSpacing: "0.01em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

/* ── Score Ring ── */
function ScoreRing({ value }) {
  if (value == null) return <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 500 }}>—</span>;
  const color = value >= 75 ? "#16a34a" : value >= 50 ? "#d97706" : "#dc2626";
  const pct = Math.min(100, value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="11" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
        <circle cx="14" cy="14" r="11" fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${(pct / 100) * 69.1} 69.1`}
          strokeLinecap="round" transform="rotate(-90 14 14)" />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{Number(value).toFixed(1)}</span>
    </div>
  );
}

/* ── Toast ── */
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (msg) { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }
  }, [msg]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "white",
      border: `1.5px solid ${type === "error" ? "#fca5a5" : "#86efac"}`,
      borderLeft: `4px solid ${type === "error" ? "#dc2626" : "#16a34a"}`,
      color: "#1e293b",
      borderRadius: 10, padding: "13px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 13.5, fontWeight: 500, maxWidth: 380,
      animation: "ss-slideup 0.2s ease",
    }}>
      <span style={{ color: type === "error" ? "#dc2626" : "#16a34a", flexShrink: 0 }}>
        {type === "error" ? Icon.alert : Icon.checkCircle}
      </span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 2 }}>
        {Icon.x}
      </button>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  @keyframes ss-slideup { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes ss-fadein  { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes ss-spin    { to { transform: rotate(360deg); } }
  @keyframes ss-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  *, *::before, *::after { box-sizing: border-box; }
  .ss-root { font-family: 'Inter', sans-serif; min-height: 100vh; background: #f4f5f7; color: #1e293b; }
  .ss-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .ss-skel { background: linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%); background-size:200% 100%; animation:ss-shimmer 1.4s infinite; border-radius:8px; }
  .ss-btn { border:none; cursor:pointer; font-family:'Inter',sans-serif; font-weight:600; border-radius:8px; transition:all 0.13s ease; line-height:1; display:inline-flex; align-items:center; gap:6px; }
  .ss-btn:hover:not(:disabled) { filter:brightness(0.96); }
  .ss-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .ss-btn-primary { background:#1d4ed8; color:#fff; padding:9px 20px; font-size:13.5px; }
  .ss-btn-primary:hover:not(:disabled) { background:#1e40af; }
  .ss-btn-danger  { background:#dc2626; color:#fff; padding:9px 20px; font-size:13.5px; }
  .ss-btn-danger:hover:not(:disabled)  { background:#b91c1c; }
  .ss-btn-outline { background:#fff; color:#374151; border:1.5px solid #e2e8f0; padding:7px 14px; font-size:12.5px; }
  .ss-btn-outline:hover:not(:disabled) { background:#f8fafc; border-color:#cbd5e1; }
  .ss-btn-outline.active { background:#eff6ff; color:#1d4ed8; border-color:#93c5fd; }
  .ss-select { width:100%; border:1.5px solid #e2e8f0; border-radius:8px; padding:9px 34px 9px 12px; font-size:13px; font-family:'Inter',sans-serif; background:#fff; color:#1e293b; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 11px center; outline:none; transition:border-color 0.13s; cursor:pointer; }
  .ss-select:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
  .ss-input-label { display:block; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
  .ss-tab { padding:7px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:'Inter',sans-serif; transition:all 0.13s; }
  .ss-tab.active { background:#1d4ed8; color:#fff; }
  .ss-tab:not(.active) { background:transparent; color:#64748b; }
  .ss-tab:not(.active):hover { background:#e8edf5; color:#1e293b; }
  .ss-filter-btn { padding:5px 12px; font-size:12px; font-weight:600; border-radius:6px; cursor:pointer; border:1.5px solid #e2e8f0; font-family:'Inter',sans-serif; background:#fff; color:#6b7280; transition:all 0.12s; }
  .ss-filter-btn.active { border-color:#2563eb; background:#eff6ff; color:#1d4ed8; }
  .ss-filter-btn:hover:not(.active) { background:#f8fafc; }
  .ss-popover { position:absolute; top:calc(100% + 6px); right:0; z-index:200; background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; box-shadow:0 8px 28px rgba(0,0,0,0.12); width:268px; animation:ss-fadein 0.16s ease; }
  .ss-lab-row { border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; display:grid; grid-template-columns:1fr auto; gap:16px; align-items:center; background:#fff; transition:border-color 0.13s, box-shadow 0.13s; }
  .ss-lab-row:hover { border-color:#bfdbfe; box-shadow:0 2px 8px rgba(37,99,235,0.06); }
  .ss-history-wrap { overflow-x:auto; width:100%; overflow-y:visible; }
  .ss-history-head { display:grid; grid-template-columns:130px minmax(160px,1fr) 84px 148px 148px 56px 106px; gap:8px; padding:10px 16px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:10.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.07em; min-width:860px; }
  .ss-history-row  { display:grid; grid-template-columns:130px minmax(160px,1fr) 84px 148px 148px 56px 106px; gap:8px; align-items:start; padding:12px 16px; border-bottom:1px solid #f1f5f9; font-size:13px; transition:background 0.1s; min-width:860px; overflow:visible; }
  .ss-history-row:last-child { border-bottom:none; }
  .ss-history-row:hover { background:#fafbff; }
  .ss-action-opt { display:flex; align-items:center; gap:10px; padding:9px 11px; border:1.5px solid #e8edf5; border-radius:8px; cursor:pointer; background:#fff; text-align:left; width:100%; transition:all 0.12s; font-family:'Inter',sans-serif; }
  .ss-action-opt:hover { border-color:#bfdbfe; background:#f8fbff; }
  .ss-action-opt.selected-edit { border-color:#93c5fd; background:#eff6ff; }
  .ss-action-opt.selected-delete { border-color:#fca5a5; background:#fef2f2; }
  .ss-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; animation:ss-spin 0.65s linear infinite; display:inline-block; }
  @media (max-width:960px) {
    .ss-history-head, .ss-history-row { grid-template-columns:1fr 1fr; }
    .ss-col-hide { display:none; }
  }
`;

/* ── Popover Portal — renders fixed, flips up if near bottom ── */
function PopoverPortal({ pos, onClose, children }) {
  const ref = useRef();
  const [style, setStyle] = useState({
    position: "fixed",
    top: pos.top,
    left: pos.left,
    zIndex: 9000,
    visibility: "hidden", // hide until positioned
  });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    let top = pos.top;
    let left = pos.left;
    // flip upward if overflows bottom
    if (top + h > window.innerHeight - 12) {
      // flip above the button: btnTop - popoverHeight - gap
      top = (pos.btnTop ?? pos.top) - h - 6;
    }
    // clamp left so it doesn't overflow right edge
    if (left + w > window.innerWidth - 12) {
      left = window.innerWidth - w - 12;
    }
    if (left < 8) left = 8;
    setStyle({ position: "fixed", top, left, zIndex: 9000, visibility: "visible" });
  }, [pos, children]); // re-run when content changes (e.g. file picker appears)

  return (
    <div ref={ref} className="ss-popover" style={style}>
      {children}
    </div>
  );
}

export default function StudentSubmissions() {
  const [labs, setLabs] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ assessment_id: "", file: null });
  const [rowFiles, setRowFiles] = useState({});
  const [rowActions, setRowActions] = useState({});
  const [rowBusy, setRowBusy] = useState({});
  const [openPopover, setOpenPopover] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [activeTab, setActiveTab] = useState("labs");
  const [filterStatus, setFilterStatus] = useState("all");

  const showToast = (msg, type = "success") => setToast({ msg, type });
  const clearToast = () => setToast({ msg: "", type: "success" });

  const load = async () => {
    setLoading(true);
    try {
      const [labsRes, sRes] = await Promise.all([
        fetch(api("/api/assessments/student/labs"), { headers: getAuthHeaders(false) }),
        fetch(api("/api/submissions/me"), { headers: getAuthHeaders(false) }),
      ]);
      const lj = await labsRes.json().catch(() => ({}));
      const sj = await sRes.json().catch(() => ({}));
      const labList = lj?.data ?? lj?.recordset ?? [];
      setLabs(Array.isArray(labList) ? labList : []);
      const list = sj?.data ?? sj?.recordset ?? sj;
      setRows(Array.isArray(list) ? list : []);
    } catch (e) { showToast(e.message || "Failed to load data", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".ss-popover") && !e.target.closest("[data-manage-btn]"))
        setOpenPopover(null);
    };
    const onScroll = () => setOpenPopover(null);
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const submittable = labs.filter((l) => l.can_submit);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assessment_id || !form.file) { showToast("Select an assessment and attach a file.", "error"); return; }
    const id = Number(String(form.assessment_id).trim());
    if (!submittable.some((l) => Number(l.assessment_id) === id)) { showToast("This assessment is not currently open for submission.", "error"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("assessment_id", String(id));
      fd.append("file", form.file);
      const res = await fetch(api("/api/submissions/upload"), { method: "POST", headers: getAuthHeaders(false), body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || data.message || "Upload failed");
      showToast(data.message || "Submission uploaded successfully.");
      setForm({ assessment_id: "", file: null });
      await load();
    } catch (err) { showToast(err.message || "Upload failed", "error"); }
    finally { setUploading(false); }
  };

  const executeRowAction = async (row) => {
    const action = rowActions[row.submission_id];
    if (!action) { showToast("Select an action first.", "error"); return; }
    if (!canManage(row.due_date)) { showToast("The deadline has passed. No further changes are permitted.", "error"); return; }
    setRowBusy((p) => ({ ...p, [row.submission_id]: true }));
    try {
      if (action === "delete") {
        const res = await fetch(api(`/api/submissions/me/${row.submission_id}`), { method: "DELETE", headers: getAuthHeaders(false) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.error || "Delete failed");
        showToast("Submission removed.");
      } else {
        const f = rowFiles[row.submission_id];
        if (!f) throw new Error("Attach a PDF or DOCX file before applying.");
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch(api(`/api/submissions/me/${row.submission_id}/${action === "edit" ? "edit" : "resubmit"}`), {
          method: action === "edit" ? "PUT" : "POST", headers: getAuthHeaders(false), body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.error || "Request failed");
        showToast(action === "edit" ? "File replaced successfully." : "New attempt submitted.");
      }
      setRowActions((p) => ({ ...p, [row.submission_id]: "" }));
      setRowFiles((p) => ({ ...p, [row.submission_id]: null }));
      setOpenPopover(null);
      await load();
    } catch (err) { showToast(err.message || "Action failed", "error"); }
    finally { setRowBusy((p) => ({ ...p, [row.submission_id]: false })); }
  };

  const stats = {
    total: labs.length,
    open: labs.filter((l) => ["open","open_late","open_resubmit"].includes(l.lab_status)).length,
    submitted: labs.filter((l) => ["submitted","resubmitted"].includes(l.lab_status)).length,
    published: labs.filter((l) => l.lab_status === "published").length,
  };

  const filteredLabs = labs.filter((l) => {
    if (filterStatus === "open")      return ["open","open_late","open_resubmit"].includes(l.lab_status);
    if (filterStatus === "submitted") return ["submitted","resubmitted"].includes(l.lab_status);
    if (filterStatus === "done")      return ["published","evaluated"].includes(l.lab_status);
    return true;
  });

  return (
    <div className="ss-root">
      <style>{CSS}</style>
      <StudentNavbar activePage="Submissions" />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Submissions</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#64748b" }}>
              Upload and manage your lab assessment submissions
            </p>
          </div>
          <Link to="/student" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            textDecoration: "none", fontSize: 13, fontWeight: 600, color: "#374151",
            background: "#fff", padding: "8px 14px", borderRadius: 8,
            border: "1.5px solid #e2e8f0", transition: "all 0.13s",
          }}>
            ← Dashboard
          </Link>
        </div>

        {/* ── STAT SUMMARY ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
          {[
            { label: "Total Labs",  value: stats.total,     accent: "#6366f1" },
            { label: "Open",        value: stats.open,      accent: "#0369a1" },
            { label: "Submitted",   value: stats.submitted, accent: "#92400e" },
            { label: "Published",   value: stats.published, accent: "#14532d" },
          ].map((s) => (
            <div key={s.label} className="ss-card" style={{ padding: "14px 18px" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.label}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
                {loading
                  ? <span className="ss-skel" style={{ display: "inline-block", width: 32, height: 24 }} />
                  : s.value
                }
              </p>
            </div>
          ))}
        </div>

        {/* ── UPLOAD PANEL ── */}
        <div className="ss-card" style={{ marginBottom: 22, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#2563eb" }}>{Icon.upload}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Submit New Work</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Select an open assessment and attach your file</p>
            </div>
          </div>
          <div style={{ padding: "18px 20px" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="ss-input-label">Assessment</label>
                  <select className="ss-select" value={form.assessment_id}
                    onChange={(e) => setForm((f) => ({ ...f, assessment_id: e.target.value }))}>
                    <option value="">
                      {submittable.length === 0 ? "No assessments currently open" : "Select an assessment…"}
                    </option>
                    {submittable.map((a) => (
                      <option key={a.assessment_id} value={a.assessment_id}>
                        {a.subject_code ? `[${a.subject_code}] ` : ""}{a.assessment_title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ss-input-label">File</label>
                  <FileDropZone value={form.file} onChange={(f) => setForm((p) => ({ ...p, file: f }))} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                {form.assessment_id && form.file && (
                  <span style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                    {Icon.check} Ready to submit
                  </span>
                )}
                <button type="submit" className="ss-btn ss-btn-primary"
                  disabled={uploading || submittable.length === 0 || !form.assessment_id || !form.file}>
                  {uploading
                    ? <><span className="ss-spinner" /> Uploading…</>
                    : <>{Icon.upload} Upload Submission</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 2, background: "#e8edf5", padding: 3, borderRadius: 10 }}>
            {[
              { id: "labs",    label: "Lab Assignments",    count: labs.length },
              { id: "history", label: "Submission History", count: rows.length },
            ].map((t) => (
              <button key={t.id} className={`ss-tab${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}>
                {t.label}
                <span style={{
                  marginLeft: 6, fontSize: 10.5, fontWeight: 700,
                  background: activeTab === t.id ? "rgba(255,255,255,0.2)" : "#d1d9e6",
                  color: activeTab === t.id ? "white" : "#64748b",
                  padding: "1px 7px", borderRadius: 999,
                }}>{t.count}</span>
              </button>
            ))}
          </div>

          {activeTab === "labs" && (
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { id: "all",       label: "All" },
                { id: "open",      label: "Open" },
                { id: "submitted", label: "Submitted" },
                { id: "done",      label: "Graded" },
              ].map((f) => (
                <button key={f.id}
                  className={`ss-filter-btn${filterStatus === f.id ? " active" : ""}`}
                  onClick={() => setFilterStatus(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── LAB ASSIGNMENTS ── */}
        {activeTab === "labs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="ss-skel" style={{ height: 78 }} />)
            ) : filteredLabs.length === 0 ? (
              <div className="ss-card" style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>{Icon.clipboardList}</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#374151" }}>No assignments found</p>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#9ca3af" }}>Try a different filter or check back later</p>
              </div>
            ) : filteredLabs.map((lab) => {
              const timeLeft = formatCountdown(lab.seconds_remaining);
              const score = lab.marking_status === "PUBLISHED" && lab.total_marks_awarded != null
                ? lab.total_marks_awarded : null;
              return (
                <div key={lab.assessment_id} className="ss-lab-row">
                  {/* Left */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5" }}>
                      {Icon.beaker}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{lab.assessment_title}</span>
                        <StatusBadge lab={lab} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {lab.subject_code && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "1px 6px", borderRadius: 5, fontSize: 10.5, color: "#475569" }}>
                            {lab.subject_code}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{lab.subject_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
                    {lab.due_date && (
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Due date</p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#374151", fontWeight: 500 }}>{formatDate(lab.due_date)}</p>
                      </div>
                    )}
                    {timeLeft && (
                      <div style={{ textAlign: "center", minWidth: 56 }}>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                          {Icon.clock} Left
                        </p>
                        <p style={{ margin: "3px 0 0", fontSize: 13.5, fontWeight: 700, color: urgencyColor(lab.seconds_remaining) }}>
                          {timeLeft}
                        </p>
                      </div>
                    )}
                    <div style={{ minWidth: 48, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mark</p>
                      <ScoreRing value={score} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SUBMISSION HISTORY ── */}
        {activeTab === "history" && (
          <div className="ss-card" style={{ overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="ss-skel" style={{ height: 52 }} />)}
              </div>
            ) : rows.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>{Icon.inbox}</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#374151" }}>No submissions yet</p>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#9ca3af" }}>Upload your first assignment using the form above</p>
              </div>
            ) : (
              <div className="ss-history-wrap">
                <div className="ss-history-head">
                  <div>Subject</div>
                  <div>Assessment</div>
                  <div>Status</div>
                  <div>Submitted At</div>
                  <div>Deadline</div>
                  <div>Attempt</div>
                  <div>Actions</div>
                </div>

                {rows.map((r) => {
                  const manageable = canManage(r.due_date);
                  const isOpen = openPopover === r.submission_id;
                  const action = rowActions[r.submission_id] || "";

                  return (
                    <div key={r.submission_id} className="ss-history-row">
                      {/* Subject */}
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{r.subject_name || "—"}</p>
                        {r.subject_code && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#94a3b8", background: "#f8fafc", border: "1px solid #f1f5f9", padding: "1px 5px", borderRadius: 4, marginTop: 2, display: "inline-block" }}>
                            {r.subject_code}
                          </span>
                        )}
                      </div>

                      {/* Assessment */}
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#374151" }} title={r.assessment_title}>{r.assessment_title}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }} title={r.original_file_name}>
                          <span style={{ flexShrink: 0 }}>{Icon.paperclip}</span>
                          {r.original_file_name || "—"}
                        </p>
                      </div>

                      {/* On-time / Late */}
                      <div>
                        {r.is_late ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fff7ed", color: "#b45309", border: "1px solid #fde68a", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                            Late
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                            {Icon.check} On time
                          </span>
                        )}
                      </div>

                      {/* Submitted at */}
                      <div style={{ fontSize: 12, color: "#4b5563" }}>{formatDate(r.submitted_at)}</div>

                      {/* Deadline */}
                      <div style={{ fontSize: 12, color: "#4b5563" }}>{formatDate(r.due_date)}</div>

                      {/* Attempt */}
                      <div>
                        <span style={{ display: "inline-block", background: "#f1f5f9", color: "#475569", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                          #{r.attempt_no}
                        </span>
                      </div>

                      {/* Manage popover */}
                      <div>
                        {manageable ? (
                          <button
                            data-manage-btn="1"
                            className={`ss-btn ss-btn-outline${isOpen ? " active" : ""}`}
                            onClick={(e) => {
                              if (isOpen) {
                                setOpenPopover(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const popoverWidth = 270;
                                let left = rect.left;
                                if (left + popoverWidth > window.innerWidth - 12) {
                                  left = rect.right - popoverWidth;
                                }
                                setPopoverPos({ top: rect.bottom + 6, left, btnTop: rect.top });
                                setOpenPopover(r.submission_id);
                              }
                            }}
                          >
                            {Icon.settings}
                            Manage
                            {isOpen ? Icon.chevronUp : Icon.chevronDown}
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
                            {Icon.lock} Deadline passed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FIXED POPOVER PORTAL ── */}
      {openPopover && (() => {
        const r = rows.find((x) => x.submission_id === openPopover);
        if (!r) return null;
        const action = rowActions[r.submission_id] || "";
        return (
          <PopoverPortal
            pos={popoverPos}
            onClose={() => setOpenPopover(null)}
          >
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Select Action
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "edit",     Ico: Icon.edit,    label: "Replace file",      desc: "Overwrite with a new file (same attempt)" },
                { id: "resubmit", Ico: Icon.refresh,  label: "New attempt",        desc: "Submit a fresh attempt" },
                { id: "delete",   Ico: Icon.trash,   label: "Remove submission",  desc: "Delete this submission permanently" },
              ].map((opt) => {
                const sel = action === opt.id;
                const cls = sel ? (opt.id === "delete" ? "selected-delete" : "selected-edit") : "";
                return (
                  <button key={opt.id}
                    className={`ss-action-opt ${cls}`}
                    onClick={() => setRowActions((p) => ({ ...p, [r.submission_id]: sel ? "" : opt.id }))}>
                    <span style={{ color: sel ? (opt.id === "delete" ? "#dc2626" : "#1d4ed8") : "#6b7280", flexShrink: 0 }}>
                      {opt.Ico}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: sel ? (opt.id === "delete" ? "#dc2626" : "#1d4ed8") : "#0f172a" }}>
                        {opt.label}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {(action === "edit" || action === "resubmit") && (
              <div style={{ marginTop: 10 }}>
                <FileDropZone compact
                  value={rowFiles[r.submission_id] || null}
                  onChange={(f) => setRowFiles((p) => ({ ...p, [r.submission_id]: f }))} />
              </div>
            )}

            {action && (
              <button
                className={`ss-btn ${action === "delete" ? "ss-btn-danger" : "ss-btn-primary"}`}
                style={{ width: "100%", marginTop: 10, justifyContent: "center", padding: "10px" }}
                disabled={rowBusy[r.submission_id]}
                onClick={() => executeRowAction(r)}>
                {rowBusy[r.submission_id]
                  ? <><span className="ss-spinner" /> Processing…</>
                  : action === "delete" ? "Confirm Delete" : "Confirm & Apply"
                }
              </button>
            )}
          </PopoverPortal>
        );
      })()}

      <Toast msg={toast.msg} type={toast.type} onClose={clearToast} />
    </div>
  );
}