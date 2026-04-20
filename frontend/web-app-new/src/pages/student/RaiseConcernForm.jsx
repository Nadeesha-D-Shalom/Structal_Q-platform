import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StudentNavbar from "./StudentNavbar";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function RaiseConcernForm({ onBack, onSubmitted }) {

  const location = useLocation();
  const navigate = useNavigate();
  const submission = location.state?.submission;

  // ── Session ──────────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [concernWindowOpen, setConcernWindowOpen] = useState(true);
  const [windowCheckLoading, setWindowCheckLoading] = useState(true);

  // ── Submission Details ───────────────────────────────────────────────────
  const [submissionLoading, setSubmissionLoading] = useState(true);
  const [submissionError, setSubmissionError] = useState(null);

  // ── Form ─────────────────────────────────────────────────────────────────
  const [concernMessage, setConcernMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate("/student/marks");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  // ── Fetch session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_BASE_URL}/api/auth/session`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
          setSessionLoading(false);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      }
    };
    fetchSession();
  }, []);

  // ── Fetch submission details ─────────────────────────────────────────────
  useEffect(() => {
    const submissionId = submission?.submission_id;

    if (!submissionId) {
      setSubmissionLoading(false);
      setWindowCheckLoading(false);
      return;
    }

    const fetchSubmissionDetails = async () => {
      setSubmissionLoading(true);
      setSubmissionError(null);

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/student/marks/details/${submissionId}`,
          { credentials: "include" }
        );
        const data = await res.json();

        if (data.success) {
          setConcernWindowOpen(
            data.data.concern_window_open === 1 ||
            data.data.concern_window_open === true
          );
        } else {
          setSubmissionError(
            data.message || "Failed to fetch submission details"
          );
        }
      } catch (err) {
        setSubmissionError("Failed to connect to server");
      } finally {
        setSubmissionLoading(false);
        setWindowCheckLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [submission?.submission_id]);

  // Validation
  const validate = () => {
    const e = {};
    if (!concernMessage.trim()) {
      e.concernMessage = "Please describe your concern in detail";
    } else if (concernMessage.trim().length < 20) {
      e.concernMessage = "Please provide more details (minimum 20 characters)";
    } else if (concernMessage.trim().length > 2000) {
      e.concernMessage = "Concern message cannot exceed 2000 characters";
    }
    return e;
  };

  // Submit Form Data
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    const formData = {
      student_id: session.student_id,
      student_name: session.student_name,
      student_email: session.student_email,
      academic_year: session.academic_year,
      submission_id: submission.submission_id,
      concern_message: concernMessage.trim()
    };

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/concerns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const responseData = await res.json();

      if (res.ok) {
        setSubmitted(true);
        if (onSubmitted) onSubmitted(responseData);
      } else {
        setErrors({ submit: responseData.message || "Failed to submit concern" });
      }
    } catch (err) {
      setErrors({ submit: "Failed to submit concern. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading State
  if (sessionLoading || windowCheckLoading || submissionLoading) {
    return (
      <div style={pageStyle}>
        <StudentNavbar activePage="Concerns" />
        <div style={centerStyle}>
          <div style={spinnerStyle} />
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>
            {sessionLoading ? "Loading your session..." : "Loading submission details..."}
          </p>
        </div>
      </div>
    );
  }

  // Session error
  if (!session) {
    return (
      <div style={pageStyle}>
        <StudentNavbar activePage="Concerns" />
        <div style={centerStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a2340" }}>Session Expired</h2>
          <p style={{ color: "#64748b", marginBottom: 20 }}>Please log in again to continue.</p>
          <button onClick={() => window.location.href = "/"} style={btnPrimary}>Go to Login</button>
        </div>
      </div>
    );
  }

  // Concern window closed
  if (!concernWindowOpen) {
    return (
      <div style={pageStyle}>
        <StudentNavbar activePage="Concerns" />
        <div style={centerStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a2340", margin: "0 0 10px" }}>
            Concern Window Closed
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 8px" }}>
            The 48-hour concern window for this submission has expired.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 28px" }}>
            Concerns can only be raised within 48 hours of mark publication.
          </p>
          <button onClick={() => navigate("/student/marks")} style={btnSecondary}>← Back to Submissions</button>
        </div>
      </div>
    );
  }

  // Success State
  if (submitted) {
    return (
      <div style={pageStyle}>
        <StudentNavbar activePage="Concerns" />
        <div style={centerStyle}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a2340", margin: "0 0 10px" }}>
            Concern Submitted Successfully!
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 6px" }}>
            Your concern has been received and will be reviewed by the lecturer.
          </p>
          <button onClick={() => navigate("/student/marks")} style={btnPrimary}>← Back to Submissions</button>
        </div>
      </div>
    );
  }

  // Submission fetch error
  if (submissionError) {
    return (
      <div style={pageStyle}>
        <StudentNavbar activePage="Concerns" />
        <div style={centerStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a2340", margin: "0 0 10px" }}>
            Submission Not Found
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 28px" }}>{submissionError}</p>
          <button onClick={() => navigate("/student/marks")} style={btnPrimary}>← Back to Submissions</button>
        </div>
      </div>
    );
  }

  // No submission selected
  if (!submission) {
    return (
      <div style={pageStyle}>
        <StudentNavbar activePage="Concerns" />
        <div style={centerStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a2340", margin: "0 0 10px" }}>
            No Submission Selected
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 28px" }}>
            Please select a submission to raise a concern.
          </p>
          <button onClick={() => navigate("/student/marks")} style={btnPrimary}>← Back to Submissions</button>
        </div>
      </div>
    );
  }

  // ── Main Form UI ────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <StudentNavbar activePage="Concerns" />

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {onBack && (
          <button onClick={() => navigate("/student/marks")} style={backBtnStyle}>← Back to Submissions</button>
        )}

        <div style={cardStyle}>
          {/* Header */}
          <div style={cardHeaderStyle}>
            <div style={iconWrapStyle}>⚠️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a2340" }}>
                Raise a Concern
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Priority will be automatically assigned based on your concern message.
              </p>
            </div>
          </div>

          {/* Submit Error Banner */}
          {errors.submit && (
            <div style={errorBannerStyle}>
              <span>⚠️</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Student Information */}
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>Student Information</SectionLabel>
            <div style={infoGridStyle}>
              <ReadOnlyField label="Student ID" value={session.student_id} />
              <ReadOnlyField label="Student Name" value={session.student_name} />
              <ReadOnlyField label="Student Email" value={session.student_email} />
              <ReadOnlyField label="Academic Year" value={session.academic_year} highlight />
            </div>
          </div>

          {/* Submission Details */}
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>Submission Details</SectionLabel>
            <div style={infoGridStyle}>
              <ReadOnlyField label="Assignment" value={submission?.assignment_name} />
              <ReadOnlyField label="Subject" value={submission?.subject_name} />
            </div>
          </div>

          {/* Concern Message */}
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>
              Concern Message <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={concernMessage}
              onChange={e => {
                setConcernMessage(e.target.value);
                setErrors(prev => ({ ...prev, concernMessage: "", submit: "" }));
              }}
              placeholder="Describe your concern in detail. Be specific about the marks, grading criteria, or sections you are disputing..."
              rows={6}
              style={{
                ...inputStyle,
                borderColor: errors.concernMessage ? "#ef4444" : "#d1d5db",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {errors.concernMessage ? (
                <span style={errorStyle}>{errors.concernMessage}</span>
              ) : (
                <span style={hintStyle}>Minimum 20 characters</span>
              )}
              <span style={charCountStyle(concernMessage.length)}>
                {concernMessage.length} / 2000
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button onClick={() => navigate("/student/marks")} style={btnSecondary} disabled={submitting}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || concernMessage.trim().length < 20}
              style={{
                ...btnPrimary,
                opacity: submitting || concernMessage.trim().length < 20 ? 0.7 : 1,
                cursor: submitting || concernMessage.trim().length < 20 ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit Concern →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{ 
    fontSize: 11, 
    fontWeight: 700, 
    color: "#94a3b8", 
    letterSpacing: "0.06em", 
    textTransform: "uppercase", 
    marginBottom: 8 
  }}>
    {children}
  </div>
);

function ReadOnlyField({ label, value, highlight = false }) {
  return (
    <div>
      <div style={{ 
        fontSize: 11, 
        fontWeight: 700, 
        color: "#94a3b8", 
        marginBottom: 4, 
        textTransform: "uppercase", 
        letterSpacing: "0.05em" 
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: highlight ? "#2563eb" : "#374151" 
      }}>
        {value || "—"}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pageStyle = { 
  minHeight: "100vh", 
  backgroundColor: "#f8f9fc", 
  fontFamily: "'Segoe UI', sans-serif" 
};

const centerStyle = { 
  display: "flex", 
  flexDirection: "column", 
  alignItems: "center", 
  justifyContent: "center", 
  minHeight: "calc(100vh - 64px)", 
  textAlign: "center", 
  padding: 40 
};

const cardStyle = { 
  backgroundColor: "#fff", 
  borderRadius: 18, 
  border: "1px solid #e8eaf0", 
  boxShadow: "0 2px 16px rgba(0,0,0,0.06)", 
  padding: "36px 40px" 
};

const cardHeaderStyle = { 
  display: "flex", 
  alignItems: "flex-start", 
  gap: 14, 
  marginBottom: 28, 
  paddingBottom: 22, 
  borderBottom: "1px solid #f1f5f9" 
};

const iconWrapStyle = { 
  width: 38, 
  height: 38, 
  borderRadius: 10, 
  backgroundColor: "#eff6ff", 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  fontSize: 18, 
  flexShrink: 0 
};

const labelStyle = { 
  display: "block", 
  fontSize: 13, 
  fontWeight: 600, 
  color: "#374151", 
  marginBottom: 8 
};

const errorStyle = { 
  color: "#ef4444", 
  fontSize: 12, 
  marginTop: 4, 
  display: "block" 
};

const hintStyle = { 
  color: "#94a3b8", 
  fontSize: 12, 
  marginTop: 4, 
  display: "block" 
};

const charCountStyle = (length) => ({
  color: length > 1900 ? (length > 2000 ? "#ef4444" : "#f59e0b") : "#94a3b8",
  fontSize: 12,
  marginTop: 4
});

const inputStyle = { 
  width: "100%", 
  padding: "11px 14px", 
  borderRadius: 10, 
  border: "1.5px solid #d1d5db", 
  fontSize: 14, 
  color: "#1a2340", 
  outline: "none", 
  fontFamily: "'Segoe UI', sans-serif", 
  boxSizing: "border-box", 
  transition: "border-color 0.2s",
  resize: "vertical",
  lineHeight: 1.65
};

const infoGridStyle = { 
  display: "grid", 
  gridTemplateColumns: "1fr 1fr 1fr 1fr", 
  gap: 14, 
  padding: 16, 
  borderRadius: 12, 
  backgroundColor: "#f8f9fc", 
  border: "1px solid #e8eaf0" 
};

const btnPrimary = { 
  padding: "12px 32px", 
  borderRadius: 30, 
  border: "none", 
  background: "linear-gradient(90deg, #1d4ed8, #2563eb)", 
  color: "#fff", 
  fontSize: 15, 
  fontWeight: 700, 
  cursor: "pointer", 
  display: "inline-flex", 
  alignItems: "center", 
  gap: 8, 
  boxShadow: "0 4px 14px rgba(37,99,235,0.3)", 
  transition: "all 0.2s" 
};

const btnSecondary = { 
  padding: "12px 32px", 
  borderRadius: 30, 
  border: "1.5px solid #d1d5db", 
  background: "#fff", 
  color: "#374151", 
  fontSize: 15, 
  fontWeight: 600, 
  cursor: "pointer", 
  display: "inline-flex", 
  alignItems: "center", 
  gap: 8, 
  transition: "all 0.2s" 
};

const backBtnStyle = { 
  background: "none", 
  border: "none", 
  color: "#2563eb", 
  fontSize: 13, 
  fontWeight: 600, 
  cursor: "pointer", 
  display: "inline-flex", 
  alignItems: "center", 
  gap: 6, 
  marginBottom: 24, 
  padding: 0 
};

const spinnerStyle = { 
  width: 36, 
  height: 36, 
  border: "3px solid #e2e8f0", 
  borderTopColor: "#2563eb", 
  borderRadius: "50%", 
  animation: "spin 0.7s linear infinite", 
  margin: "0 auto" 
};

const errorBannerStyle = { 
  backgroundColor: "#fee2e2", 
  border: "1px solid #fecaca", 
  borderRadius: 10, 
  padding: "12px 16px", 
  marginBottom: 24, 
  display: "flex", 
  alignItems: "center", 
  gap: 10, 
  fontSize: 13, 
  color: "#dc2626" 
};

// Add animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
