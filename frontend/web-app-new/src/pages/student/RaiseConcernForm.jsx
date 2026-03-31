import { useState, useEffect } from "react";
import logo from "../../assets/logo.png";

const NAV_ITEMS = ["Dashboard", "Submissions", "Grades & Marks", "Timetable", "Concerns"];

/**
 * RaiseConcernForm — Standalone Create Concern Page
 *
 * Data sources:
 *   FROM SESSION  (GET /api/auth/session):
 *     student_id, student_name, student_email, academic_year → auto-filled, read-only
 *     navbar profile corner                                  → auto-filled from session
 *
 *   FROM PROP (submission) — passed when clicking "Raise Concern" on a submission:
 *     submission.submission_id   → sent to backend
 *     submission.assignment_name → shown read-only
 *     submission.subject_name    → shown read-only
 *     submission.assessment_pdf  → shown read-only (filename from the submission record)
 *
 *   USER INPUT:
 *     concern_message → textarea
 *
 *   BACKEND AUTO:
 *     priority_level → detected by backend from concern_message keywords
 *
 * Props:
 *   submission  — { submission_id, assignment_name, subject_name, assessment_pdf }
 *                 passed from the submissions list when clicking "Raise Concern"
 *   onBack      — called when user clicks back
 *   onSubmitted — called after successful submission
 *   showNavbar  — boolean (default: true)
 *
 * Usage example (from your submissions list page):
 *   <RaiseConcernForm
 *     submission={selectedSubmission}
 *     onBack={() => setShowForm(false)}
 *     onSubmitted={() => navigate("/concerns")}
 *   />
 */
