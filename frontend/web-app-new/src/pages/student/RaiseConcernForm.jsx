import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StudentNavbar from "./StudentNavbar";

// Success Popup Component (same as mark publishing UI)
const SuccessPopup = ({ isVisible, onClose, message, title, details, onAutoClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
        if (onAutoClose) onAutoClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, onAutoClose]);

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
          
          <div style={autoCloseHintStyle}>
            Redirecting in 4 seconds...
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RaiseConcernForm({ submission: propSubmission, onBack, onSubmitted, showNavbar = true }) {

  const navigate = useNavigate();
  const location = useLocation();
  
  // Get submission from prop OR location state
  const submission = propSubmission || location.state?.submission;
  
  // Debug log
  console.log("RaiseConcernForm - location.state:", location.state);
  console.log("RaiseConcernForm - submission:", submission);

  // ── Session ──────────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [concernWindowOpen, setConcernWindowOpen] = useState(true);
  const [windowCheckLoading, setWindowCheckLoading] = useState(true);
  const [remainingHours, setRemainingHours] = useState(null);

  // ── Form ─────────────────────────────────────────────────────────────────
  const [concernMessage, setConcernMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // ── Popup State ──────────────────────────────────────────────────────────
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDetails, setPopupDetails] = useState({});

  // ── Mock session for testing (since session endpoint returns 404) ─────────
  useEffect(() => {
    // Mock session data for testing
    const mockSession = {
      student_id: "2",
      student_name: "Nadeesha S.",
      student_email: "nadeesha@example.com",
      academic_year: submission?.academic_year || "2024/2025"
    };
    setSession(mockSession);
    setSessionLoading(false);
  }, [submission]);

  // ── Use the submission data passed from parent ────────────────────────────
  useEffect(() => {
    if (submission) {
      console.log("Submission received in form:", submission);
      // Set concern window status from the passed submission data
      setConcernWindowOpen(submission.concern_window_open === true || submission.concern_window_open === 1);
      setWindowCheckLoading(false);
    } else {
      console.log("No submission received in form");
    }
  }, [submission]);

  // Real-time validation
  const validateField = (value) => {
    if (!value || value.trim() === "") {
      return "Please describe your concern in detail";
    } else if (value.trim().length < 20) {
      return `Please provide more details (minimum 20 characters, currently ${value.trim().length})`;
    } else if (value.trim().length > 2000) {
      return "Concern message cannot exceed 2000 characters";
    }
    return null;
  };

  // Handle real-time input change with immediate validation
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setConcernMessage(value);
    setTouched({ ...touched, concernMessage: true });
    
    // Real-time validation
    const error = validateField(value);
    setErrors(prev => ({
      ...prev,
      concernMessage: error
    }));
  };

  // Handle blur
  const handleBlur = () => {
    setTouched({ ...touched, concernMessage: true });
    const error = validateField(concernMessage);
    setErrors(prev => ({
      ...prev,
      concernMessage: error
    }));
  };

  // Validation for submit
  const validate = () => {
    const error = validateField(concernMessage);
    if (error) {
      setErrors({ concernMessage: error });
      setTouched({ concernMessage: true });
      return false;
    }
    return true;
  };

  // Handle navigation back to marks
  const handleBackToMarks = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/student/marks");
    }
  };

  // Handle popup close and navigation
  const handlePopupClose = () => {
    setShowSuccessPopup(false);
    handleBackToMarks();
  };

  // Submit Form Data
  const handleSubmit = async () => {
    if (!validate()) return;
    
    setSubmitting(true);

    // Prepare data according to your backend requirements
    const formData = {
      student_id: session?.student_id,
      student_name: session?.student_name,
      student_email: session?.student_email,
      academic_year: submission?.academic_year,
      submission_id: submission?.submission_id,
      concern_message: concernMessage.trim()
    };

    console.log("Submitting concern:", formData);

    try {
      const res = await fetch("/api/concern", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      
      const responseData = await res.json();
      
      if (res.ok) {
        // Show success popup
        setPopupTitle("✓ Concern Submitted");
        setPopupMessage(`Your concern for "${submission?.assignment_name}" has been successfully submitted.`);
        setPopupDetails({
          "Submission ID": submission?.submission_id,
          "Assignment": submission?.assignment_name,
          "Subject": submission?.subject_name,
          "Message Length": `${concernMessage.length} characters`,
          "Status": "Pending Review"
        });
        setShowSuccessPopup(true);
        
        // Call onSubmitted callback if provided
        if (onSubmitted) onSubmitted(responseData);
        
        // Reset form
        setConcernMessage("");
        
        // Note: Navigation will happen after popup closes (4 seconds)
      } else {
        // Handle specific error messages
        if (responseData.message) {
          setErrors({ submit: responseData.message });
        } else {
          throw new Error("Failed to submit concern");
        }
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setErrors({ submit: "Failed to submit concern. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate remaining hours for concern window
  useEffect(() => {
    if (!submission?.published_at) return;

    const calculateRemaining = () => {
      const publishedDate = new Date(submission.published_at);
      const now = new Date();

      const diffMs = Math.max(0, now.getTime() - publishedDate.getTime());
      const hoursSincePublished = diffMs / (1000 * 60 * 60);
      const remaining = Math.max(0, 48 - hoursSincePublished);

      setRemainingHours(Number(remaining.toFixed(1)));
    };

    // Calculate immediately
    calculateRemaining();

    // Then update every minute
    const interval = setInterval(calculateRemaining, 60000);

    return () => clearInterval(interval);
  }, [submission]);

  // Check if concern window is closed
  if (!concernWindowOpen && !windowCheckLoading && submission) {
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
          <button onClick={handleBackToMarks} style={btnSecondary}>← Back to Marks Overview</button>
        </div>
      </div>
    );
  }

  // Validate submission prop
  if (!submission) {
    return (
      <div style={pageStyle}>
        <StudentNavbar activePage="Concerns" />
        <div style={centerStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a2340", margin: "0 0 10px" }}>
            No Submission Selected
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 8px" }}>
            Please select a submission to raise a concern.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 28px" }}>
            Go back to the marks overview and click "Raise Concern" on a submission.
          </p>
          <button onClick={handleBackToMarks} style={btnPrimary}>← Back to Marks Overview</button>
        </div>
      </div>
    );
  }

  // Success State (if popup is not used)
  if (submitted && !showSuccessPopup) {
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
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 28px" }}>
            Priority level will be assigned automatically based on your concern.
          </p>
          <button onClick={handleBackToMarks} style={btnPrimary}>← Back to Marks Overview</button>
        </div>
      </div>
    );
  }

  // Get error message for display
  const getErrorMessage = () => {
    if (touched.concernMessage && errors.concernMessage) {
      return errors.concernMessage;
    }
    return null;
  };

  // Check if message is valid
  const isMessageValid = () => {
    return touched.concernMessage && concernMessage.trim().length >= 20 && concernMessage.trim().length <= 2000;
  };

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <StudentNavbar activePage="Concerns" />

      {/* Success Popup - will auto-navigate after closing */}
      <SuccessPopup
        isVisible={showSuccessPopup}
        onClose={handlePopupClose}
        onAutoClose={handleBackToMarks}
        title={popupTitle}
        message={popupMessage}
        details={popupDetails}
      />

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {onBack && (
          <button onClick={handleBackToMarks} style={backBtnStyle}>← Back to Marks Overview</button>
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
              {remainingHours && remainingHours > 0 && (
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#f59e0b", fontWeight: 500 }}>
                  ⏰ Concern window closes in {remainingHours} hours
                </p>
              )}
            </div>
          </div>

          {/* Error message from submit */}
          {errors.submit && (
            <div style={errorBannerStyle}>
              <span>⚠️</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* ── Student Info — from session─────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>Student Information</SectionLabel>
            <div style={infoGridStyle}>
              <ReadOnlyField label="Student ID" value={session?.student_id} />
              <ReadOnlyField label="Student Name" value={session?.student_name} />
              <ReadOnlyField label="Student Email" value={session?.student_email} />
              <ReadOnlyField label="Academic Year" value={submission.academic_year} highlight />
            </div>
          </div>

          {/* ── Submission Info ──────── */}
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>Submission Details</SectionLabel>
            <div style={infoGridStyle}>
              <ReadOnlyField label="Assignment" value={submission.assignment_name} />
              <ReadOnlyField label="Subject" value={submission.subject_name} />
              <ReadOnlyField label="Marks Received" value={`${submission.mark}/${submission.total}`} />
              <ReadOnlyField label="Published Date" value={submission.published_at ? new Date(submission.published_at).toLocaleDateString() : "—"} />
            </div>
          </div>

          {/* ── Concern Message — user input with real-time validation ───────────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>
              Concern Message <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={concernMessage}
              onChange={handleMessageChange}
              onBlur={handleBlur}
              placeholder="Describe your concern in detail. Be specific about the marks, grading criteria, or sections you are disputing. Include any relevant details that will help the lecturer understand your concern..."
              rows={6}
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: 1.65,
                borderColor: getErrorMessage() ? "#ef4444" : (isMessageValid() ? "#10b981" : "#d1d5db"),
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {getErrorMessage() ? (
                <span style={errorStyle}>{getErrorMessage()}</span>
              ) : isMessageValid() ? (
                <span style={successStyle}>✓ Valid message</span>
              ) : (
                <span style={hintStyle}>Minimum 20 characters required</span>
              )}
              <span style={charCountStyle(concernMessage.length)}>
                {concernMessage.length} / 2000
              </span>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              onClick={handleBackToMarks}
              style={btnSecondary}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || concernMessage.trim().length < 20 || concernMessage.trim().length > 2000}
              style={{
                ...btnPrimary,
                opacity: (submitting || concernMessage.trim().length < 20 || concernMessage.trim().length > 2000) ? 0.7 : 1,
                cursor: (submitting || concernMessage.trim().length < 20 || concernMessage.trim().length > 2000) ? "not-allowed" : "pointer",
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

// ── Popup Styles (same as mark publishing UI) ─────────────────────────────────
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

const autoCloseHintStyle = {
  textAlign: "center",
  fontSize: "11px",
  color: "#9aa8bb",
  padding: "0 24px 20px 24px"
};

// ── Form Styles ──────────────────────────────────────────────────────────────
const pageStyle = { minHeight: "100vh", backgroundColor: "#f8f9fc", fontFamily: "'Segoe UI', sans-serif" };
const centerStyle = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", textAlign: "center", padding: 40 };
const cardStyle = { backgroundColor: "#fff", borderRadius: 18, border: "1px solid #e8eaf0", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: "36px 40px" };
const cardHeaderStyle = { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 28, paddingBottom: 22, borderBottom: "1px solid #f1f5f9" };
const iconWrapStyle = { width: 38, height: 38, borderRadius: 10, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 };
const errorStyle = { color: "#ef4444", fontSize: 12, marginTop: 4, display: "block" };
const successStyle = { color: "#10b981", fontSize: 12, marginTop: 4, display: "block" };
const hintStyle = { color: "#94a3b8", fontSize: 12, marginTop: 4, display: "block" };
const charCountStyle = (length) => ({
  color: length > 1900 ? (length > 2000 ? "#ef4444" : "#f59e0b") : "#94a3b8",
  fontSize: 12,
  marginTop: 4
});
const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #d1d5db", fontSize: 14, color: "#1a2340", outline: "none", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box", transition: "border-color 0.2s" };
const infoGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, padding: 16, borderRadius: 12, backgroundColor: "#f8f9fc", border: "1px solid #e8eaf0" };
const btnPrimary = { padding: "12px 32px", borderRadius: 30, border: "none", background: "linear-gradient(90deg, #1d4ed8, #2563eb)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(37,99,235,0.3)", transition: "all 0.2s" };
const btnSecondary = { padding: "12px 32px", borderRadius: 30, border: "1.5px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s" };
const backBtnStyle = { background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, padding: 0 };
const spinnerStyle = { width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" };
const errorBannerStyle = { backgroundColor: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#dc2626" };

// Add animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes scaleIn {
      0% {
        opacity: 0;
        transform: scale(0);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}