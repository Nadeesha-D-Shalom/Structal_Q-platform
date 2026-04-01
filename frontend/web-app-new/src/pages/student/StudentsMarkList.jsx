import { useState, useEffect, useMemo } from "react";
import StudentNavbar from "./StudentNavbar";
import { useNavigate } from "react-router-dom";

const PER_PAGE = 5;

export default function StudentMarksList() {
  const navigate = useNavigate();
  
  // ── Session ──────────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // ── Data ─────────────────────────────────────────────────────────────────
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [academicYearFilter, setAcademicYearFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");

  // ── Search + Sort ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("none");

  // ── Navigation ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Fetch session ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSession(data); setSessionLoading(false); })
      .catch(() => setSessionLoading(false));
  }, []);

  // ── Fetch submissions from backend ───────────────────────────────────────
  useEffect(() => {
    if (!session?.student_id) return;
    setSubmissionsLoading(true);
    setFetchError(false);
    fetch(`/api/submissions/student/${session.student_id}`, { credentials: "include" })
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(data => {
        // Transform data to match expected format
        const formattedData = data.map(item => ({
          ...item,
          total_marks_awarded: item.total_marks_awarded || item.mark,
          concern_window_open: item.concern_window_open === 1 || item.concern_window_open === true
        }));
        setSubmissions(formattedData);
      })
      .catch(() => setFetchError(true))
      .finally(() => setSubmissionsLoading(false));
  }, [session?.student_id]);

  // ── Derived filter options ────────────────────────────────────────────────
  const academicYears = ["All", ...new Set(submissions.map(s => s.academic_year))].filter(Boolean);
  const subjects = ["All", ...new Set(submissions.map(s => s.subject_name))].filter(Boolean);

  // ── Filter + Search + Sort ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...submissions];
    if (academicYearFilter !== "All") list = list.filter(s => s.academic_year === academicYearFilter);
    if (subjectFilter !== "All") list = list.filter(s => s.subject_name === subjectFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.assignment_name?.toLowerCase().includes(q) ||
        s.subject_name?.toLowerCase().includes(q) ||
        s.subject_code?.toLowerCase().includes(q)
      );
    }
    if (sortOrder === "high-low") list.sort((a, b) => (b.total_marks_awarded || 0) - (a.total_marks_awarded || 0));
    if (sortOrder === "low-high") list.sort((a, b) => (a.total_marks_awarded || 0) - (b.total_marks_awarded || 0));
    return list;
  }, [submissions, academicYearFilter, subjectFilter, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page when filters/search/sort change
  useEffect(() => setPage(1), [academicYearFilter, subjectFilter, searchQuery, sortOrder]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalSubjects = new Set(submissions.map(s => s.subject_name)).size;
  const totalAssignments = submissions.length;

  // ── Handle Raise Concern ─────────────────────────────────────────────────
  const handleRaiseConcern = (submission) => {
    // Navigate to raise concern page with submission data
    navigate("/student/raise-concern", { state: { submission } });
  };

  // ── Mark Color Function ─────────────────────────────────────────────────
  const getMarkColor = (mark, total) => {
    if (!mark || !total) return "#6b7280";
    const pct = (mark / total) * 100;
    if (pct >= 75) return "#10b981";
    if (pct >= 55) return "#3b82f6";
    return "#ef4444";
  };

  const initials = session?.student_name
    ?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "S";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f6fa", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Student Navbar */}
      <StudentNavbar activePage="Grades & Marks" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>

        {/* Title Section */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: "bold", color: "#1e293b", margin: "0 0 8px" }}>
            My Academic Results
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            View your published marks and raise concerns if needed
          </p>
        </div>

        {/* Summary Stats - Only Total Subjects and Total Assignments */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            border: "1px solid #e2e8f0", padding: "20px 24px",
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: "#eef2ff", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 24, color: "#3b82f6"
            }}>📚</div>
            <div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Total Subjects</div>
              <div style={{ fontSize: 28, fontWeight: "bold", color: "#0f172a" }}>{totalSubjects}</div>
            </div>
          </div>

          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            border: "1px solid #e2e8f0", padding: "20px 24px",
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: "#eef2ff", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 24, color: "#3b82f6"
            }}>📝</div>
            <div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Total Assignments</div>
              <div style={{ fontSize: 28, fontWeight: "bold", color: "#0f172a" }}>{totalAssignments}</div>
            </div>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 12,
          border: "1px solid #e2e8f0", padding: "20px 24px",
          marginBottom: 24,
        }}>
          {/* Filters Row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            marginBottom: 20, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Filters:</span>

            {/* Academic Year Filter */}
            <FilterDropdown
              value={academicYearFilter}
              onChange={setAcademicYearFilter}
              options={academicYears}
              label="Academic Year"
            />

            {/* Subject Filter */}
            <FilterDropdown
              value={subjectFilter}
              onChange={setSubjectFilter}
              options={subjects}
              label="Subject"
            />

            {/* Export Button */}
            <button style={{
              marginLeft: "auto", padding: "8px 18px", borderRadius: 8,
              border: "1px solid #e2e8f0", backgroundColor: "#fff",
              color: "#475569", fontSize: 13, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s",
            }}>
              📄 Export PDF
            </button>
          </div>

          {/* Search and Sort Bar */}
          <div style={{
            display: "flex", gap: 16,
            alignItems: "center", flexWrap: "wrap",
          }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
              <span style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", fontSize: 16,
                color: "#94a3b8",
              }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by assignment or subject..."
                style={{
                  width: "100%", padding: "10px 12px 10px 38px",
                  borderRadius: 8, border: "1px solid #e2e8f0",
                  fontSize: 13, color: "#1e293b", outline: "none",
                  backgroundColor: "#fff", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", color: "#94a3b8",
                  fontSize: 14,
                }}>✕</button>
              )}
            </div>

            {/* Sort Options */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Sort by:</span>
              {[
                { value: "none", label: "Default" },
                { value: "high-low", label: "Highest ↓" },
                { value: "low-high", label: "Lowest ↑" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortOrder(opt.value)}
                  style={{
                    padding: "6px 14px", borderRadius: 6,
                    fontSize: 12, fontWeight: 500, cursor: "pointer",
                    border: sortOrder === opt.value ? "none" : "1px solid #e2e8f0",
                    backgroundColor: sortOrder === opt.value ? "#3b82f6" : "#fff",
                    color: sortOrder === opt.value ? "#fff" : "#64748b",
                    transition: "all 0.2s",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Search Results Count */}
          {searchQuery.trim() && (
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 16, marginBottom: 0 }}>
              Found {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "<strong>{searchQuery}</strong>"
            </p>
          )}
        </div>

        {/* Marks Table */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden",
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 1.4fr",
            padding: "14px 24px", backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}>
            {["SUBJECT", "ASSIGNMENT", "MARKS", "ACTION"].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {h}
              </span>
            ))}
          </div>

          {/* Loading State */}
          {submissionsLoading && (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div style={spinnerStyle} />
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>Loading your marks...</p>
            </div>
          )}

          {/* Error State */}
          {!submissionsLoading && fetchError && (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <p style={{ color: "#dc2626", fontWeight: 600, margin: "0 0 8px" }}>Failed to load submissions</p>
              <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px" }}>
                Could not connect to the server. Please check your connection.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!submissionsLoading && !fetchError && filtered.length === 0 && (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p style={{ color: "#475569", fontWeight: 600, margin: "0 0 8px" }}>No results found</p>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                Try adjusting your filters or search query.
              </p>
            </div>
          )}

          {/* Table Rows */}
          {!submissionsLoading && !fetchError && paged.map((sub, index) => {
            const mark = sub.total_marks_awarded || sub.mark || 0;
            const total = sub.total || 100;
            const isConcernWindowOpen = sub.concern_window_open === true || sub.concern_window_open === 1;
            
            return (
              <div
                key={sub.submission_id || index}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 1.4fr",
                  padding: "16px 24px", alignItems: "center",
                  borderBottom: index < paged.length - 1 ? "1px solid #f1f5f9" : "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#fafbff"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ""}
              >
                {/* Subject */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{sub.subject_name || "N/A"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub.subject_code || ""}</div>
                </div>

                {/* Assignment */}
                <div>
                  <div style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>{sub.assignment_name || "N/A"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub.academic_year || ""}</div>
                </div>

                {/* Marks */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: "bold", color: getMarkColor(mark, total) }}>
                      {mark}
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>/ {total}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {((mark / total) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Action - Raise Concern Button */}
                {isConcernWindowOpen ? (
                  <button
                    onClick={() => handleRaiseConcern(sub)}
                    style={{
                      padding: "8px 16px", borderRadius: 8, border: "none",
                      backgroundColor: "#ef4444", color: "#fff",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      width: "fit-content", transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#dc2626"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ef4444"}
                  >
                    ⚠ Raise Concern
                  </button>
                ) : (
                  <div style={{
                    padding: "6px 12px", borderRadius: 6,
                    backgroundColor: "#f1f5f9", color: "#94a3b8",
                    fontSize: 11, fontWeight: 500, width: "fit-content",
                  }}>
                    Window Closed
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {!submissionsLoading && !fetchError && filtered.length > 0 && (
            <div style={{
              padding: "16px 24px", display: "flex",
              justifyContent: "space-between", alignItems: "center",
              borderTop: "1px solid #e2e8f0", backgroundColor: "#fafbfc",
            }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} results
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={paginationBtnStyle(false, page === 1)}
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        style={paginationBtnStyle(pageNum === page, false)}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={paginationBtnStyle(false, page === totalPages)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Filter Dropdown Component
function FilterDropdown({ value, onChange, options, label }) {
  return (
    <div style={{ position: "relative", minWidth: 160 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: "8px 32px 8px 12px", borderRadius: 8,
          border: "1px solid #e2e8f0", fontSize: 13,
          color: "#1e293b", backgroundColor: "#fff",
          cursor: "pointer", outline: "none", width: "100%",
          appearance: "none", transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = "#3b82f6"}
        onBlur={e => e.target.style.borderColor = "#e2e8f0"}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt === "All" ? `${label}: All` : `${label}: ${opt}`}
          </option>
        ))}
      </select>
      <span style={{
        position: "absolute", right: 10, top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
        color: "#64748b", fontSize: 12,
      }}>▼</span>
    </div>
  );
}

// Styles
const spinnerStyle = {
  width: 40, height: 40, border: "3px solid #e2e8f0",
  borderTopColor: "#3b82f6", borderRadius: "50%",
  animation: "spin 0.7s linear infinite", margin: "0 auto",
};

const paginationBtnStyle = (active, disabled) => ({
  padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: active ? 600 : 500,
  border: active ? "none" : "1px solid #e2e8f0",
  backgroundColor: active ? "#3b82f6" : "#fff",
  color: active ? "#fff" : "#64748b",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  transition: "all 0.2s",
});

// Add spinner animation to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}