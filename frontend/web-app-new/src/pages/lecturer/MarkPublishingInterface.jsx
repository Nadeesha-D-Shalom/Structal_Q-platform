import { useState, useEffect } from "react";
import LecturerNavbar from "./LecturerNavbar";
import { appToast, appConfirm } from "../../components/UIFeedback/appNotify"; 

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

export default function PublishMarksConfig() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDetails, setPopupDetails] = useState({});
  const [assessmentStats, setAssessmentStats] = useState(null);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [session, setSession] = useState(null);
  
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch session to get lecturer info
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
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      }
    };
    fetchSession();
  }, []);

  // Fetch Assessments
  useEffect(() => {
    const fetchAssessments = async () => {
      const res = await fetch(`${API_BASE_URL}/api/marks/assessments`, {
        credentials: "include"
      });

      const data = await res.json();
      setAssessments(data);
    };

    fetchAssessments();
  }, []);

  // Handle Assessment Selection
  const handleAssessmentChange = async (e) => {
    const aid = e.target.value;
    setSelectedAssessmentId(aid);
    setErrors({});
    setTouched({});
    setAssessmentStats(null);
    setCurrentPage(1);

    if (!aid) {
      setPendingSubmissions([]);
      return;
    }

    setIsLoadingSubmissions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/marks/pending-submissions?assessment_id=${aid}`, {
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        setPendingSubmissions(data.data || []);
        setAssessmentStats(data.stats);
      } else {
        setPendingSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setPendingSubmissions([]);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Validate all marks before bulk publish
  const validateAllMarks = () => {
    const newErrors = {};
    let hasErrors = false;
    
    pendingSubmissions.forEach(sub => {
      const mark = sub.evaluated_final_mark;
      if (!mark || mark === "") {
        newErrors[sub.submission_id] = "Please enter a mark";
        hasErrors = true;
      } else {
        const markNum = parseFloat(mark);
        if (isNaN(markNum)) {
          newErrors[sub.submission_id] = "Please enter a valid number";
          hasErrors = true;
        } else if (markNum < 0) {
          newErrors[sub.submission_id] = "Mark cannot be negative";
          hasErrors = true;
        } else if (markNum > sub.max_mark) {
          newErrors[sub.submission_id] = `Mark cannot exceed ${sub.max_mark}`;
          hasErrors = true;
        }
      }
    });
    
    setErrors(newErrors);
    setTouched(Object.keys(newErrors).reduce((acc, id) => ({ ...acc, [id]: true }), {}));
    return !hasErrors;
  };

// Bulk publish all pending submissions
const handleBulkPublish = async () => {
    if (!validateAllMarks()) {
        appToast("Please fix the errors before publishing.", "warning");
        return;
    }
    
    if (pendingSubmissions.length === 0) {
        appToast("No submissions to publish", "warning");
        return;
    }
    
    const userConfirmed = await appConfirm(
      `Are you sure you want to publish ${pendingSubmissions.length} submission(s)?`,
      { title: "Publish marks", confirmLabel: "Publish", variant: "warning" }
    );
    if (!userConfirmed) {
        return;
    }
    
    // Prepare the data for bulk publish
    const submissionsToPublish = pendingSubmissions.map(sub => ({
        submission_id: sub.submission_id,
        final_mark: parseFloat(sub.evaluated_final_mark),
        ai_score: sub.ai_marks,
        manual_mark: sub.diagram_marks,
        enable_concern_window: true
    }));
    
    console.log("Submissions to publish:", submissionsToPublish.length);
    
    setBulkPublishing(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/marks/publish`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ submissions: submissionsToPublish, published_by: session?.name })
        });
        
        const result = await response.json();
        console.log("Bulk publish result:", result);
        
        if (response.ok && result.success) {
            setPopupTitle("✓ Bulk Publish Completed");
            setPopupMessage(`Published: ${result.published?.length || 0} submissions, Failed: ${result.errors?.length || 0}`);
            setPopupDetails({
                "Total Processed": submissionsToPublish.length,
                "Successfully Published": result.published?.length || 0,
                "Failed": result.errors?.length || 0,
                ...(result.errors?.length > 0 && { "Errors": JSON.stringify(result.errors.slice(0, 3)) })
            });
            setShowSuccessPopup(true);
            
            // Refresh the list
            await handleAssessmentChange({ target: { value: selectedAssessmentId } });
        } else {
            appToast(result.message || "Bulk publish failed", "error");
        }
    } catch (err) {
        console.error("Error in bulk publish:", err);
        appToast(`Failed to connect to server: ${err.message}`, "error");
    } finally {
        setBulkPublishing(false);
    }
  };

  // Export to CSV
  // Export to CSV - Working version
