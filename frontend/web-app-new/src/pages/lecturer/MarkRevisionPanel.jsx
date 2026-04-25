import { useState, useEffect } from "react";
import LecturerNavbar from "./LecturerNavbar";
import { appToast } from "../../components/UIFeedback/appNotify";

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
// Edit Mark Modal Component with Real-time Validation
const EditMarkModal = ({ isOpen, onClose, submission, onSave }) => {
  const [newMark, setNewMark] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (submission) {
      setNewMark(submission.mark?.toString() || "");
      setReason("");
      setErrors({});
      setTouched({});
    }
  }, [submission]);

  // Real-time validation for mark
  const validateMark = (value) => {
    if (!value || value === "") {
      return "Please enter a mark";
    }
    const markNum = parseFloat(value);
    if (isNaN(markNum)) {
      return "Please enter a valid number";
    }
    if (markNum < 0) {
      return "Mark cannot be negative";
    }
    if (markNum > submission.total) {
      return `Mark cannot exceed ${submission.total}`;
    }
    // Check if the new mark is the same as the old mark
    if (markNum === submission.mark) {
      return "New mark is the same as the current mark. Please enter a different value.";
    }
    return null;
  };

  // Real-time validation for reason
  const validateReason = (value) => {
    if (!value || value.trim() === "") {
      return "Please provide a reason for changing the mark";
    }
    if (value.trim().length < 10) {
      return "Please provide a detailed reason (minimum 10 characters)";
    }
    return null;
  };

  // Handle real-time mark change
  const handleMarkChange = (e) => {
    const value = e.target.value;
    setNewMark(value);
    setTouched(prev => ({ ...prev, mark: true }));
    
    const error = validateMark(value);
    setErrors(prev => ({ ...prev, mark: error }));
    
    // Clear reason error if it exists when mark becomes valid
    if (!error && errors.reason) {
      setErrors(prev => ({ ...prev, reason: validateReason(reason) }));
    }
  };

  // Handle real-time reason change
  const handleReasonChange = (e) => {
    const value = e.target.value;
    setReason(value);
    setTouched(prev => ({ ...prev, reason: true }));
    
    const error = validateReason(value);
    setErrors(prev => ({ ...prev, reason: error }));
  };

  // Handle blur for mark field
  const handleMarkBlur = () => {
    setTouched(prev => ({ ...prev, mark: true }));
    const error = validateMark(newMark);
    setErrors(prev => ({ ...prev, mark: error }));
  };

  // Handle blur for reason field
  const handleReasonBlur = () => {
    setTouched(prev => ({ ...prev, reason: true }));
    const error = validateReason(reason);
    setErrors(prev => ({ ...prev, reason: error }));
  };

  // Validate all for submit
  const validate = () => {
    const markError = validateMark(newMark);
    const reasonError = validateReason(reason);
    
    const newErrors = {};
    if (markError) newErrors.mark = markError;
    if (reasonError) newErrors.reason = reasonError;
    
    setErrors(newErrors);
    setTouched({ mark: true, reason: true });
    
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

  // Check if form is valid
  const isFormValid = () => {
    return newMark && 
           newMark !== "" && 
           !validateMark(newMark) && 
           reason && 
           reason.trim().length >= 10 &&
           parseFloat(newMark) !== submission.mark;
  };

  if (!isOpen) return null;

  // Get border color based on validation state
  const getMarkBorderColor = () => {
    if (!touched.mark) return "#dde3eb";
    if (errors.mark) return "#ff4d4f";
    return "#10b981";
  };

  const getReasonBorderColor = () => {
    if (!touched.reason) return "#dde3eb";
    if (errors.reason) return "#ff4d4f";
    return "#10b981";
  };

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
            <label style={modalLabelStyle}>
              New Mark <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={newMark}
              onChange={handleMarkChange}
              onBlur={handleMarkBlur}
              style={{
                ...modalInputStyle,
                borderColor: getMarkBorderColor()
              }}
              placeholder="Enter new mark"
            />
            {touched.mark && errors.mark && (
              <p style={errorTextStyle}>{errors.mark}</p>
            )}
            {touched.mark && !errors.mark && newMark && newMark !== "" && (
              <p style={successTextStyle}>✓ Valid mark</p>
            )}
          </div>
          
          <div style={formGroupStyle}>
            <label style={modalLabelStyle}>
              Reason for Change <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={handleReasonChange}
              onBlur={handleReasonBlur}
              style={{
                ...modalTextareaStyle,
                borderColor: getReasonBorderColor(),
                minHeight: "100px"
              }}
              rows="4"
              placeholder="Please provide a detailed reason for modifying this mark..."
            />
            {touched.reason && errors.reason && (
              <p style={errorTextStyle}>{errors.reason}</p>
            )}
            {touched.reason && !errors.reason && reason && reason.trim().length >= 10 && (
              <p style={successTextStyle}>✓ Valid reason</p>
            )}
            <div style={charCountStyle(reason.length)}>
              {reason.length} / 2000 characters {reason.length < 10 && `(minimum 10 required)`}
            </div>
          </div>
        </div>
        
        <div style={modalFooterStyle}>
          <button onClick={onClose} style={modalCancelBtnStyle}>Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={!isFormValid()}
            style={{
              ...modalSaveBtnStyle,
              opacity: !isFormValid() ? 0.6 : 1,
              cursor: !isFormValid() ? "not-allowed" : "pointer"
            }}
          >
            Save Changes
          </button>
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

// Mark Revision Log Table Component
const MarkRevisionLogTable = ({ revisions, loading, onRefresh }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [submissionIdFilter, setSubmissionIdFilter] = useState("");
  const [filteredRevisions, setFilteredRevisions] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    let filtered = [...revisions];
    if (submissionIdFilter.trim()) {
      filtered = filtered.filter(rev => 
        rev.submission_id?.toString().toLowerCase().includes(submissionIdFilter.toLowerCase())
      );
    }
    setFilteredRevisions(filtered);
    setCurrentPage(1);
  }, [revisions, submissionIdFilter]);

  const totalPages = Math.ceil(filteredRevisions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRevisions.slice(indexOfFirstItem, indexOfLastItem);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const handleClearFilter = () => {
    setSubmissionIdFilter("");
  };

  // Generate Report for Mark Revision Audit Log
  const handleGenerateRevisionReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/lecturer/marks/audits/report", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mark_revision_audit_log_${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        appToast(`Error: ${data.message || "Failed to generate report"}`, "error");
      }
    } catch (err) {
      console.error("Error generating revision report:", err);
      appToast("Failed to connect to server", "error");
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div style={revisionTableCardStyle}>
      <div style={revisionCardHeaderStyle}>
        <div style={iconBoxStyle}>📝</div>
        <div style={{ flex: 1 }}>
          <h3 style={cardTitleStyle}>Mark Revision Audit Log</h3>
          <p style={cardSubtitleStyle}>Track all mark changes with revision history.</p>
        </div>
        {/* Generate Report Button - Top Right */}
        <button
          onClick={handleGenerateRevisionReport}
          disabled={generatingReport || revisions.length === 0}
          style={{
            ...generateReportBtnStyle,
            opacity: (generatingReport || revisions.length === 0) ? 0.6 : 1,
            cursor: (generatingReport || revisions.length === 0) ? "not-allowed" : "pointer"
          }}
        >
          {generatingReport ? (
            <>
              <span style={btnSpinnerStyle} />
              Generating...
            </>
          ) : (
            <>
              📥 Generate Report
            </>
          )}
        </button>
      </div>

      <div style={cardContentStyle}>
        {/* Filter by Submission ID */}
        <div style={filterContainerStyle}>
          <div style={filterInputWrapperStyle}>
            <label style={filterLabelStyle}>Filter by Submission ID</label>
            <div style={filterInputContainerStyle}>
              <span style={filterIconStyle}>🔍</span>
              <input
                type="text"
                placeholder="Enter Submission ID..."
                value={submissionIdFilter}
                onChange={(e) => setSubmissionIdFilter(e.target.value)}
                style={filterInputStyle}
              />
              {submissionIdFilter && (
                <button onClick={handleClearFilter} style={clearFilterInputBtnStyle}>
                  ✕
                </button>
              )}
            </div>
          </div>
          <div style={itemsPerPageWrapperStyle}>
            <label style={filterLabelStyle}>Show</label>
            <div style={itemsPerPageSelectStyle}>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                style={filterSelectStyle}
              >
                <option value={6}>6 per page</option>
                <option value={8}>8 per page</option>
                <option value={10}>10 per page</option>
              </select>
              <span style={filterArrowStyle}>▼</span>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={resultsCountContainerStyle}>
          <div style={resultsCountStyle}>
            Showing <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredRevisions.length)}</strong> of <strong>{filteredRevisions.length}</strong> revisions
          </div>
        </div>

        {/* Table */}
        <div style={revisionTableContainerStyle}>
          <div style={revisionTableHeaderStyle}>
            <div style={revisionHeaderCellStyle}>Submission ID</div>
            <div style={revisionHeaderCellStyle}>Old Mark</div>
            <div style={revisionHeaderCellStyle}>New Mark</div>
            <div style={revisionHeaderCellStyle}>Change</div>
            <div style={revisionHeaderCellStyle}>Revision Reason</div>
            <div style={revisionHeaderCellStyle}>Revised By</div>
            <div style={revisionHeaderCellStyle}>Revised Date</div>
          </div>

          {loading ? (
            <div style={loadingContainerStyle}>
              <div style={spinnerStyle} />
              <p style={loadingTextStyle}>Loading revision history...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div style={emptyContainerStyle}>
              <div style={emptyIconStyle}>📭</div>
              <p style={emptyTitleStyle}>No revisions found</p>
              <p style={emptyMessageStyle}>
                {submissionIdFilter ? "No revisions found for this submission ID." : "No mark revisions recorded yet."}
              </p>
            </div>
          ) : (
            currentItems.map((rev, index) => {
              const change = rev.new_mark - rev.old_mark;
              const changeColor = change > 0 ? "#10b981" : change < 0 ? "#ef4444" : "#6b7280";
              const changeSymbol = change > 0 ? "↑" : change < 0 ? "↓" : "→";
              
              return (
                <div key={rev.revision_id || index} style={revisionTableRowStyle(index === currentItems.length - 1)}>
                  <div style={revisionCellStyle}>
                    <span style={submissionIdStyle}>SUB - {rev.submission_id}</span>
                  </div>
                  <div style={revisionCellStyle}>
                    <span style={oldMarkStyle}>{rev.old_mark}</span>
                  </div>
                  <div style={revisionCellStyle}>
                    <span style={newMarkStyle}>{rev.new_mark}</span>
                  </div>
                  <div style={revisionCellStyle}>
                    <span style={{ ...changeStyle, color: changeColor }}>
                      {changeSymbol} {Math.abs(change).toFixed(2)}
                    </span>
                  </div>
                  <div style={revisionCellStyle}>
                    <span style={reasonStyle} title={rev.revision_reason}>
                      {rev.revision_reason?.length > 60 
                        ? `${rev.revision_reason.substring(0, 60)}...` 
                        : rev.revision_reason || "N/A"}
                    </span>
                  </div>
                  <div style={revisionCellStyle}>
                    <span style={modifiedByNameStyle}>{rev.lecturer_name || "N/A"}</span>
                  </div>
                  <div style={revisionCellStyle}>
                    <span style={dateStyle}>{formatDate(rev.revised_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredRevisions.length > 0 && (
          <div style={paginationContainerStyle}>
            <div style={paginationInfoStyle}>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            <div style={paginationControlsStyle}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={paginationButtonStyle(currentPage === 1)}
              >
                ← Previous
              </button>
              
              <div style={pageNumbersStyle}>
                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} style={ellipsisStyle}>...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={pageNumberButtonStyle(currentPage === page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={paginationButtonStyle(currentPage === totalPages)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MarkRevisionAuditLog() {
  const API_BASE = process.env.REACT_APP_API_URL || "";

  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
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
  const [session, setSession] = useState(null);
  const [generatingMarksReport, setGeneratingMarksReport] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Fetch session to get lecturer info
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_BASE}/api/auth/session`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      }
    };
    fetchSession();
  }, [API_BASE]);

  // Fetch all published marks
  useEffect(() => {
    fetchPublishedMarks();
    fetchRevisionLog();
  }, []);

  const fetchPublishedMarks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lecturer/marks", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data);
        setFilteredSubmissions(data.data);
        
        const uniqueAssessments = ["All", ...new Set(data.data.map(s => s.assignment_name))];
        setAssessments(uniqueAssessments);
      }
    } catch (err) {
      console.error("Error fetching published marks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevisionLog = async () => {
    setRevisionsLoading(true);
    try {
      const res = await fetch("/api/lecturer/marks/audits", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setRevisions(data.data);
      }
    } catch (err) {
      console.error("Error fetching revision log:", err);
    } finally {
      setRevisionsLoading(false);
    }
  };

  // Filter submissions based on search and assessment filter
  useEffect(() => {
    let filtered = [...submissions];
    
    if (assessmentFilter !== "All") {
      filtered = filtered.filter(s => s.assignment_name === assessmentFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.submission_id?.toString().toLowerCase().includes(query) ||
        s.assignment_name?.toLowerCase().includes(query) ||
        s.subject_name?.toLowerCase().includes(query)
      );
    }
    
    setFilteredSubmissions(filtered);
    setCurrentPage(1);
  }, [searchQuery, assessmentFilter, submissions]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Handle Edit Mark
  const handleEditMark = async (data) => {
    try {
      const res = await fetch("/api/lecturer/marks/update", {
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
          "Modified By": session?.lecturer_name || session?.name || "Lecturer",
          "Reason": data.reason
        });
        setShowSuccessPopup(true);
        fetchPublishedMarks();
        fetchRevisionLog();
        setShowEditModal(false);
        setSelectedSubmission(null);
      } else {
        appToast(`Error: ${response.message || "Failed to update mark"}`, "error");
      }
    } catch (err) {
      console.error("Error updating mark:", err);
      appToast("Failed to connect to server", "error");
    }
  };

  // Handle Delete Mark
  const handleDeleteMark = async () => {
    if (!selectedSubmission) return;
    
    try {
      const res = await fetch(`/api/lecturer/marks/delete/${selectedSubmission.submission_id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      
      const response = await res.json();
      
      if (res.ok) {
        setPopupTitle("✓ Mark Deleted");
        setPopupMessage(`Mark for "${selectedSubmission.assignment_name}" has been successfully deleted.`);
        setPopupDetails({
          "Submission ID": selectedSubmission.submission_id,
          "Assignment": selectedSubmission.assignment_name,
          "Previous Mark": `${selectedSubmission.mark}/${selectedSubmission.total}`,
          "Deleted By": session?.lecturer_name || session?.name || "Lecturer"
        });
        setShowSuccessPopup(true);
        fetchPublishedMarks();
        setShowDeleteModal(false);
        setSelectedSubmission(null);
      } else {
        appToast(`Error: ${response.message || "Failed to delete mark"}`, "error");
      }
    } catch (err) {
      console.error("Error deleting mark:", err);
      appToast("Failed to connect to server", "error");
    }
  };

  // Generate Report for Published Marks
  const handleGenerateMarksReport = async () => {
    setGeneratingMarksReport(true);
    try {
      const res = await fetch("/api/lecturer/marks/report", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `published_marks_report_${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        appToast(`Error: ${data.message || "Failed to generate report"}`, "error");
      }
    } catch (err) {
      console.error("Error generating marks report:", err);
      appToast("Failed to connect to server", "error");
    } finally {
      setGeneratingMarksReport(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div style={pageContainerStyle}>
      <LecturerNavbar activePage="Mark Revision" />

      <main style={mainContainerStyle}>
        <section style={headerSectionStyle}>
          <h2 style={pageTitleStyle}>Mark Revision Audit Log</h2>
          <p style={pageSubtitleStyle}>View, edit, and manage all published marks with revision history.</p>
        </section>

        {/* Published Marks Table */}
        <div style={mainCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>📊</div>
            <div style={{ flex: 1 }}>
              <h3 style={cardTitleStyle}>Published Marks</h3>
              <p style={cardSubtitleStyle}>Manage and audit all published student marks.</p>
            </div>
            {/* Generate Report Button - Top Right of Published Marks */}
            <button
              onClick={handleGenerateMarksReport}
              disabled={generatingMarksReport || submissions.length === 0}
              style={{
                ...generateReportBtnStyle,
                opacity: (generatingMarksReport || submissions.length === 0) ? 0.6 : 1,
                cursor: (generatingMarksReport || submissions.length === 0) ? "not-allowed" : "pointer"
              }}
            >
              {generatingMarksReport ? (
                <>
                  <span style={btnSpinnerStyle} />
                  Generating...
                </>
              ) : (
                <>
                  📥 Generate Report
                </>
              )}
            </button>
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
                    placeholder="Search by submission ID, assignment, or subject..."
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

              <div style={itemsPerPageWrapperStyle}>
                <label style={filterLabelStyle}>Show</label>
                <div style={itemsPerPageSelectStyle}>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    style={filterSelectStyle}
                  >
                    <option value={6}>6 per page</option>
                    <option value={8}>8 per page</option>
                    <option value={10}>10 per page</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div style={resultsCountContainerStyle}>
              <div style={resultsCountStyle}>
                Showing <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredSubmissions.length)}</strong> of <strong>{filteredSubmissions.length}</strong> submissions
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

            {/* Table - Properly Aligned with Stacked Buttons */}
            <div style={tableContainerStyle}>
              <div style={tableHeaderStyle}>
                <div style={headerCellStyle}>Submission ID</div>
                <div style={headerCellStyle}>Assignment Name</div>
                <div style={headerCellStyle}>Subject</div>
                <div style={headerCellStyle}>Marks</div>
                <div style={headerCellStyle}>Published By</div>
                <div style={headerCellStyle}>Published Date</div>
                <div style={headerCellStyle}>Modified By</div>
                <div style={headerCellStyle}>Modified Date</div>
                <div style={headerCellStyle}>Actions</div>
              </div>

              {loading ? (
                <div style={loadingContainerStyle}>
                  <div style={spinnerStyle} />
                  <p style={loadingTextStyle}>Loading marks...</p>
                </div>
              ) : currentItems.length === 0 ? (
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
                currentItems.map((sub, index) => (
                  <div key={sub.submission_id} style={tableRowStyle(index === currentItems.length - 1)}>
                    <div style={cellStyle}>
                      <span style={submissionIdStyle}>SUB - {sub.submission_id}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={assignmentNameStyle}>{sub.assignment_name}</span>
                      <a 
                        href={`${API_BASE}/api/marks/pdf/${sub.submission_id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={pdfLinkStyle}
                      >
                        📄 Open Submission File
                      </a>
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
                      <span style={publishedByNameStyle}>{sub.published_by || "N/A"}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={dateStyle}>{formatDate(sub.published_at)}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={modifiedByNameStyle}>{sub.updated_by || "N/A"}</span>
                    </div>
                    <div style={cellStyle}>
                      <span style={dateStyle}>{sub.updated_at ? formatDate(sub.updated_at) : "N/A"}</span>
                    </div>
                    <div style={cellStyle}>
                      <div style={stackedButtonsStyle}>
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setShowEditModal(true);
                          }}
                          style={stackedEditBtnStyle}
                          title="Edit Mark"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setShowDeleteModal(true);
                          }}
                          style={stackedDeleteBtnStyle}
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

            {/* Pagination */}
            {!loading && filteredSubmissions.length > 0 && (
              <div style={paginationContainerStyle}>
                <div style={paginationInfoStyle}>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
                <div style={paginationControlsStyle}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={paginationButtonStyle(currentPage === 1)}
                  >
                    ← Previous
                  </button>
                  
                  <div style={pageNumbersStyle}>
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} style={ellipsisStyle}>...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          style={pageNumberButtonStyle(currentPage === page)}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={paginationButtonStyle(currentPage === totalPages)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mark Revision Log Table */}
        <MarkRevisionLogTable 
          revisions={revisions}
          loading={revisionsLoading}
          onRefresh={fetchRevisionLog}
        />
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
  overflow: "hidden",
  marginBottom: "32px"
};

const cardHeaderStyle = {
  height: "70px",
  padding: "0 28px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  borderBottom: "1px solid #edf1f5"
};

const iconBoxStyle = {
  width: "40px",
  height: "40px",
  backgroundColor: "#3c74ff",
  borderRadius: "10px",
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

// Generate Report Button Style
const generateReportBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#0d9488",
  color: "#fff",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  whiteSpace: "nowrap",
  boxShadow: "0 2px 8px rgba(13, 148, 136, 0.3)",
  marginLeft: "auto"
};

// Spinner inside button
const btnSpinnerStyle = {
  display: "inline-block",
  width: "14px",
  height: "14px",
  border: "2px solid rgba(255,255,255,0.4)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite"
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
  minWidth: "200px"
};

const itemsPerPageWrapperStyle = {
  flex: "0.5",
  minWidth: "140px"
};

const itemsPerPageSelectStyle = {
  width: "100%"
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

// Table Styles - Properly Aligned
const tableContainerStyle = {
  border: "1px solid #edf1f5",
  borderRadius: "12px",
  overflow: "auto"
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "0.7fr 1.5fr 1.1fr 0.6fr 0.9fr 1fr 0.9fr 1fr 0.7fr",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #edf1f5",
  position: "sticky",
  top: 0,
  zIndex: 10
};

const headerCellStyle = {
  padding: "14px 12px",
  fontSize: "11px",
  fontWeight: "700",
  color: "#5c6b80",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  textAlign: "left"
};

const tableRowStyle = (isLast) => ({
  display: "grid",
  gridTemplateColumns: "0.7fr 1.5fr 1.1fr 0.6fr 0.9fr 1fr 0.9fr 1fr 0.7fr",
  borderBottom: isLast ? "none" : "1px solid #edf1f5",
  transition: "background 0.2s",
  alignItems: "center"
});

const cellStyle = {
  padding: "14px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  alignItems: "flex-start"
};

const successTextStyle = {
  color: "#10b981",
  fontSize: "11px",
  marginTop: "4px",
  display: "block"
};

const charCountStyle = (length) => ({
  color: length > 1900 ? (length > 2000 ? "#ef4444" : "#f59e0b") : "#94a3b8",
  fontSize: "11px",
  marginTop: "4px",
  display: "block"
});

const pdfLinkStyle = {
  fontSize: "11px",
  fontWeight: "bold",
  color: "#3c74ff",
  textDecoration: "none",
  marginTop: "4px",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px"
};

// Stacked Buttons Styles
const stackedButtonsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  alignItems: "flex-start"
};

const stackedEditBtnStyle = {
  padding: "6px 16px",
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
  gap: "6px",
  whiteSpace: "nowrap",
  width: "fit-content"
};

const stackedDeleteBtnStyle = {
  padding: "6px 16px",
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
  gap: "6px",
  whiteSpace: "nowrap",
  width: "fit-content"
};

// Cell Content Styles
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

const publishedByNameStyle = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#64748b"
};

const modifiedByNameStyle = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#64748b"
};

// Revision Log Table Styles
const revisionTableCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #d8dee8",
  borderRadius: "14px",
  overflow: "hidden",
  marginTop: "32px"
};

const revisionCardHeaderStyle = {
  height: "70px",
  padding: "0 28px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  borderBottom: "1px solid #edf1f5"
};

const filterContainerStyle = {
  display: "flex",
  gap: "24px",
  marginBottom: "24px",
  flexWrap: "wrap",
  alignItems: "flex-end"
};

const filterInputWrapperStyle = {
  flex: "2",
  minWidth: "300px"
};

const filterInputContainerStyle = {
  position: "relative",
  width: "100%"
};

const filterIconStyle = {
  position: "absolute",
  left: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "16px",
  color: "#9aa8bb",
  pointerEvents: "none",
  zIndex: 1
};

const filterInputStyle = {
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

const clearFilterInputBtnStyle = {
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

const revisionTableContainerStyle = {
  border: "1px solid #edf1f5",
  borderRadius: "12px",
  overflow: "auto"
};

const revisionTableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "0.9fr 0.7fr 0.7fr 0.6fr 2.2fr 1fr 1.2fr",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #edf1f5",
  position: "sticky",
  top: 0,
  zIndex: 10
};

const revisionHeaderCellStyle = {
  padding: "12px 12px",
  fontSize: "11px",
  fontWeight: "700",
  color: "#5c6b80",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  textAlign: "left"
};

const revisionTableRowStyle = (isLast) => ({
  display: "grid",
  gridTemplateColumns: "0.9fr 0.7fr 0.7fr 0.6fr 2.2fr 1fr 1.2fr",
  borderBottom: isLast ? "none" : "1px solid #edf1f5",
  transition: "background 0.2s",
  alignItems: "center"
});

const revisionCellStyle = {
  padding: "12px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  alignItems: "flex-start"
};

const oldMarkStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#ef4444"
};

const newMarkStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#10b981"
};

const changeStyle = {
  fontSize: "12px",
  fontWeight: "600"
};

const reasonStyle = {
  fontSize: "12px",
  color: "#4b5563",
  lineHeight: "1.4",
  maxWidth: "280px"
};

// Pagination Styles
const paginationContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  borderTop: "1px solid #edf1f5",
  backgroundColor: "#fafbfc",
  marginTop: "20px",
  flexWrap: "wrap",
  gap: "16px"
};

const paginationInfoStyle = {
  fontSize: "13px",
  color: "#5c6b80"
};

const paginationControlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap"
};

const pageNumbersStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

const paginationButtonStyle = (disabled) => ({
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #dde3eb",
  backgroundColor: disabled ? "#f5f5f5" : "#fff",
  color: disabled ? "#b0b0b0" : "#3c74ff",
  fontSize: "13px",
  fontWeight: "500",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.2s"
});

const pageNumberButtonStyle = (active) => ({
  minWidth: "36px",
  height: "36px",
  padding: "0 8px",
  borderRadius: "8px",
  border: active ? "none" : "1px solid #dde3eb",
  backgroundColor: active ? "#3c74ff" : "#fff",
  color: active ? "#fff" : "#5c6b80",
  fontSize: "13px",
  fontWeight: active ? "600" : "500",
  cursor: "pointer",
  transition: "all 0.2s"
});

const ellipsisStyle = {
  padding: "0 4px",
  color: "#9aa8bb",
  fontSize: "13px"
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
  `;
  document.head.appendChild(style);
}