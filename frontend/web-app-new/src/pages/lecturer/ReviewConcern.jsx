import { useState, useEffect } from "react";
import LecturerNavbar from "./LecturerNavbar";

const API_BASE = process.env.REACT_APP_API_URL || "";
const apiUrl = (path) => `${API_BASE}${path}`;

const getAuthHeaders = (json = true) => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

const getLecturerId = () => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u.user_id ?? u.lecturer_id ?? null;
  } catch {
    return null;
  }
};

const getLecturerName = () => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (!raw) return "Your Lecturer";
    const u = JSON.parse(raw);
    return u.name ?? u.full_name ?? u.lecturer_name ?? "Your Lecturer";
  } catch {
    return "Your Lecturer";
  }
};

// Success Popup Component
const SuccessPopup = ({ isVisible, onClose, message, title, details }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

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
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, concern, onConfirm }) => {
  if (!isOpen) return null;

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "High": return "#dc2626";
      case "Medium": return "#f59e0b";
      case "Low": return "#10b981";
      default: return "#6b7280";
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={deleteModalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={deleteModalHeaderStyle}>
          <div style={warningIconStyle}>⚠️</div>
          <h3 style={deleteModalTitleStyle}>Confirm Deletion</h3>
        </div>
        
        <div style={modalBodyStyle}>
          <p style={deleteMessageStyle}>
            Are you sure you want to delete this concern from <strong>{concern?.student_name}</strong>?
          </p>
          <p style={deleteSubMessageStyle}>
            Concern ID: <strong>{concern?.concern_id}</strong><br/>
            Assignment: <strong>{concern?.assignment}</strong><br/>
            Priority: <strong style={{ color: getPriorityColor(concern?.priority_level) }}>{concern?.priority_level}</strong><br/>
            Status: <strong>{concern?.concern_status}</strong>
          </p>
          <p style={deleteWarningStyle}>
            This action cannot be undone. The concern will be permanently removed from the system.
          </p>
        </div>
        
        <div style={modalFooterStyle}>
          <button onClick={onClose} style={modalCancelBtnStyle}>Cancel</button>
          <button onClick={onConfirm} style={deleteConfirmBtnStyle}>Delete Permanently</button>
        </div>
      </div>
    </div>
  );
};