const handleExportCSV = async () => {
    if (!selectedAssessmentId) {
        appToast("Please select an assessment first", "warning");
        return;
    }
    
    if (pendingSubmissions.length === 0) {
        appToast("No data to export", "warning");
        return;
    }
    
    setExportingCSV(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/marks/export-csv/${selectedAssessmentId}`, {
            method: 'GET',
            credentials: "include",
            headers: {
                'Accept': 'text/csv'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `marks_to_publish_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        appToast("CSV exported successfully!", "success");
    } catch (err) {
        console.error("Export error:", err);
        appToast(`Failed to export CSV: ${err.message}`, "error");
    } finally {
        setExportingCSV(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(pendingSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = pendingSubmissions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getErrorMessage = (submissionId) => {
    return touched[submissionId] && errors[submissionId] ? errors[submissionId] : null;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f6fa", fontFamily: "'Inter', sans-serif" }}>
      
      <LecturerNavbar activePage="Publish Marks" />

      <SuccessPopup
        isVisible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={popupTitle}
        message={popupMessage}
        details={popupDetails}
      />

      <main style={{ padding: "34px 44px" }}>
        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 23, fontWeight: "bold", color: "#18243d" }}>Publish Marks Configuration</h2>
          <p style={{ fontSize: 13, color: "#74839a" }}>Review and publish evaluated results in bulk.</p>
        </section>

        <div style={mainCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>✔</div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#24324a" }}>Mark Publication Settings</h3>
              <p style={{ fontSize: 12, color: "#74839a" }}>Select assessment and publish evaluated marks in bulk.</p>
            </div>
          </div>

          <div style={{ padding: "24px 32px" }}>
            {/* Assessment Selection */}
            <div style={{ marginBottom: 28 }}>
              <label style={imageLabelStyle}>Assessment *</label>
              <select 
                style={{
                  ...imageSelectStyle,
                  width: "100%",
                  maxWidth: "500px",
                  borderColor: errors.assessment ? "#ff4d4f" : "#dde3eb"
                }} 
                value={selectedAssessmentId} 
                onChange={handleAssessmentChange}
              >
                <option value="">Choose an Assessment</option>
                {Array.isArray(assessments) && assessments.map(a => (
                  <option key={a.assessment_id} value={a.assessment_id}>
                    {a.assessment_title} (Max: {a.total_marks})
                  </option>
                ))}
              </select>
            </div>

            {/* Stats Cards */}
            {assessmentStats && assessmentStats.total_pending > 0 && (
              <div style={statsContainerStyle}>
                <div style={statsCardStyle}>
                  <div style={statsIconStyle}>📊</div>
                  <div>
                    <div style={statsLabelStyle}>Pending Submissions</div>
                    <div style={statsValueStyle}>{assessmentStats.total_pending}</div>
                  </div>
                </div>
                <div style={statsCardStyle}>
                  <div style={statsIconStyle}>📈</div>
                  <div>
                    <div style={statsLabelStyle}>Average Mark</div>
                    <div style={statsValueStyle}>{assessmentStats.avg_mark?.toFixed(2) || 0}%</div>
                  </div>
                </div>
                <div style={statsCardStyle}>
                  <div style={statsIconStyle}>🏆</div>
                  <div>
                    <div style={statsLabelStyle}>Highest Mark</div>
                    <div style={statsValueStyle}>{assessmentStats.max_mark || 0}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {pendingSubmissions.length > 0 && (
              <div style={actionButtonsContainer}>
                <button
                  onClick={handleExportCSV}
                  disabled={exportingCSV}
                  style={exportCsvBtnStyle}
                >
                  {exportingCSV ? "⏳ Exporting..." : "📥 Export CSV"}
                </button>
                <button
                  onClick={handleBulkPublish}
                  disabled={bulkPublishing}
                  style={bulkPublishBtnStyle}
                >
                  {bulkPublishing ? "⏳ Publishing..." : "📦 Bulk Publish All"}
                </button>
              </div>
            )}

            {/* Pending Submissions Table with Pagination */}
            {isLoadingSubmissions ? (
              <div style={loadingContainerStyle}>
                <div style={spinnerStyle} />
                <p style={{ color: "#64748b", marginTop: 16 }}>Loading submissions...</p>
              </div>
            ) : pendingSubmissions.length === 0 && selectedAssessmentId ? (
              <div style={emptyContainerStyle}>
                <div style={emptyIconStyle}>✅</div>
                <p style={emptyTitleStyle}>No Pending Submissions</p>
                <p style={emptyMessageStyle}>
                  All evaluated results for this assessment have been published.
                </p>
              </div>
            ) : pendingSubmissions.length === 0 ? (
              <div style={emptyContainerStyle}>
                <div style={emptyIconStyle}>📋</div>
                <p style={emptyTitleStyle}>Select an Assessment</p>
                <p style={emptyMessageStyle}>
                  Choose an assessment to view pending submissions.
                </p>
              </div>
            ) : (
              <>
                <div style={tableContainerStyle}>
                  <div style={tableHeaderStyle}>
                    <div style={headerCellStyle}>Submission ID</div>
                    <div style={headerCellStyle}>Student ID</div>
                    <div style={headerCellStyle}>AI Score</div>
                    <div style={headerCellStyle}>Diagram Marks</div>
                    <div style={headerCellStyle}>Calculated Mark</div>
                    <div style={headerCellStyle}>Mark to Publish</div>
                  </div>

                  {currentSubmissions.map((sub) => {
                    const error = getErrorMessage(sub.submission_id);
                    const markValue = sub.evaluated_final_mark;
                    
                    return (
                      <div key={sub.submission_id} style={tableRowStyle}>
                        <div style={cellStyle}>
                          <span style={submissionIdStyle}>{sub.submission_id}</span>
                        </div>
                        <div style={cellStyle}>
                          <span style={studentIdStyle}>{sub.student_id}</span>
                        </div>
                        <div style={cellStyle}>
                          <span style={aiScoreStyle}>{sub.ai_marks}%</span>
                        </div>
                        <div style={cellStyle}>
                          <span style={diagramMarksStyle}>{sub.diagram_marks}%</span>
                        </div>
                        <div style={cellStyle}>
                          <span style={calculatedMarkStyle}>{sub.evaluated_final_mark}%</span>
                        </div>
                        <div style={cellStyle}>
                          <input
                            type="number"
                            step="0.01"
                            value={markValue}
                            readOnly
                            style={{
                              ...markInputStyle,
                              backgroundColor: "#f8f9fa",
                              cursor: "not-allowed"
                            }}
                            placeholder="Mark"
                          />
                          {error && <p style={errorTextStyle}>{error}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={paginationContainerStyle}>
                    <div style={paginationInfoStyle}>
                      Showing {startIndex + 1} to {Math.min(endIndex, pendingSubmissions.length)} of {pendingSubmissions.length} submissions
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
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          if (pageNum > 0 && pageNum <= totalPages) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                style={pageNumberButtonStyle(currentPage === pageNum)}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={paginationButtonStyle(currentPage === totalPages)}
                      >
                        Next →
                      </button>
                    </div>
                    
                    <div style={itemsPerPageStyle}>
                      <span>Show:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        style={itemsPerPageSelectStyle}
                      >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Styles
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

const errorTextStyle = { color: "#ff4d4f", fontSize: 11, fontWeight: "bold", marginTop: 6 };

const mainCardStyle = { 
  backgroundColor: "#fff", 
  border: "1px solid #d8dee8", 
  borderRadius: 14, 
  overflow: "hidden" 
};

const cardHeaderStyle = { 
  height: 70, 
  padding: "0 28px", 
  display: "flex", 
  alignItems: "center", 
  gap: 12, 
  borderBottom: "1px solid #edf1f5" 
};

const iconBoxStyle = { 
  width: 40, 
  height: 40, 
  backgroundColor: "#3c74ff", 
  borderRadius: 10, 
  color: "#fff", 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  fontSize: 14 
};

const imageLabelStyle = { 
  display: "block", 
  fontSize: 11, 
  fontWeight: "bold", 
  color: "#9aa8bb", 
  textTransform: "uppercase", 
  letterSpacing: "0.06em", 
  marginBottom: 8 
};

const imageSelectStyle = { 
  width: "100%", 
  padding: "10px 14px", 
  borderRadius: 10, 
  border: "1px solid #dde3eb", 
  fontSize: 13, 
  color: "#2e3b52", 
  outline: "none", 
  transition: "border-color 0.2s",
  backgroundColor: "#fff"
};

// Stats Styles
const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
  marginBottom: "24px"
};

const statsCardStyle = {
  backgroundColor: "#f8f9fc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "16px",
  display: "flex",
  alignItems: "center",
  gap: "12px"
};

const statsIconStyle = {
  fontSize: "28px"
};

const statsLabelStyle = {
  fontSize: "11px",
  color: "#64748b",
  fontWeight: "500",
  textTransform: "uppercase"
};

const statsValueStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#18243d"
};

// Action Buttons Styles
const actionButtonsContainer = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "16px",
  marginBottom: "24px"
};

const exportCsvBtnStyle = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#10b981",
  color: "#fff",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s"
};

const bulkPublishBtnStyle = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#3c74ff",
  color: "#fff",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s"
};

// Table Styles
const tableContainerStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  overflow: "auto",
  maxHeight: "calc(100vh - 480px)"
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "0.8fr 0.8fr 0.7fr 0.9fr 0.9fr 1fr",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
  padding: "14px 16px"
};

const headerCellStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns: "0.8fr 0.8fr 0.7fr 0.9fr 0.9fr 1fr",
  padding: "14px 16px",
  borderBottom: "1px solid #f1f5f9",
  transition: "background 0.2s",
  alignItems: "center"
};

const cellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

const submissionIdStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#3c74ff",
  fontFamily: "monospace"
};

const studentIdStyle = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#18243d"
};

const aiScoreStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#8b5cf6"
};

const diagramMarksStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#f59e0b"
};

const calculatedMarkStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#10b981"
};

const markInputStyle = {
  width: "100px",
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px solid #dde3eb",
  fontSize: "13px",
  color: "#2e3b52",
  outline: "none",
  transition: "border-color 0.2s",
  backgroundColor: "#f8f9fa"
};

// Pagination Styles
const paginationContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  borderTop: "1px solid #e2e8f0",
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

const itemsPerPageStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  color: "#5c6b80"
};

const itemsPerPageSelectStyle = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #dde3eb",
  fontSize: "13px",
  color: "#2e3b52",
  backgroundColor: "#fff",
  cursor: "pointer",
  outline: "none"
};

const loadingContainerStyle = {
  padding: "60px",
  textAlign: "center"
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
  border: "3px solid #e2e8f0",
  borderTopColor: "#3c74ff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
  margin: "0 auto"
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
      opacity: 0.9;
    }
  `;
  document.head.appendChild(style);
}