export default function RaiseConcernForm({ submission, onBack, onSubmitted, showNavbar = true }) {

  // ── Session ──────────────────────────────────────────────────────────────
  const [session, setSession]               = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // ── Form ─────────────────────────────────────────────────────────────────
  const [concernMessage, setConcernMessage] = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [errors, setErrors]                 = useState({});

  // ── Fetch session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        setSession(data);
      } catch (err) {
        console.error("Session fetch failed:", err);
        setSession(null);
      } finally {
        setSessionLoading(false);
      }
    };
    fetchSession();
  }, []);

  // Validation
  const validate = () => {
    const e = {};
    if (!concernMessage.trim()) e.concernMessage = "Please describe your concern";
    return e;
  };

  // Submit 
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);

    const formData = new FormData();
    // From session
    /*
    formData.append("student_id",      session.student_id);
    formData.append("student_name",    session.student_name);
    formData.append("student_email",   session.student_email);
    formData.append("academic_year",   session.academic_year);
    formData.append("submission_id",   submission.submission_id);
    formData.append("concern_message", concernMessage);
    */

    formData.append("student_id",      "STU - 001");
    formData.append("student_name",    "Navindu");
    formData.append("student_email",   "navindudilmin@gmail.com");
    formData.append("academic_year",   "Y2S2");
    formData.append("submission_id",   submission.submission_id);
    formData.append("concern_message", concernMessage);

    try {
      const res = await fetch("/api/concern", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        setSubmitted(true);
        onSubmitted?.();
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading Session
  if (sessionLoading) {
    return (
      <div style={pageStyle}>
        {showNavbar && <NavbarSkeleton />}
        <div style={centerStyle}>
          <div style={spinnerStyle} />
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>Loading your session...</p>
        </div>
      </div>
    );
  }

  // Session error 
  if (!session) {
    return (
      <div style={pageStyle}>
        {showNavbar && <NavbarSkeleton />}
        <div style={centerStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a2340" }}>Session Expired</h2>
          <p style={{ color: "#64748b", marginBottom: 20 }}>Please log in again to continue.</p>
          <button onClick={() => window.location.href = "/"} style={btnPrimary}>Go to Login</button>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={pageStyle}>
        {showNavbar && <Navbar session={session} />}
        <div style={centerStyle}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a2340", margin: "0 0 10px" }}>
            Concern Submitted!
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 6px" }}>
            Your concern has been received. Priority will be assigned automatically.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 28px" }}>
            A lecturer will review it shortly.
          </p>
          <button onClick={onBack} style={btnPrimary}>← Back to Submissions</button>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const pdfName = submission?.assessment_pdf
    ? submission.assessment_pdf.split(/[\\/]/).pop()
    : null;

  return (
    <div style={pageStyle}>
      {showNavbar && <Navbar session={session} />}

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {onBack && (
          <button onClick={onBack} style={backBtnStyle}>← Back to Submissions</button>
        )}

        <div style={cardStyle}>
          {/* Header */}
          <div style={cardHeaderStyle}>
            <div style={iconWrapStyle}>➕</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a2340" }}>
                Raise a New Concern
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Priority will be automatically assigned based on your concern message.
              </p>
            </div>
          </div>

          {/* ── Student Info — from session, read-only ─────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>Student Information</SectionLabel>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 14, padding: 16, borderRadius: 12,
              backgroundColor: "#f8f9fc", border: "1px solid #e8eaf0"
            }}>
              <ReadOnlyField label="Student ID"    value={session.student_id} />
              <ReadOnlyField label="Student Name"  value={session.student_name} />
              <ReadOnlyField label="Student Email" value={session.student_email} />
              <ReadOnlyField label="Academic Year" value={session.academic_year} highlight />
            </div>
          </div>

          {/* ── Submission Info — from submission prop, read-only ──────── */}
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>Submission Details</SectionLabel>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 14, padding: 16, borderRadius: 12,
              backgroundColor: "#f8f9fc", border: "1px solid #e8eaf0"
            }}>
              <ReadOnlyField label="Assignment"   value={submission?.assignment_name} />
              <ReadOnlyField label="Subject"      value={submission?.subject_name} />
            </div>
          </div>

          {/* ── Assessment PDF — from submission prop, read-only ───────── */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Assessment PDF</label>
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", borderRadius: 10,
              backgroundColor: pdfName ? "#f0fdf4" : "#f8f9fc",
              border: `1.5px solid ${pdfName ? "#86efac" : "#e2e8f0"}`,
            }}>
              <span style={{ fontSize: 26 }}>📄</span>
              <div style={{ flex: 1 }}>
                {pdfName ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>{pdfName}</div>
                    <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>
                      Attached from your submission
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    No PDF found for this submission
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px",
                borderRadius: 20, backgroundColor: "#e0f2fe", color: "#0369a1",
                whiteSpace: "nowrap"
              }}>
                From Submission
              </span>
            </div>
          </div>

          {/* ── Concern Message — user input ───────────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>
              Concern Message <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={concernMessage}
              onChange={e => { setConcernMessage(e.target.value); setErrors(p => ({ ...p, concernMessage: "" })); }}
              placeholder="Describe your concern in detail. Be specific about the marks, criteria, or sections you are disputing..."
              rows={5}
              style={{
                ...inputStyle,
                resize: "vertical", lineHeight: 1.65,
                borderColor: errors.concernMessage ? "#ef4444" : "#d1d5db",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {errors.concernMessage
                ? <span style={errorStyle}>{errors.concernMessage}</span>
                : <span />}
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {concernMessage.length} / 2000
              </span>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                ...btnPrimary,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit Ticket ›"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
    {children}
  </div>
);

function ReadOnlyField({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? "#2563eb" : "#374151" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function Navbar({ session }) {
  const initials = session?.student_name
    ?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "S";

  return (
    <nav style={{
      backgroundColor: "#fff", borderBottom: "1px solid #e8eaf0",
      padding: "0 32px", display: "flex", alignItems: "center",
      height: 64, gap: 32, position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
        <img src={logo} alt="StructalQ" style={{ height: 36 }} />
        <span style={{ fontWeight: 800, fontSize: 20, color: "#1a2340" }}>
          Structal<span style={{ color: "#f5a623" }}>Q</span>
        </span>
      </div>
      {NAV_ITEMS.map(item => (
        <a key={item} href="#" style={{
          color: item === "Concerns" ? "#2563eb" : "#64748b",
          fontWeight: item === "Concerns" ? 600 : 500,
          fontSize: 14, textDecoration: "none",
          borderBottom: item === "Concerns" ? "2px solid #2563eb" : "2px solid transparent",
          paddingBottom: 2,
        }}>{item}</a>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>🔔</button>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>🚪</button>
        {/* Profile from session */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: "#f59e0b", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2340" }}>{session?.student_name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Student ID: {session?.student_id}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavbarSkeleton() {
  return (
    <nav style={{
      backgroundColor: "#fff", borderBottom: "1px solid #e8eaf0",
      padding: "0 32px", display: "flex", alignItems: "center",
      height: 64, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src={logo} alt="StructalQ" style={{ height: 36 }} />
        <span style={{ fontWeight: 800, fontSize: 20, color: "#1a2340" }}>
          Structal<span style={{ color: "#f5a623" }}>Q</span>
        </span>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 80, height: 12, borderRadius: 6, backgroundColor: "#f1f5f9" }} />
        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#f1f5f9" }} />
      </div>
    </nav>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pageStyle       = { minHeight: "100vh", backgroundColor: "#f8f9fc", fontFamily: "'Segoe UI', sans-serif" };
const centerStyle     = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", textAlign: "center", padding: 40 };
const cardStyle       = { backgroundColor: "#fff", borderRadius: 18, border: "1px solid #e8eaf0", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: "36px 40px" };
const cardHeaderStyle = { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 28, paddingBottom: 22, borderBottom: "1px solid #f1f5f9" };
const iconWrapStyle   = { width: 38, height: 38, borderRadius: 10, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 };
const labelStyle      = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 };
const errorStyle      = { color: "#ef4444", fontSize: 12, marginTop: 4, display: "block" };
const inputStyle      = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #d1d5db", fontSize: 14, color: "#1a2340", outline: "none", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" };
const btnPrimary      = { padding: "12px 32px", borderRadius: 30, border: "none", background: "linear-gradient(90deg, #1d4ed8, #2563eb)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(37,99,235,0.3)" };
const backBtnStyle    = { background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, padding: 0 };
const spinnerStyle    = { width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" };