// View Message Modal
const ViewMessageModal = ({ isOpen, onClose, concern }) => {
  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>Concern Message</h3>
          <button onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>
        
        <div style={modalBodyStyle}>
          <div style={infoSectionStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Student:</span>
              <span style={infoValueStyle}>{concern?.student_name}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Concern ID:</span>
              <span style={infoValueStyle}>{concern?.concern_id}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Assignment:</span>
              <span style={infoValueStyle}>{concern?.assignment}</span>
            </div>
          </div>
          
          <div style={messageSectionStyle}>
            <label style={sectionLabelStyle}>Concern Message</label>
            <div style={messageBoxStyle}>
              "{concern?.concern_message}"
            </div>
          </div>
        </div>
        
        <div style={modalFooterStyle}>
          <button onClick={onClose} style={modalCancelBtnStyle}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Respond Modal — MODIFIED: auto-sends email after successful respond API call
// ─────────────────────────────────────────────────────────────────────────────
const RespondModal = ({ isOpen, onClose, concern, onSend }) => {
  const [comment, setComment] = useState("");
  const [revisedMark, setRevisedMark] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // "sending" | "sent" | "failed" | null

  useEffect(() => {
    if (concern) {
      setComment(concern.lecturer_comment || "");
      setRevisedMark("");
      setSelectedStatus(concern.concern_status || "Pending");
      setErrors({});
      setTouched({});
      setEmailStatus(null);
    }
  }, [concern]);

  const statusOptions = [
    { value: "Pending", label: "Pending", color: "#f59e0b", bgColor: "#fef3c7" },
    { value: "Accepted", label: "Accepted", color: "#10b981", bgColor: "#d1fae5" },
    { value: "Rejected", label: "Rejected", color: "#dc2626", bgColor: "#fee2e2" },
    { value: "Revised", label: "Revised", color: "#3b82f6", bgColor: "#dbeafe" }
  ];

  const validateRevisedMark = (value) => {
    if (!value || value === "") return null;
    const markNum = parseFloat(value);
    if (isNaN(markNum)) return "Please enter a valid number";
    if (markNum < 0) return "Mark cannot be negative";
    if (markNum > 100) return "Mark cannot exceed 100";
    if (markNum === concern?.originalMark)
      return "New mark is the same as the original mark. Please enter a different value or leave blank.";
    return null;
  };

  const validateComment = (value) => {
    if (!value || value.trim() === "") return "Please enter a response comment";
    if (value.trim().length < 10) return "Please provide a detailed response (minimum 10 characters)";
    return null;
  };

  const handleRevisedMarkChange = (e) => {
    const value = e.target.value;
    setRevisedMark(value);
    setTouched(prev => ({ ...prev, revisedMark: true }));
    setErrors(prev => ({ ...prev, revisedMark: validateRevisedMark(value) }));
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setComment(value);
    setTouched(prev => ({ ...prev, comment: true }));
    setErrors(prev => ({ ...prev, comment: validateComment(value) }));
  };

  const handleRevisedMarkBlur = () => {
    setTouched(prev => ({ ...prev, revisedMark: true }));
    setErrors(prev => ({ ...prev, revisedMark: validateRevisedMark(revisedMark) }));
  };

  const handleCommentBlur = () => {
    setTouched(prev => ({ ...prev, comment: true }));
    setErrors(prev => ({ ...prev, comment: validateComment(comment) }));
  };

  const validate = () => {
    const commentError = validateComment(comment);
    const revisedMarkError = validateRevisedMark(revisedMark);
    const newErrors = {};
    if (commentError) newErrors.comment = commentError;
    if (revisedMarkError) newErrors.revisedMark = revisedMarkError;
    setErrors(newErrors);
    setTouched({ comment: true, revisedMark: true });
    return Object.keys(newErrors).length === 0;
  };

  //call the email endpoint
  const handleSend = async () => {
    if (!validate()) return;

    setSending(true);
    try {
      // 1. Save the response to the concern (existing logic, unchanged)
      const response = await fetch(
        apiUrl(`/api/concerns/${encodeURIComponent(concern.concern_id)}/respond`),
        {
          method: "PUT",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            concern_status: selectedStatus,
            lecturer_comment: comment.trim(),
            originalMark: concern.originalMark,
            submission_id: concern.submission_id,
            revised_mark: revisedMark ? parseFloat(revisedMark) : null,
            revised_by: getLecturerId()
          })
        }
      );

      console.log(response);

      if (!response.ok) throw new Error("Failed to send response");

      // 2. Send email notification to the student
      setEmailStatus("sending");
      try {
        const emailPayload = {
          to: concern.student_email,
          student_name: concern.student_name,
          concern_id: concern.concern_id,
          assignment: concern.assignment,
          subject_name: concern.subject,
          subject_code: concern.subject_code,
          priority_level: concern.priority_level,
          original_mark: concern.originalMark,
          revised_mark: revisedMark ? parseFloat(revisedMark) : null,
          concern_status: selectedStatus,
          lecturer_comment: comment.trim(),
          lecturer_name: getLecturerName()
        };

        const emailRes = await fetch(apiUrl("/api/concerns/send-response-email"), {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify(emailPayload)
        });

        console.log(emailRes);

        setEmailStatus(emailRes.ok ? "sent" : "failed");
      } catch {
        setEmailStatus("failed"); // email failure is non-blocking
      }

      // 3. Notify parent component (triggers success popup & list refresh)
      onSend({
        concern_id: concern.concern_id,
        student_email: concern.student_email,
        student_name: concern.student_name,
        comment: comment.trim(),
        revised_mark: revisedMark ? parseFloat(revisedMark) : null,
        assignment: concern.assignment,
        original_mark: concern.originalMark,
        priority: concern.priority_level,
        status: selectedStatus
      });

      onClose();
    } catch (err) {
      console.error("Error sending response:", err);
      alert("Failed to send response. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "#dc2626";
      case "Medium": return "#f59e0b";
      case "Low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getStatusStyle = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return {
      backgroundColor: option?.bgColor || "#f3f4f6",
      color: option?.color || "#6b7280",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600"
    };
  };

  const isFormValid = () => {
    return !validateComment(comment) && !validateRevisedMark(revisedMark) && comment.trim() !== "";
  };

  const getRevisedMarkBorderColor = () => {
    if (!touched.revisedMark) return "#dde3eb";
    if (errors.revisedMark) return "#ff4d4f";
    if (revisedMark && !errors.revisedMark) return "#10b981";
    return "#dde3eb";
  };

  const getCommentBorderColor = () => {
    if (!touched.comment) return "#dde3eb";
    if (errors.comment) return "#ff4d4f";
    if (comment && !errors.comment) return "#10b981";
    return "#dde3eb";
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>Respond to Concern</h3>
          <button onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>

        <div style={modalBodyStyle}>
          {/* Email recipient notice */}
          <div style={emailNoticeStyle}>
            <span style={emailNoticeIconStyle}>📧</span>
            <span style={emailNoticeTextStyle}>
              A response email will be automatically sent to <strong>{concern?.student_email}</strong> after submitting.
            </span>
          </div>

          <div style={infoBoxStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Student:</span>
              <span style={infoValueStyle}>{concern?.student_name}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Assignment:</span>
              <span style={infoValueStyle}>{concern?.assignment}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Priority:</span>
              <span style={{ ...infoValueStyle, color: getPriorityColor(concern?.priority_level), fontWeight: "bold" }}>
                {concern?.priority_level}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Original Mark:</span>
              <span style={currentMarkStyle}>{concern?.originalMark}/100</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Current Status:</span>
              <span style={getStatusStyle(concern?.concern_status)}>{concern?.concern_status}</span>
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={modalLabelStyle}>Update Status *</label>
            <div style={statusSelectorStyle}>
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  style={{
                    ...statusOptionStyle,
                    backgroundColor: selectedStatus === option.value ? option.color : "#fff",
                    color: selectedStatus === option.value ? "#fff" : option.color,
                    borderColor: option.color
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={modalLabelStyle}>Response Comment *</label>
            <textarea
              value={comment}
              onChange={handleCommentChange}
              onBlur={handleCommentBlur}
              style={{ ...modalTextareaStyle, borderColor: getCommentBorderColor() }}
              rows="5"
              placeholder="Provide your detailed response to the student's concern..."
            />
            {touched.comment && errors.comment && (
              <p style={errorTextStyle}>{errors.comment}</p>
            )}
            {touched.comment && !errors.comment && comment && (
              <p style={successTextStyle}>✓ Valid response</p>
            )}
            <div style={charCountStyle(comment.length)}>
              {comment.length} / 2000 characters {comment.length < 10 && `(minimum 10 required)`}
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={modalLabelStyle}>Revised Mark (Optional)</label>
            <input
              type="number"
              step="0.01"
              value={revisedMark}
              onChange={handleRevisedMarkChange}
              onBlur={handleRevisedMarkBlur}
              style={{ ...modalInputStyle, borderColor: getRevisedMarkBorderColor() }}
              placeholder="Enter revised mark if applicable"
            />
            {touched.revisedMark && errors.revisedMark && (
              <p style={errorTextStyle}>{errors.revisedMark}</p>
            )}
            {touched.revisedMark && !errors.revisedMark && revisedMark && (
              <p style={successTextStyle}>✓ Valid revised mark</p>
            )}
            <p style={hintTextStyle}>Leave blank if no change to the original mark</p>
          </div>

          {/* Email status indicator while sending */}
          {emailStatus === "sending" && (
            <div style={emailStatusStyle("#3b82f6", "#dbeafe")}>
              <span>📧 Sending email notification to student...</span>
            </div>
          )}
        </div>

        <div style={modalFooterStyle}>
          <button onClick={onClose} style={modalCancelBtnStyle}>Cancel</button>
          <button
            onClick={handleSend}
            disabled={sending || !isFormValid()}
            style={{
              ...modalSaveBtnStyle,
              opacity: (sending || !isFormValid()) ? 0.6 : 1,
              cursor: (sending || !isFormValid()) ? "not-allowed" : "pointer"
            }}
          >
            {sending ? "Sending..." : "Send Response & Email Student"}
          </button>
        </div>
      </div>
    </div>
  );
};

// View Submission Modal
const ViewSubmissionModal = ({ isOpen, onClose, submissionUrl }) => {
  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={viewModalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>Submission Preview</h3>
          <button onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>
        
        <div style={viewModalBodyStyle}>
          <iframe
            src={submissionUrl}
            title="Submission Preview"
            style={{ width: "100%", height: "600px", border: "none", borderRadius: "8px" }}
          />
        </div>
        
        <div style={modalFooterStyle}>
          <a href={submissionUrl} target="_blank" rel="noopener noreferrer" style={openNewTabBtnStyle}>
            Open in New Tab
          </a>
          <button onClick={onClose} style={modalCancelBtnStyle}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function ConcernReviewResolution() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDetails, setPopupDetails] = useState({});
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const statuses = ["All", "Pending", "Accepted", "Rejected", "Revised"];
  const priorities = ["All", "High", "Medium", "Low"];
  const sortOptions = [
    { value: "date", label: "Date (Newest First)" },
    { value: "date-old", label: "Date (Oldest First)" },
    { value: "priority-high", label: "Priority (High to Low)" },
    { value: "priority-low", label: "Priority (Low to High)" },
    { value: "status", label: "Status" }
  ];

  const fetchConcerns = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/concerns'), { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Failed to fetch concerns');
      const data = await response.json();
      setConcerns(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching concerns:", err);
      setError("Failed to load concerns. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConcerns(); }, []);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await fetch(apiUrl('/api/concerns/export-pdf'), {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          concerns: filteredConcerns,
          filters: { status: statusFilter, priority: priorityFilter, search: searchQuery, sortBy },
          exportDate: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `concerns_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setPopupTitle("✓ PDF Exported");
      setPopupMessage("Concerns report has been successfully exported to PDF.");
      setPopupDetails({
        "Records Exported": filteredConcerns.length,
        "Date": new Date().toLocaleString(),
        "Status Filter": statusFilter,
        "Priority Filter": priorityFilter
      });
      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const filteredConcerns = concerns
    .filter(concern => {
      const matchesSearch =
        concern.concern_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.assignment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.student_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || concern.concern_status === statusFilter;
      const matchesPriority = priorityFilter === "All" || concern.priority_level === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "date-old") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "priority-high") {
        const o = { High: 3, Medium: 2, Low: 1 };
        return o[b.priority_level] - o[a.priority_level];
      }
      if (sortBy === "priority-low") {
        const o = { High: 3, Medium: 2, Low: 1 };
        return o[a.priority_level] - o[b.priority_level];
      }
      if (sortBy === "status") {
        const o = { Pending: 1, Revised: 2, Accepted: 3, Rejected: 4 };
        return o[a.concern_status] - o[b.concern_status];
      }
      return 0;
    });

  const handleDeleteConcern = async () => {
    if (!selectedConcern) return;
    try {
      const response = await fetch(
        apiUrl(`/api/concerns/${encodeURIComponent(selectedConcern.concern_id)}`),
        { method: 'DELETE', headers: getAuthHeaders(false) }
      );
      if (!response.ok) throw new Error('Failed to delete concern');
      await fetchConcerns();
      setPopupTitle("✓ Concern Deleted");
      setPopupMessage(`Concern #${selectedConcern.concern_id} from ${selectedConcern.student_name} has been deleted.`);
      setPopupDetails({
        "Student": selectedConcern.student_name,
        "Assignment": selectedConcern.assignment,
        "Priority": selectedConcern.priority_level,
        "Status": selectedConcern.concern_status,
        "Concern ID": selectedConcern.concern_id
      });
      setShowSuccessPopup(true);
      setShowDeleteModal(false);
      setSelectedConcern(null);
    } catch (err) {
      console.error("Error deleting concern:", err);
      alert("Failed to delete concern. Please try again.");
    }
  };

  const handleSendResponse = async (responseData) => {
    try {
      await fetchConcerns();
      setPopupTitle("✓ Response Saved & Email Sent");
      setPopupMessage(`Your response has been saved and an email notification was sent to ${responseData.student_name}.`);
      setPopupDetails({
        "Student": responseData.student_name,
        "Email": responseData.student_email,
        "Assignment": responseData.assignment,
        "New Status": responseData.status,
        ...(responseData.revised_mark && { "Revised Mark": `${responseData.revised_mark}/100` })
      });
      setShowSuccessPopup(true);
      setShowRespondModal(false);
      setSelectedConcern(null);
    } catch (err) {
      console.error("Error sending response:", err);
      alert("Failed to send response. Please try again.");
    }
  };

  const handleViewSubmission = (url) => {
    setSubmissionUrl(url);
    setShowViewModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "#dc2626";
      case "Medium": return "#f59e0b";
      case "Low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority) {
      case "High": return "#fee2e2";
      case "Medium": return "#fef3c7";
      case "Low": return "#d1fae5";
      default: return "#f3f4f6";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return { backgroundColor: "#fef3c7", color: "#d97706" };
      case "Accepted": return { backgroundColor: "#d1fae5", color: "#059669" };
      case "Rejected": return { backgroundColor: "#fee2e2", color: "#dc2626" };
      case "Revised": return { backgroundColor: "#dbeafe", color: "#3b82f6" };
      default: return { backgroundColor: "#f3f4f6", color: "#6b7280" };
    }
  };

  if (loading) {
    return (
      <div style={pageContainerStyle}>
        <LecturerNavbar activePage="Review Concerns" />
        <div style={loadingContainerStyle}>
          <div style={loadingSpinnerStyle}></div>
          <p style={loadingTextStyle}>Loading concerns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageContainerStyle}>
        <LecturerNavbar activePage="Review Concerns" />
        <div style={errorContainerStyle}>
          <div style={errorIconStyle}>⚠️</div>
          <h3 style={errorTitleStyle}>Error Loading Data</h3>
          <p style={errorMessageStyle}>{error}</p>
          <button onClick={fetchConcerns} style={retryButtonStyle}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      <LecturerNavbar activePage="Review Concerns" />

      <main style={mainContainerStyle}>
        <section style={headerSectionStyle}>
          <h2 style={pageTitleStyle}>Review & Resolve Concerns</h2>
          <p style={pageSubtitleStyle}>Review student concerns, respond with feedback, and manage inquiries.</p>
        </section>

        <div style={mainCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>⚠️</div>
            <div>
              <h3 style={cardTitleStyle}>Student Concerns</h3>
              <p style={cardSubtitleStyle}>Review and respond to student inquiries regarding marks.</p>
            </div>
          </div>

          <div style={cardContentStyle}>
            {/* Search and Filter Bar */}
            <div style={searchFilterContainer}>
              <div style={searchWrapperStyle}>
                <label style={filterLabelStyle}>Search</label>
                <div style={searchInputWrapperStyle}>
                  <span style={searchIconStyle}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by Concern ID, Student, Student ID, or Assignment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={searchInputStyle}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={clearSearchBtnStyle}>✕</button>
                  )}
                </div>
              </div>

              <div style={filterWrapperStyle}>
                <label style={filterLabelStyle}>Filter by Status</label>
                <div style={filterSelectWrapperStyle}>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterSelectStyle}>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span style={filterArrowStyle}>▼</span>
                </div>
              </div>

              <div style={filterWrapperStyle}>
                <label style={filterLabelStyle}>Filter by Priority</label>
                <div style={filterSelectWrapperStyle}>
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={filterSelectStyle}>
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <span style={filterArrowStyle}>▼</span>
                </div>
              </div>

              <div style={filterWrapperStyle}>
                <label style={filterLabelStyle}>Sort by</label>
                <div style={filterSelectWrapperStyle}>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={filterSelectStyle}>
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span style={filterArrowStyle}>▼</span>
                </div>
              </div>

              <div style={exportButtonWrapperStyle}>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting || filteredConcerns.length === 0}
                  style={exportPdfBtnStyle}
                >
                  {exporting ? "📄 Exporting..." : "📄 Export PDF"}
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div style={resultsCountContainerStyle}>
              <div style={resultsCountStyle}>
                Showing <strong>{filteredConcerns.length}</strong> of <strong>{concerns.length}</strong> concerns
              </div>
              <div style={activeFiltersStyle}>
                {statusFilter !== "All" && (
                  <div style={activeFilterStyle}>
                    <span>Status: </span><strong>{statusFilter}</strong>
                    <button onClick={() => setStatusFilter("All")} style={clearFilterBtnStyle}>✕</button>
                  </div>
                )}
                {priorityFilter !== "All" && (
                  <div style={activeFilterStyle}>
                    <span>Priority: </span><strong>{priorityFilter}</strong>
                    <button onClick={() => setPriorityFilter("All")} style={clearFilterBtnStyle}>✕</button>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div style={tableContainerStyle}>
              <div style={updatedTableHeaderStyle}>
                <div style={headerCellStyle}>ID</div>
                <div style={headerCellStyle}>Student Details</div>
                <div style={headerCellStyle}>Submission</div>
                <div style={headerCellStyle}>Priority</div>
                <div style={headerCellStyle}>Date</div>
                <div style={headerCellStyle}>Status</div>
                <div style={headerCellStyle}>Concern Message</div>
                <div style={headerCellStyle}>Actions</div>
              </div>

              {filteredConcerns.length === 0 ? (
                <div style={emptyContainerStyle}>
                  <div style={emptyIconStyle}>📭</div>
                  <p style={emptyTitleStyle}>No concerns found</p>
                  <p style={emptyMessageStyle}>
                    {searchQuery || statusFilter !== "All" || priorityFilter !== "All"
                      ? "Try adjusting your search or filter criteria."
                      : "No student concerns available."}
                  </p>
                </div>
              ) : (
                filteredConcerns.map((concern, index) => (
                  <div key={concern.concern_id} style={updatedTableRowStyle(index === filteredConcerns.length - 1)}>
                    <div style={cellStyle}>
                      <span style={concernIdStyle}>{concern.concern_id}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={studentNameStyle}>{concern.student_name}</span>
                      <span style={studentIdStyle}>ID: {concern.student_id}</span>
                      <span style={studentEmailStyle}>{concern.student_email}</span>
                    </div>
                    <div style={cellStyle}>
                      <div style={assignmentWithButtonStyle}>
                        <span style={assignmentNameStyle}>{concern.assignment}</span>
                        {concern.submission_id && (
                          <button
                            onClick={() => handleViewSubmission(apiUrl(`/api/marks/pdf/${concern.submission_id}`))}
                            style={viewPdfBtnStyle}
                            title="View Submission"
                          >
                            📄 View
                          </button>
                        )}
                      </div>
                      <span style={subjectNameStyle}>{concern.subject}</span>
                      <span style={subjectCodeStyle}>{concern.subject_code}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={{
                        ...priorityBadgeStyle,
                        backgroundColor: getPriorityBgColor(concern.priority_level),
                        color: getPriorityColor(concern.priority_level)
                      }}>
                        {concern.priority_level}
                      </span>
                    </div>
                    <div style={cellStyle}>
                      <span style={dateStyle}>{new Date(concern.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={{
                        ...statusBadgeStyle,
                        backgroundColor: getStatusStyle(concern.concern_status).backgroundColor,
                        color: getStatusStyle(concern.concern_status).color
                      }}>
                        {concern.concern_status}
                      </span>
                    </div>
                    <div style={cellStyle}>
                      <button
                        onClick={() => { setSelectedConcern(concern); setShowMessageModal(true); }}
                        style={viewMessageBtnStyle}
                        title="View Concern Message"
                      >
                        💬 View Message
                      </button>
                    </div>
                    <div style={cellStyle}>
                      <div style={stackedActionButtonsStyle}>
                        <button
                          onClick={() => { setSelectedConcern(concern); setShowRespondModal(true); }}
                          style={respondBtnStyle}
                          title="Respond to Concern"
                        >
                          ✏️ Respond
                        </button>
                        <button
                          onClick={() => { setSelectedConcern(concern); setShowDeleteModal(true); }}
                          style={deleteActionBtnStyle}
                          title="Delete Concern"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ViewMessageModal
        isOpen={showMessageModal}
        onClose={() => { setShowMessageModal(false); setSelectedConcern(null); }}
        concern={selectedConcern}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedConcern(null); }}
        concern={selectedConcern}
        onConfirm={handleDeleteConcern}
      />

      <RespondModal
        isOpen={showRespondModal}
        onClose={() => { setShowRespondModal(false); setSelectedConcern(null); }}
        concern={selectedConcern}
        onSend={handleSendResponse}
      />

      <ViewSubmissionModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        submissionUrl={submissionUrl}
      />

      <SuccessPopup
        isVisible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={popupTitle}
        message={popupMessage}
        details={popupDetails}
      />
    </div>
  );
}

// ─── New styles added for email feature ───────────────────────────────────────

const emailNoticeStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "10px",
  padding: "12px 14px",
  marginBottom: "20px"
};

const emailNoticeIconStyle = {
  fontSize: "16px",
  flexShrink: 0,
  marginTop: "1px"
};

const emailNoticeTextStyle = {
  fontSize: "12px",
  color: "#1e40af",
  lineHeight: "1.5"
};

const emailStatusStyle = (color, bg) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: bg,
  color: color,
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: "500",
  marginTop: "8px"
});

// ─── All original styles preserved exactly ───────────────────────────────────

const successTextStyle = {
  color: "#10b981",
  fontSize: "11px",
  marginTop: "4px",
  display: "block"
};

const charCountStyle = (length) => ({
  color: length > 1900 ? (length > 2000 ? "#ef4444" : "#f59e0b") : "#94a3b8",
  fontSize: "11px",
  marginTop: "4px"
});

const exportButtonWrapperStyle = {
  flex: "0.5",
  minWidth: "120px",
  display: "flex",
  alignItems: "flex-end"
};

const exportPdfBtnStyle = {
  padding: "12px 20px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#dc2626",
  color: "#fff",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
  width: "100%",
  justifyContent: "center"
};

const pageContainerStyle = {
  minHeight: "100vh",
  backgroundColor: "#f5f6fa",
  fontFamily: "'Inter', sans-serif"
};

const mainContainerStyle = {
  padding: "34px 44px",
  maxWidth: "1600px",
  margin: "0 auto"
};

const headerSectionStyle = { marginBottom: "28px" };

const pageTitleStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#18243d",
  margin: 0
};

const pageSubtitleStyle = {
  fontSize: "14px",
  color: "#74839a",
  marginTop: "8px"
};

const mainCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
};

