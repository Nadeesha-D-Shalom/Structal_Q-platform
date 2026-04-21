import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "./StudentNavbar";
import { getApiBaseUrl } from "../../utils/apiBase";

const API_BASE = `${getApiBaseUrl()}/api/timetable`;

// ─── Inline Styles & Theme ────────────────────────────────────────────────────
const theme = {
  bg: "#F0F2F8",
  surface: "#FFFFFF",
  surfaceAlt: "#F8F9FC",
  border: "#E2E6F0",
  borderStrong: "#C8CFDF",
  accent: "#2D52A0",
  accentLight: "#EEF2FF",
  accentMid: "#4F72C4",
  text: "#151C2E",
  textMid: "#475470",
  textSoft: "#8A93A8",
  success: "#1A7F5A",
  successBg: "#EDFBF4",
  new: "#C05500",
  newBg: "#FFF4EA",
  danger: "#C42B2B",
  dangerBg: "#FFF0F0",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .st-root {
    min-height: 100vh;
    background: ${theme.bg};
    font-family: 'DM Sans', sans-serif;
    color: ${theme.text};
  }

  .st-main {
    max-width: 1080px;
    margin: 0 auto;
    padding: 40px 32px 60px;
  }

  /* Page Header */
  .st-page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 32px;
    gap: 16px;
  }
  .st-page-title {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: ${theme.text};
    line-height: 1.2;
  }
  .st-page-subtitle {
    margin-top: 4px;
    font-size: 13.5px;
    color: ${theme.textSoft};
    font-weight: 400;
  }

  /* Badge */
  .st-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
  .st-badge-new {
    background: ${theme.newBg};
    color: ${theme.new};
    border: 1px solid #F5C896;
  }
  .st-badge-current {
    background: ${theme.accentLight};
    color: ${theme.accent};
    border: 1px solid #BFD0FF;
  }
  .st-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  /* Timetable Card */
  .st-card {
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(30,40,80,0.05), 0 4px 16px rgba(30,40,80,0.04);
    transition: box-shadow 0.2s;
  }
  .st-card:hover {
    box-shadow: 0 2px 8px rgba(30,40,80,0.09), 0 8px 24px rgba(30,40,80,0.07);
  }

  /* Card Header */
  .st-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px 14px;
    border-bottom: 1px solid ${theme.border};
    background: ${theme.surfaceAlt};
    gap: 12px;
    flex-wrap: wrap;
  }
  .st-card-header-left { display: flex; flex-direction: column; gap: 4px; }
  .st-card-title {
    font-size: 17px;
    font-weight: 700;
    color: ${theme.text};
    letter-spacing: -0.3px;
  }
  .st-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .st-meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: ${theme.textMid};
    font-weight: 500;
  }
  .st-meta-sep {
    width: 3px; height: 3px;
    border-radius: 50%;
    background: ${theme.borderStrong};
    display: inline-block;
  }
  .st-spec-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background: ${theme.accentLight};
    color: ${theme.accentMid};
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  /* Table */
  .st-table-wrap { overflow-x: auto; }
  .st-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 560px;
  }
  .st-table thead tr {
    background: #F3F5FB;
  }
  .st-table thead th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: ${theme.textSoft};
    letter-spacing: 0.7px;
    text-transform: uppercase;
    padding: 10px 16px;
    border-bottom: 1px solid ${theme.border};
    white-space: nowrap;
  }
  .st-table tbody tr {
    border-bottom: 1px solid ${theme.border};
    transition: background 0.12s;
  }
  .st-table tbody tr:last-child { border-bottom: none; }
  .st-table tbody tr:hover { background: #F6F8FF; }
  .st-table td {
    padding: 13px 16px;
    font-size: 13.5px;
    color: ${theme.textMid};
    vertical-align: middle;
  }
  .st-subject-code {
    font-family: 'DM Mono', monospace;
    font-size: 12.5px;
    font-weight: 500;
    color: ${theme.accent};
    background: ${theme.accentLight};
    padding: 3px 8px;
    border-radius: 5px;
    display: inline-block;
  }
  .st-subject-name {
    font-weight: 500;
    color: ${theme.text};
  }
  .st-location {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .st-location-icon {
    opacity: 0.45;
    flex-shrink: 0;
  }
  .st-datetime {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .st-date {
    font-weight: 600;
    color: ${theme.text};
    font-size: 13px;
  }
  .st-time {
    font-size: 12px;
    color: ${theme.textSoft};
  }

  /* Card Footer */
  .st-card-footer {
    padding: 10px 20px;
    background: ${theme.surfaceAlt};
    border-top: 1px solid ${theme.border};
    font-size: 11.5px;
    color: ${theme.textSoft};
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Section label */
  .st-section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    margin-top: 8px;
  }
  .st-section-label-text {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: ${theme.textSoft};
    white-space: nowrap;
  }
  .st-section-line {
    flex: 1;
    height: 1px;
    background: ${theme.border};
  }

  /* States */
  .st-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 32px;
    text-align: center;
    gap: 12px;
  }
  .st-state-icon {
    width: 52px; height: 52px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    margin-bottom: 4px;
  }
  .st-state-title {
    font-size: 16px;
    font-weight: 600;
    color: ${theme.text};
  }
  .st-state-desc {
    font-size: 13.5px;
    color: ${theme.textSoft};
    max-width: 320px;
  }

  /* Loading skeleton */
  .st-skeleton {
    background: linear-gradient(90deg, #E8EBF4 25%, #F0F2FA 50%, #E8EBF4 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .st-skeleton-card {
    background: white;
    border: 1px solid ${theme.border};
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 20px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  @media (max-width: 600px) {
    .st-main { padding: 24px 16px 48px; }
    .st-page-title { font-size: 21px; }
    .st-card-header { padding: 14px 16px 12px; }
    .st-table thead th, .st-table td { padding: 10px 12px; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (value) => {
  if (!value) return "—";
  const s = String(value);
  const match = s.match(/(?:T)?(\d{2}):(\d{2})/);
  if (!match) return "—";
  let hh = Number(match[1]);
  const mm = match[2];
  const suffix = hh >= 12 ? "PM" : "AM";
  hh = ((hh + 11) % 12) + 1;
  return `${String(hh).padStart(2, "0")}:${mm} ${suffix}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const examTypeLabel = (type) => {
  const t = String(type || "").trim();
  if (t === "MID") return "Mid-Term Examination";
  if (t === "FINAL") return "Final Examination";
  if (t === "REPEAT") return "Repeat Examination";
  if (!t) return "Examination";
  if (/examination/i.test(t)) return t;
  return `${t} Examination`;
};

const formatPublished = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return `Published ${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function LocationCell({ building, room }) {
  const loc = [building, room].filter(Boolean).join(" · ");
  if (!loc) return <span style={{ color: theme.textSoft }}>—</span>;
  return (
    <span className="st-location">
      <svg className="st-location-icon" width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5S12.5 9.375 12.5 6c0-2.485-2.015-4.5-4.5-4.5Zm0 6.125A1.625 1.625 0 1 1 8 4.25a1.625 1.625 0 0 1 0 3.375Z" fill={theme.accent}/>
      </svg>
      {loc}
    </span>
  );
}

function TimetableCard({ group, isNew }) {
  const published = formatPublished(group.publishedAt);
  const title = group.title || examTypeLabel(group.examType);

  return (
    <div className="st-card">
      <div className="st-card-header">
        <div className="st-card-header-left">
          <div className="st-card-title">{title}</div>
          <div className="st-card-meta">
            <span className="st-meta-chip">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke={theme.textMid} strokeWidth="1.3"/>
                <path d="M5 1.5V4M11 1.5V4M2 6.5h12" stroke={theme.textMid} strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {group.year}
            </span>
            <span className="st-meta-sep" />
            <span className="st-meta-chip">{group.semester}</span>
            {group.specialization && (
              <>
                <span className="st-meta-sep" />
                <span className="st-spec-tag">{group.specialization}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {isNew ? (
            <span className="st-badge st-badge-new">
              <span className="st-badge-dot" />
              Newly Published
            </span>
          ) : (
            <span className="st-badge st-badge-current">
              <span className="st-badge-dot" />
              Current
            </span>
          )}
        </div>
      </div>

      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th>Location</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((s, idx) => (
              <tr key={idx}>
                <td>
                  {s.subject_code
                    ? <span className="st-subject-code">{s.subject_code}</span>
                    : <span style={{ color: theme.textSoft }}>—</span>}
                </td>
                <td>
                  <span className="st-subject-name">{s.subject_name || "—"}</span>
                </td>
                <td>
                  <LocationCell building={s.building_name} room={s.room_name} />
                </td>
                <td>
                  <span className="st-date">{formatDate(s.exam_date)}</span>
                </td>
                <td>
                  <div className="st-datetime">
                    <span className="st-date">{formatTime(s.start_time)}</span>
                    <span className="st-time">to {formatTime(s.end_time)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {published && (
        <div className="st-card-footer">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke={theme.textSoft} strokeWidth="1.3"/>
            <path d="M8 5v3.5l2 1.5" stroke={theme.textSoft} strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {published}
        </div>
      )}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <>
      {[1, 2].map((k) => (
        <div key={k} className="st-skeleton-card">
          <div className="st-skeleton" style={{ height: 18, width: "40%" }} />
          <div className="st-skeleton" style={{ height: 13, width: "25%" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {[1, 2, 3].map((r) => (
              <div key={r} style={{ display: "flex", gap: 16 }}>
                <div className="st-skeleton" style={{ height: 13, width: "10%" }} />
                <div className="st-skeleton" style={{ height: 13, width: "25%" }} />
                <div className="st-skeleton" style={{ height: 13, width: "15%" }} />
                <div className="st-skeleton" style={{ height: 13, width: "20%" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentTimetable() {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");

  const groupedSessions = useMemo(() => {
    const items = Array.isArray(sessions) ? sessions : [];
    const groups = new Map();
    for (const s of items) {
      const year = s.academic_year || "—";
      const semester = s.semester || "—";
      const examType = s.timetable_type || "Examination";
      const timetableId = String(s.exam_timetable_id || "");
      const title = s.timetable_title || "";
      const publishedAt = s.published_at || "";
      const specialization = s.specialization || "";
      const key = `${timetableId}|||${year}|||${semester}|||${examType}|||${title}|||${publishedAt}|||${specialization}`;
      if (!groups.has(key)) {
        groups.set(key, { timetableId, year, semester, examType, title, publishedAt, specialization, rows: [] });
      }
      groups.get(key).rows.push(s);
    }

    const normalized = Array.from(groups.values()).map((g) => ({
      ...g,
      rows: g.rows
        .slice()
        .sort(
          (a, b) =>
            new Date(a.exam_date || 0).getTime() - new Date(b.exam_date || 0).getTime() ||
            String(a.start_time || "").localeCompare(String(b.start_time || ""))
        ),
    }));

    return normalized.sort((a, b) => {
      const at = new Date(a.publishedAt || 0).getTime();
      const bt = new Date(b.publishedAt || 0).getTime();
      return bt - at;
    });
  }, [sessions]);

  const safeGroups =
    groupedSessions.length > 0
      ? groupedSessions
      : sessions.length > 0
        ? [{ timetableId: "fallback", year: "—", semester: "—", examType: "Examination", title: "Examination", publishedAt: null, specialization: "", rows: sessions }]
        : [];

  const currentGroup = safeGroups[0] || null;
  const newGroups = safeGroups.slice(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/student/view`, { headers: getAuthHeaders() });
        const data = res.data?.data ?? [];
        if (!mounted) return;
        setSessions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load student timetable:", e);
        if (!mounted) return;
        setError(e?.response?.data?.error || "Failed to load timetable.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="st-root">
      <style>{css}</style>
      <StudentNavbar activePage="Timetable" />

      <main className="st-main">
        {/* Page Header */}
        <div className="st-page-header">
          <div>
            <h2 className="st-page-title">Exam Timetable</h2>
            <p className="st-page-subtitle">
              {!loading && !error && sessions.length > 0
                ? `${sessions.length} session${sessions.length !== 1 ? "s" : ""} scheduled across ${safeGroups.length} timetable${safeGroups.length !== 1 ? "s" : ""}`
                : "Your upcoming examination schedule"}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && <SkeletonLoader />}

        {/* Error State */}
        {!loading && error && (
          <div className="st-card">
            <div className="st-state">
              <div className="st-state-icon" style={{ background: theme.dangerBg, color: theme.danger }}>⚠</div>
              <div className="st-state-title">Unable to load timetable</div>
              <div className="st-state-desc">{error}</div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sessions.length === 0 && (
          <div className="st-card">
            <div className="st-state">
              <div className="st-state-icon" style={{ background: theme.accentLight, fontSize: 24 }}>📅</div>
              <div className="st-state-title">No timetables published yet</div>
              <div className="st-state-desc">
                Your examination schedule will appear here once it's been published by your institution.
              </div>
            </div>
          </div>
        )}

        {/* Current Timetable */}
        {!loading && !error && currentGroup && (
          <>
            <div className="st-section-label">
              <span className="st-section-label-text">Current</span>
              <div className="st-section-line" />
            </div>
            <TimetableCard group={currentGroup} isNew={false} />
          </>
        )}

        {/* Newly Published Timetables */}
        {!loading && !error && newGroups.length > 0 && (
          <>
            <div className="st-section-label" style={{ marginTop: 28 }}>
              <span className="st-section-label-text" style={{ color: theme.new }}>Newly Published</span>
              <div className="st-section-line" />
            </div>
            {newGroups.map((group, i) => (
              <TimetableCard key={`new-${group.timetableId}-${i}`} group={group} isNew={true} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}