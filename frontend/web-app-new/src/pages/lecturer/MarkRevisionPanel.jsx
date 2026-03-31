import { useState, useEffect } from "react";
import LecturerNavbar from "./LecturerNavbar";

const API_BASE_URL = "http://localhost:5000";

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

// Edit Mark Modal Component
const EditMarkModal = ({ isOpen, onClose, submission, onSave }) => {
  const [newMark, setNewMark] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (submission) {
      setNewMark(submission.mark?.toString() || "");
      setReason("");
      setErrors({});
    }
  }, [submission]);

  const validate = () => {
    const newErrors = {};
    if (!newMark || newMark === "") {
      newErrors.mark = "Please enter a mark";
    } else {
      const markNum = parseFloat(newMark);
      if (isNaN(markNum)) {
        newErrors.mark = "Please enter a valid number";
      } else if (markNum < 0) {
        newErrors.mark = "Mark cannot be negative";
      } else if (markNum > submission.total) {
        newErrors.mark = `Mark cannot exceed ${submission.total}`;
      }
    }
    
    if (!reason.trim()) {
      newErrors.reason = "Please provide a reason for changing the mark";
    } else if (reason.trim().length < 10) {
      newErrors.reason = "Please provide a detailed reason (minimum 10 characters)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        submission_id: submission.submission_id,
        old_mark: submission.mark,
        new_mark: parseFloat(newMark),
        reason: reason.trim(),
        assignment_name: submission.assignment_name,
        total: submission.total
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>Edit Mark</h3>
          <button onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>
        
        <div style={modalBodyStyle}>
          <div style={infoBoxStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Assignment:</span>
              <span style={infoValueStyle}>{submission?.assignment_name}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Submission ID:</span>
              <span style={infoValueStyle}>{submission?.submission_id}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Current Mark:</span>
              <span style={currentMarkStyle}>{submission?.mark}/{submission?.total}</span>
            </div>
          </div>
          
          <div style={formGroupStyle}>
            <label style={modalLabelStyle}>New Mark *</label>
            <input
              type="number"
              step="0.01"
              value={newMark}
              onChange={(e) => setNewMark(e.target.value)}
              style={{
                ...modalInputStyle,
                borderColor: errors.mark ? "#ff4d4f" : "#dde3eb"
              }}
              placeholder="Enter new mark"
            />
            {errors.mark && <p style={errorTextStyle}>{errors.mark}</p>}
          </div>
          
          <div style={formGroupStyle}>
            <label style={modalLabelStyle}>Reason for Change *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                ...modalTextareaStyle,
                borderColor: errors.reason ? "#ff4d4f" : "#dde3eb"
              }}
              rows="4"
              placeholder="Please provide a detailed reason for modifying this mark..."
            />
            {errors.reason && <p style={errorTextStyle}>{errors.reason}</p>}
          </div>
        </div>
        
        <div style={modalFooterStyle}>
          <button onClick={onClose} style={modalCancelBtnStyle}>Cancel</button>
          <button onClick={handleSave} style={modalSaveBtnStyle}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, submission, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={deleteModalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={deleteModalHeaderStyle}>
          <div style={warningIconStyle}>⚠️</div>
          <h3 style={deleteModalTitleStyle}>Confirm Deletion</h3>
        </div>
        
        <div style={modalBodyStyle}>
          <p style={deleteMessageStyle}>
            Are you sure you want to delete the mark for <strong>{submission?.assignment_name}</strong>?
          </p>
          <p style={deleteSubMessageStyle}>
            Submission ID: <strong>{submission?.submission_id}</strong><br/>
            Current Mark: <strong>{submission?.mark}/{submission?.total}</strong>
          </p>
          <p style={deleteWarningStyle}>
            This action cannot be undone. The mark will be permanently removed from the system.
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

export default function MarkRevisionAuditLog() {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [assessmentFilter, setAssessmentFilter] = useState("All");
  const [assessments, setAssessments] = useState(["All"]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDetails, setPopupDetails] = useState({});

  // Fetch all published marks
  useEffect(() => {
    fetchPublishedMarks();
  }, []);

  const fetchPublishedMarks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marks/published-marks", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data);
        setFilteredSubmissions(data.data);
        
        // Extract unique assessment names for filter
        const uniqueAssessments = ["All", ...new Set(data.data.map(s => s.assignment_name))];
        setAssessments(uniqueAssessments);
      }
    } catch (err) {
      console.error("Error fetching published marks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions based on search and assessment filter
  useEffect(() => {
    let filtered = [...submissions];
    
    // Filter by assessment
    if (assessmentFilter !== "All") {
      filtered = filtered.filter(s => s.assignment_name === assessmentFilter);
    }
    
    // Filter by search (submission_id or assignment name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.submission_id?.toString().toLowerCase().includes(query) ||
        s.assignment_name?.toLowerCase().includes(query) ||
        s.subject_name?.toLowerCase().includes(query)
      );
    }
    
    setFilteredSubmissions(filtered);
  }, [searchQuery, assessmentFilter, submissions]);

  // Handle Edit Mark
  const handleEditMark = async (data) => {
    try {
      const res = await fetch("/api/marks/update-mark", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          submission_id: data.submission_id,
          new_mark: data.new_mark,
          reason: data.reason,
          old_mark: data.old_mark
        })
      });
      
      const response = await res.json();
      
      if (res.ok) {
        setPopupTitle("✓ Mark Updated");
        setPopupMessage(`Mark for "${data.assignment_name}" has been successfully updated.`);
        setPopupDetails({
          "Submission ID": data.submission_id,
          "Old Mark": `${data.old_mark}/${data.total}`,
          "New Mark": `${data.new_mark}/${data.total}`,
          "Reason": data.reason
        });
        setShowSuccessPopup(true);
        fetchPublishedMarks(); // Refresh the list
        setShowEditModal(false);
        setSelectedSubmission(null);
      } else {
        alert(`Error: ${response.message || "Failed to update mark"}`);
      }
    } catch (err) {
      console.error("Error updating mark:", err);
      alert("Failed to connect to server");
    }
  };

  // Handle Delete Mark
  const handleDeleteMark = async () => {
    if (!selectedSubmission) return;
    
    try {
      const res = await fetch(`/api/marks/delete-mark/${selectedSubmission.submission_id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Deleted via audit log"
        })
      });
      
      const response = await res.json();
      
      if (res.ok) {
        setPopupTitle("✓ Mark Deleted");
        setPopupMessage(`Mark for "${selectedSubmission.assignment_name}" has been successfully deleted.`);
        setPopupDetails({
          "Submission ID": selectedSubmission.submission_id,
          "Assignment": selectedSubmission.assignment_name,
          "Previous Mark": `${selectedSubmission.mark}/${selectedSubmission.total}`,
          "Deleted By": "Lecturer"
        });
        setShowSuccessPopup(true);
        fetchPublishedMarks(); // Refresh the list
        setShowDeleteModal(false);
        setSelectedSubmission(null);
      } else {
        alert(`Error: ${response.message || "Failed to delete mark"}`);
      }
    } catch (err) {
      console.error("Error deleting mark:", err);
      alert("Failed to connect to server");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div style={pageContainerStyle}>
      
      {/* Pass "Mark Revision" as activePage to highlight the correct nav item */}
      <LecturerNavbar activePage="Mark Revision" />

      <main style={mainContainerStyle}>
        <section style={headerSectionStyle}>
          <h2 style={pageTitleStyle}>Mark Revision Audit Log</h2>
          <p style={pageSubtitleStyle}>View, edit, and manage all published marks with revision history.</p>
        </section>

        <div style={mainCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>📊</div>
            <div>
              <h3 style={cardTitleStyle}>Published Marks</h3>
              <p style={cardSubtitleStyle}>Manage and audit all published student marks.</p>
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
                    placeholder="Search by submission ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={searchInputStyle}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={clearSearchBtnStyle}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
              
              <div style={filterWrapperStyle}>
                <label style={filterLabelStyle}>Filter by Assessment</label>
                <div style={filterSelectWrapperStyle}>
                  <select
                    value={assessmentFilter}
                    onChange={(e) => setAssessmentFilter(e.target.value)}
                    style={filterSelectStyle}
                  >
                    {assessments.map(assessment => (
                      <option key={assessment} value={assessment}>
                        {assessment}
                      </option>
                    ))}
                  </select>
                  <span style={filterArrowStyle}>▼</span>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div style={resultsCountContainerStyle}>
              <div style={resultsCountStyle}>
                Showing <strong>{filteredSubmissions.length}</strong> of <strong>{submissions.length}</strong> submissions
              </div>
              {assessmentFilter !== "All" && (
                <div style={activeFilterStyle}>
                  <span>Filter: </span>
                  <strong>{assessmentFilter}</strong>
                  <button onClick={() => setAssessmentFilter("All")} style={clearFilterBtnStyle}>
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div style={tableContainerStyle}>
              <div style={tableHeaderStyle}>
                <div style={headerCellStyle}>Submission ID</div>
                <div style={headerCellStyle}>Assignment Name</div>
                <div style={headerCellStyle}>Subject</div>
                <div style={headerCellStyle}>Marks</div>
                <div style={headerCellStyle}>Published Date</div>
                <div style={headerCellStyle}>Actions</div>
              </div>

              {loading ? (
                <div style={loadingContainerStyle}>
                  <div style={spinnerStyle} />
                  <p style={loadingTextStyle}>Loading marks...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div style={emptyContainerStyle}>
                  <div style={emptyIconStyle}>📭</div>
                  <p style={emptyTitleStyle}>No marks found</p>
                  <p style={emptyMessageStyle}>
                    {searchQuery || assessmentFilter !== "All" 
                      ? "Try adjusting your search or filter criteria."
                      : "No published marks available."}
                  </p>
                </div>
              ) : (
                filteredSubmissions.map((sub, index) => (
                  <div key={sub.submission_id} style={tableRowStyle(index === filteredSubmissions.length - 1)}>
                    <div style={cellStyle}>
                      <span style={submissionIdStyle}>{sub.submission_id}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={assignmentNameStyle}>{sub.assignment_name}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={subjectNameStyle}>{sub.subject_name}</span>
                      <span style={subjectCodeStyle}>{sub.subject_code}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={markStyle((sub.mark / sub.total) * 100)}>
                        {sub.mark}/{sub.total}
                      </span>
                      <span style={percentageStyle}>
                        ({((sub.mark / sub.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div style={cellStyle}>
                      <span style={dateStyle}>{formatDate(sub.published_at)}</span>
                    </div>
                    <div style={cellStyle}>
                      <div style={actionButtonsStyle}>
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setShowEditModal(true);
                          }}
                          style={editBtnStyle}
                          title="Edit Mark"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setShowDeleteModal(true);
                          }}
                          style={deleteBtnStyle}
                          title="Delete Mark"
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

      {/* Modals and Popups */}
      <EditMarkModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        onSave={handleEditMark}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        onConfirm={handleDeleteMark}
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

// Styles
const pageContainerStyle = {
  minHeight: "100vh",
  backgroundColor: "#f5f6fa",
  fontFamily: "'Inter', sans-serif"
};

const mainContainerStyle = {
  padding: "34px 44px"
};

const headerSectionStyle = {
  marginBottom: "18px"
};

const pageTitleStyle = {
  fontSize: "23px",
  fontWeight: "bold",
  color: "#18243d",
  margin: 0
};

const pageSubtitleStyle = {
  fontSize: "13px",
  color: "#74839a",
  marginTop: "4px"
};

const mainCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #d8dee8",
  borderRadius: "14px",
  overflow: "hidden"
};

// Updated Card Header Styles
const cardHeaderStyle = {
  height: "70px", // Increased from 50px
  padding: "0 28px", // Increased padding
  display: "flex",
  alignItems: "center",
  gap: "14px", // Increased gap
  borderBottom: "1px solid #edf1f5"
};

const iconBoxStyle = {
  width: "40px", // Increased from 30px
  height: "40px", // Increased from 30px
  backgroundColor: "#3c74ff",
  borderRadius: "10px", // Increased from 8px
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px" 
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

const cardContentStyle = {
  padding: "24px 32px"
};

// Search and Filter Styles
const searchFilterContainer = {
  display: "flex",
  gap: "24px",
  marginBottom: "24px",
  flexWrap: "wrap",
  alignItems: "flex-end"
};

const searchWrapperStyle = {
  flex: "2",
  minWidth: "300px"
};

const searchInputWrapperStyle = {
  position: "relative",
  width: "100%"
};

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
  border: "1px solid #dde3eb",
  fontSize: "14px",
  color: "#2e3b52",
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

const filterWrapperStyle = {
  flex: "1",
  minWidth: "220px"
};

const filterLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "600",
  color: "#5c6b80",
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const filterSelectWrapperStyle = {
  position: "relative",
  width: "100%"
};

const filterSelectStyle = {
  width: "100%",
  padding: "12px 36px 12px 14px",
  borderRadius: "10px",
  border: "1px solid #dde3eb",
  fontSize: "14px",
  color: "#2e3b52",
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

// Results Count Styles
const resultsCountContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  paddingBottom: "12px",
  borderBottom: "1px solid #edf1f5"
};

const resultsCountStyle = {
  fontSize: "13px",
  color: "#5c6b80"
};

const activeFilterStyle = {
  fontSize: "12px",
  color: "#3c74ff",
  backgroundColor: "#eef2ff",
  padding: "6px 12px",
  borderRadius: "20px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px"
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

// Table Styles
const tableContainerStyle = {
  border: "1px solid #edf1f5",
  borderRadius: "12px",
  overflow: "auto",
  maxHeight: "calc(100vh - 450px)"
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "0.8fr 1.5fr 1.2fr 0.8fr 1fr 0.9fr",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #edf1f5",
  position: "sticky",
  top: 0,
  zIndex: 10
};

const headerCellStyle = {
  padding: "14px 16px",
  fontSize: "11px",
  fontWeight: "700",
  color: "#5c6b80",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  textAlign: "left"
};

const tableRowStyle = (isLast) => ({
  display: "grid",
  gridTemplateColumns: "0.8fr 1.5fr 1.2fr 0.8fr 1fr 0.9fr",
  borderBottom: isLast ? "none" : "1px solid #edf1f5",
  transition: "background 0.2s",
  alignItems: "center"
});

const cellStyle = {
  padding: "14px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  alignItems: "flex-start"
};

const submissionIdStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#3c74ff",
  fontFamily: "monospace"
};

const assignmentNameStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#18243d"
};

const subjectNameStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#18243d"
};

const subjectCodeStyle = {
  fontSize: "10px",
  color: "#9aa8bb"
};

const markStyle = (percentage) => ({
  fontSize: "14px",
  fontWeight: "bold",
  color: percentage >= 75 ? "#10b981" : percentage >= 55 ? "#3b82f6" : "#ef4444"
});

const percentageStyle = {
  fontSize: "10px",
  color: "#9aa8bb"
};

const dateStyle = {
  fontSize: "11px",
  color: "#64748b"
};

const actionButtonsStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center"
};

const editBtnStyle = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "1px solid #dde3eb",
  backgroundColor: "#fff",
  color: "#3c74ff",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  whiteSpace: "nowrap"
};

const deleteBtnStyle = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "1px solid #dde3eb",
  backgroundColor: "#fff",
  color: "#dc2626",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  whiteSpace: "nowrap"
};

// Loading and Empty States
const loadingContainerStyle = {
  padding: "60px",
  textAlign: "center"
};

const loadingTextStyle = {
  color: "#74839a",
  marginTop: "16px"
};

const emptyContainerStyle = {
  padding: "60px",
  textAlign: "center"
};

const emptyIconStyle = {
  fontSize: "48px",
  marginBottom: "16px"
};

const emptyTitleStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#2e3b52",
  marginBottom: "8px"
};

const emptyMessageStyle = {
  fontSize: "13px",
  color: "#74839a"
};

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "3px solid #edf1f5",
  borderTopColor: "#3c74ff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
  margin: "0 auto"
};

// Popup Styles
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

// Modal Styles
const modalOverlayStyle = {
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
  zIndex: 1000
};

const modalContainerStyle = {
  backgroundColor: "#fff",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "550px",
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

const modalTitleStyle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#18243d",
  margin: 0
};

const deleteModalTitleStyle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#18243d",
  margin: 0
};

const modalCloseBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#94a3b8",
  padding: "4px 8px",
  borderRadius: "6px",
  transition: "background 0.2s"
};

const modalBodyStyle = {
  padding: "24px"
};

const infoBoxStyle = {
  backgroundColor: "#f8f9fc",
  padding: "16px 20px",
  borderRadius: "12px",
  marginBottom: "24px",
  border: "1px solid #edf1f5"
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #e9ecef"
};

const infoLabelStyle = {
  fontSize: "13px",
  color: "#74839a",
  fontWeight: "500"
};

const infoValueStyle = {
  fontSize: "13px",
  color: "#2e3b52",
  fontWeight: "600"
};

const currentMarkStyle = {
  fontSize: "16px",
  color: "#3d6df2",
  fontWeight: "bold"
};

const formGroupStyle = {
  marginBottom: "24px"
};

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
  border: "1px solid #dde3eb",
  fontSize: "14px",
  color: "#2e3b52",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
  backgroundColor: "#fff"
};

const modalTextareaStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #dde3eb",
  fontSize: "14px",
  color: "#2e3b52",
  outline: "none",
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  lineHeight: "1.5"
};

const modalFooterStyle = {
  padding: "20px 24px",
  borderTop: "1px solid #edf1f5",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px"
};

const modalCancelBtnStyle = {
  padding: "10px 24px",
  borderRadius: "8px",
  border: "1px solid #dde3eb",
  backgroundColor: "#fff",
  color: "#5c6b80",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s"
};

const modalSaveBtnStyle = {
  padding: "10px 24px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#3c74ff",
  color: "#fff",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s"
};

const deleteConfirmBtnStyle = {
  padding: "10px 24px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#dc2626",
  color: "#fff",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s"
};

const warningIconStyle = {
  fontSize: "24px"
};

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

const errorTextStyle = {
  color: "#ff4d4f",
  fontSize: "11px",
  marginTop: "4px"
};

// Add CSS animations
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
    
    button:hover {
      transform: translateY(-1px);
    }
    
    ${editBtnStyle.selector}hover {
      background-color: #3c74ff;
      color: #fff;
      border-color: #3c74ff;
    }
    
    ${deleteBtnStyle.selector}hover {
      background-color: #dc2626;
      color: #fff;
      border-color: #dc2626;
    }
    
    ${modalCancelBtnStyle.selector}hover {
      background-color: #f8f9fc;
      border-color: #cbd5e1;
    }
    
    ${modalSaveBtnStyle.selector}hover {
      background-color: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(60, 116, 255, 0.3);
    }
    
    ${clearFilterBtnStyle.selector}hover {
      background-color: rgba(60, 116, 255, 0.1);
    }
    
    ${clearSearchBtnStyle.selector}hover {
      background-color: #f1f5f9;
    }
    
    ${filterSelectStyle.selector}hover {
      border-color: #3c74ff;
    }
    
    ${searchInputStyle.selector}:hover,
    ${searchInputStyle.selector}:focus {
      border-color: #3c74ff;
    }
  `;
  document.head.appendChild(style);
}