const cardHeaderStyle = {
  height: "80px",
  padding: "0 32px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  borderBottom: "1px solid #edf1f5",
  backgroundColor: "#fafbfc"
};

const iconBoxStyle = {
  width: "44px",
  height: "44px",
  backgroundColor: "#3c74ff",
  borderRadius: "12px",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px"
};

const cardTitleStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#18243d",
  margin: 0
};

const cardSubtitleStyle = {
  fontSize: "13px",
  color: "#64748b",
  margin: "4px 0 0 0"
};

const cardContentStyle = { padding: "28px 32px" };

const searchFilterContainer = {
  display: "flex",
  gap: "20px",
  marginBottom: "28px",
  flexWrap: "wrap",
  alignItems: "flex-end"
};

const searchWrapperStyle = { flex: "2", minWidth: "320px" };

const searchInputWrapperStyle = { position: "relative", width: "100%" };

const searchIconStyle = {
  position: "absolute",
  left: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "16px",
  color: "#9aa8bb",
  pointerEvents: "none",
  zIndex: 1
};

const searchInputStyle = {
  width: "100%",
  padding: "12px 40px 12px 42px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  color: "#1e293b",
  outline: "none",
  transition: "all 0.2s",
  backgroundColor: "#fff",
  boxSizing: "border-box"
};

const clearSearchBtnStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#9aa8bb",
  fontSize: "14px",
  padding: "4px",
  borderRadius: "4px",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const filterWrapperStyle = { flex: "1", minWidth: "180px" };

const filterLabelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: "700",
  color: "#5c6b80",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const filterSelectWrapperStyle = { position: "relative", width: "100%" };

const filterSelectStyle = {
  width: "100%",
  padding: "12px 36px 12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  color: "#1e293b",
  outline: "none",
  backgroundColor: "#fff",
  cursor: "pointer",
  appearance: "none",
  boxSizing: "border-box",
  transition: "all 0.2s"
};

const filterArrowStyle = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "#9aa8bb",
  fontSize: "12px"
};

const resultsCountContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  paddingBottom: "16px",
  borderBottom: "1px solid #edf1f5",
  flexWrap: "wrap",
  gap: "12px"
};

const resultsCountStyle = {
  fontSize: "13px",
  color: "#5c6b80",
  fontWeight: "500"
};

const activeFiltersStyle = { display: "flex", gap: "10px", flexWrap: "wrap" };

const activeFilterStyle = {
  fontSize: "12px",
  color: "#3c74ff",
  backgroundColor: "#eef2ff",
  padding: "6px 12px",
  borderRadius: "20px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "500"
};

const clearFilterBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#3c74ff",
  fontSize: "12px",
  padding: "2px",
  marginLeft: "4px",
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "50%",
  transition: "all 0.2s"
};

const updatedTableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "0.6fr 1.2fr 1.4fr 0.6fr 0.7fr 0.7fr 0.8fr 0.8fr",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
  padding: "14px 20px"
};

const updatedTableRowStyle = (isLast) => ({
  display: "grid",
  gridTemplateColumns: "0.6fr 1.2fr 1.4fr 0.6fr 0.7fr 0.7fr 0.8fr 0.8fr",
  padding: "14px 20px",
  borderBottom: isLast ? "none" : "1px solid #f1f5f9",
  transition: "background 0.2s",
  alignItems: "center"
});

const tableContainerStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  overflow: "auto"
};

const headerCellStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const cellStyle = { display: "flex", flexDirection: "column", gap: "4px" };

const concernIdStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#3c74ff",
  fontFamily: "monospace"
};

const studentNameStyle = { fontSize: "14px", fontWeight: "600", color: "#0f172a" };
const studentIdStyle = { fontSize: "11px", color: "#64748b" };
const studentEmailStyle = { fontSize: "11px", color: "#94a3b8" };

const assignmentWithButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap"
};

const assignmentNameStyle = { fontSize: "13px", fontWeight: "500", color: "#1e293b" };
const subjectNameStyle = { fontSize: "12px", color: "#475569" };
const subjectCodeStyle = { fontSize: "10px", color: "#94a3b8" };

const priorityBadgeStyle = {
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "600",
  width: "fit-content"
};

const dateStyle = { fontSize: "12px", color: "#64748b" };

const statusBadgeStyle = {
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "600",
  width: "fit-content"
};

const stackedActionButtonsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  alignItems: "flex-start"
};

const respondBtnStyle = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#eef2ff",
  color: "#3c74ff",
  fontSize: "11px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  whiteSpace: "nowrap",
  width: "fit-content"
};

const deleteActionBtnStyle = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#fef2f2",
  color: "#dc2626",
  fontSize: "11px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  whiteSpace: "nowrap",
  width: "fit-content"
};

const viewPdfBtnStyle = {
  padding: "4px 10px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#eef2ff",
  color: "#3c74ff",
  fontSize: "10px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  whiteSpace: "nowrap"
};

const viewMessageBtnStyle = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#f5f3ff",
  color: "#8b5cf6",
  fontSize: "11px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  whiteSpace: "nowrap",
  width: "fit-content"
};

const statusSelectorStyle = { display: "flex", gap: "10px", flexWrap: "wrap" };

const statusOptionStyle = {
  padding: "6px 16px",
  borderRadius: "30px",
  border: "2px solid",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  background: "none"
};

const viewModalContainerStyle = {
  backgroundColor: "#fff",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "1200px",
  maxHeight: "90vh",
  overflow: "hidden",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
  animation: "slideUp 0.3s ease-out",
  display: "flex",
  flexDirection: "column"
};

const viewModalBodyStyle = { padding: "0", flex: 1, overflow: "auto" };

const openNewTabBtnStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#3c74ff",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer",
  textDecoration: "none"
};

const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "400px",
  gap: "20px"
};

const loadingSpinnerStyle = {
  width: "40px",
  height: "40px",
  border: "3px solid #e2e8f0",
  borderTopColor: "#3c74ff",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
};

const loadingTextStyle = { fontSize: "14px", color: "#64748b" };

const errorContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "400px",
  gap: "16px",
  textAlign: "center"
};

const errorIconStyle = { fontSize: "48px" };
const errorTitleStyle = { fontSize: "18px", fontWeight: "600", color: "#dc2626", margin: 0 };
const errorMessageStyle = { fontSize: "14px", color: "#64748b", maxWidth: "400px" };

const retryButtonStyle = {
  padding: "8px 20px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#3c74ff",
  color: "#fff",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer"
};

const emptyContainerStyle = { padding: "60px", textAlign: "center" };
const emptyIconStyle = { fontSize: "48px", marginBottom: "16px" };
const emptyTitleStyle = { fontSize: "16px", fontWeight: "600", color: "#2e3b52", marginBottom: "8px" };
const emptyMessageStyle = { fontSize: "13px", color: "#74839a" };
const hintTextStyle = { fontSize: "11px", color: "#94a3b8", marginTop: "4px" };

const modalOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const modalContainerStyle = {
  backgroundColor: "#fff",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "600px",
  maxHeight: "90vh",
  overflow: "auto",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
  animation: "slideUp 0.3s ease-out"
};

const deleteModalContainerStyle = {
  backgroundColor: "#fff",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "500px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
  animation: "slideUp 0.3s ease-out"
};

const modalHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #edf1f5",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const deleteModalHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #edf1f5",
  display: "flex",
  alignItems: "center",
  gap: "12px"
};

const modalTitleStyle = { fontSize: "18px", fontWeight: "bold", color: "#18243d", margin: 0 };
const deleteModalTitleStyle = { fontSize: "18px", fontWeight: "bold", color: "#18243d", margin: 0 };

const modalCloseBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#94a3b8",
  padding: "4px 8px",
  borderRadius: "6px"
};

const modalBodyStyle = { padding: "24px" };

const infoSectionStyle = {
  backgroundColor: "#f8f9fc",
  padding: "16px",
  borderRadius: "12px",
  marginBottom: "20px",
  border: "1px solid #edf1f5"
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #e9ecef"
};

const infoLabelStyle = { fontSize: "12px", color: "#74839a", fontWeight: "500" };
const infoValueStyle = { fontSize: "13px", color: "#2e3b52", fontWeight: "600" };
const currentMarkStyle = { fontSize: "16px", color: "#3d6df2", fontWeight: "bold" };

const messageSectionStyle = { marginBottom: "20px" };

const sectionLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "8px"
};

const messageBoxStyle = {
  backgroundColor: "#f8f9fc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "14px 16px",
  fontSize: "13px",
  color: "#1e293b",
  lineHeight: "1.6",
  fontStyle: "italic"
};

const infoBoxStyle = {
  backgroundColor: "#f8f9fc",
  padding: "16px 20px",
  borderRadius: "12px",
  marginBottom: "24px",
  border: "1px solid #edf1f5"
};

const modalFooterStyle = {
  padding: "20px 24px",
  borderTop: "1px solid #edf1f5",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px"
};

const modalCancelBtnStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#5c6b80",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer"
};

const modalSaveBtnStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#3c74ff",
  color: "#fff",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer"
};

const deleteConfirmBtnStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#dc2626",
  color: "#fff",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer"
};

const warningIconStyle = { fontSize: "24px" };

const deleteMessageStyle = {
  fontSize: "14px",
  color: "#2e3b52",
  marginBottom: "16px",
  lineHeight: "1.5"
};

const deleteSubMessageStyle = {
  fontSize: "13px",
  color: "#64748b",
  marginBottom: "16px",
  lineHeight: "1.5"
};

const deleteWarningStyle = {
  fontSize: "12px",
  color: "#dc2626",
  backgroundColor: "#fee2e2",
  padding: "10px",
  borderRadius: "8px",
  marginTop: "16px"
};

const errorTextStyle = { color: "#ff4d4f", fontSize: "11px", marginTop: "4px" };
const formGroupStyle = { marginBottom: "24px" };

const modalLabelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#2e3b52",
  marginBottom: "8px"
};

const modalInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  color: "#1e293b",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
  backgroundColor: "#fff"
};

const modalTextareaStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  color: "#1e293b",
  outline: "none",
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  lineHeight: "1.5"
};

const popupOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
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

const detailLabelStyle = { fontSize: "12px", color: "#74839a", fontWeight: "500" };
const detailValueStyle = { fontSize: "12px", color: "#2e3b52", fontWeight: "600" };

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

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      0%   { opacity: 0; transform: scale(0); }
      50%  { transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    button:hover { transform: translateY(-1px); opacity: 0.8; }
  `;
  document.head.appendChild(style);
}