import { useState, useEffect } from "react";
import LecturerNavbar from "./LecturerNavbar"; 

const API_BASE_URL = "http://localhost:5000";

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      width: 42, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
      backgroundColor: value ? "#3c74ff" : "#dde3eb",
      position: "relative", transition: "all 0.2s ease", flexShrink: 0,
    }}
  >
    <span style={{
      position: "absolute", top: 2, left: value ? 22 : 2,
      width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff",
      transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    }} />
  </button>
);

// Success Popup Component with Animation
const SuccessPopup = ({ isVisible, onClose, mark, submissionId, studentName }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
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
          
          <h2 style={popupTitleStyle}>✓ Mark Published Successfully!</h2>
          
          <div style={popupDetailsStyle}>
            {studentName && (
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Student:</span>
                <span style={detailValueStyle}>{studentName}</span>
              </div>
            )}
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>Submission ID:</span>
              <span style={detailValueStyle}>{submissionId || "N/A"}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>Final Mark:</span>
              <span style={markValueStyle}>{mark}</span>
            </div>
          </div>
          
          <div style={popupFooterStyle}>
            <button onClick={onClose} style={popupButtonStyle}>
              Continue
            </button>
          </div>
          
          <div style={autoCloseHintStyle}>
            Closing in 5 seconds...
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
  const [selectedSub, setSelectedSub] = useState(null);
  const [aiScores, setAiScores] = useState(null);
  const [diagramPages, setDiagramPages] = useState([]);
  const [manualDocumentMark, setManualDocumentMark] = useState("");
  const [enableConcernWindow, setEnableConcernWindow] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [publishedMark, setPublishedMark] = useState(null);
  const [publishedStudentName, setPublishedStudentName] = useState("");
  const [publishedSubmissionId, setPublishedSubmissionId] = useState("");
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Check if document has diagrams
  const hasDiagrams = diagramPages && diagramPages.length > 0;
  
  // Total marks calculation based on whether diagrams exist
  const aiTotal = (!hasDiagrams && aiScores?.final_mark) ? aiScores.final_mark : 0;
  const manualMark = hasDiagrams ? (parseFloat(manualDocumentMark) || 0) : 0;
  const rawSum = hasDiagrams ? manualMark : aiTotal;
  const finalMark = +Math.min(100, Math.max(0, rawSum)).toFixed(2);

  // Fetch Assessments
  useEffect(() => {
    fetch("/api/marks/assessments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssessments(data);
        }
      })
      .catch(err => console.error("Error fetching assessments:", err));
  }, []);

  // Real-time validation function - simplified
  const validateField = (fieldName, value) => {
    const selectedAssessment = assessments.find(a => Number(a.assessment_id) === Number(selectedAssessmentId));
    
    switch(fieldName) {
      case 'assessment':
        if (!value) return "Please select an assessment";
        return null;
        
      case 'submission':
        if (!value) return "Please select a submission";
        return null;
        
      case 'manualMark':
        if (!value || value === "") {
          return "Please enter a mark for the document";
        }
        const markNum = parseFloat(value);
        if (isNaN(markNum)) {
          return "Please enter a valid number";
        }
        if (markNum < 0) {
          return "Mark cannot be negative";
        }
        if (selectedAssessment && markNum > selectedAssessment.total_marks) {
          return `Mark cannot exceed assessment maximum of ${selectedAssessment.total_marks}`;
        }
        if (value.toString().split('.')[1]?.length > 2) {
          return "Mark can have at most 2 decimal places";
        }
        return null;
        
      default:
        return null;
    }
  };

  // Validate only when needed
  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedAssessmentId) {
      newErrors.assessment = "Please select an assessment";
    }
    
    if (!selectedSub) {
      newErrors.submission = "Please select a submission";
    }
    
    if (hasDiagrams) {
      if (!manualDocumentMark || manualDocumentMark === "") {
        newErrors.manualMark = "Please enter a mark for the document";
      } else {
        const markNum = parseFloat(manualDocumentMark);
        const selectedAssessment = assessments.find(a => Number(a.assessment_id) === Number(selectedAssessmentId));
        if (isNaN(markNum)) {
          newErrors.manualMark = "Please enter a valid number";
        } else if (markNum < 0) {
          newErrors.manualMark = "Mark cannot be negative";
        } else if (selectedAssessment && markNum > selectedAssessment.total_marks) {
          newErrors.manualMark = `Mark cannot exceed assessment maximum of ${selectedAssessment.total_marks}`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle real-time input change
  const handleManualMarkChange = (e) => {
    const value = e.target.value;
    setManualDocumentMark(value);
    setTouched({ ...touched, manualMark: true });
    
    if (value && value !== "") {
      const error = validateField('manualMark', value);
      setErrors(prev => ({
        ...prev,
        manualMark: error
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        manualMark: "Please enter a mark for the document"
      }));
    }
  };

  // Handle field blur
  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    validateForm();
  };

  // Handle Assessment Selection
  const handleAssessmentChange = async (e) => {
    const aid = e.target.value;
    setSelectedAssessmentId(aid);
    setErrors({});
    setTouched({});
    setSelectedSub(null); 
    setAiScores(null);
    setDiagramPages([]);
    setManualDocumentMark("");

    if (!aid) {
      setPendingSubmissions([]);
      return;
    }

    setIsLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/marks/pending-submissions?assessment_id=${aid}`);
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Enhance submissions with student info
        const submissionsWithDetails = data.map(sub => ({
          ...sub,
          student_name: sub.student_name || `Submission : ${sub.submission_id}`,
          student_id: sub.student_id || sub.submission_id
        }));
        setPendingSubmissions(submissionsWithDetails);
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

  // Handle Specific Submission Selection
  const handleSubmissionSelect = async (sub) => {
    if (!sub) return;
    setSelectedSub(sub);
    setManualDocumentMark("");
    setErrors({});
    setTouched({});
    
    try {
      const [sRes, dRes] = await Promise.all([
        fetch(`/api/marks/ai-scores/${sub.submission_id}`),
        fetch(`/api/marks/diagram-pages/${sub.submission_id}`)
      ]);
      
      const aiData = await sRes.json();
      const diagData = await dRes.json();

      setAiScores(aiData.success ? aiData.dataset : null);
      setDiagramPages(Array.isArray(diagData) ? diagData : []);
    } catch (err) {
      console.error("Error loading submission details:", err);
    }
  };

  const handlePublish = async () => {
    // Mark all fields as touched
    const allTouched = {
      assessment: true,
      submission: true,
      ...(hasDiagrams && { manualMark: true })
    };
    setTouched(allTouched);
    
    // Final validation
    const isValid = validateForm();
    if (!isValid) return;
    
    setIsPublishing(true);
    try {
      const res = await fetch("/api/marks/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: selectedSub.submission_id,
          final_mark: finalMark,
          enable_concern_window: enableConcernWindow,
          has_diagrams: hasDiagrams,
          manual_mark: hasDiagrams ? manualDocumentMark : null,
          ai_score: !hasDiagrams ? aiTotal : null
        })
      });
      
      const responseData = await res.json();
      
      if (res.ok) {
        // Store the published data for popup
        setPublishedMark(finalMark);
        setPublishedSubmissionId(selectedSub.submission_id);
        setPublishedStudentName(selectedSub.student_name || `Student ${selectedSub.student_id}`);
        setShowSuccessPopup(true);
        
        // Refresh the pending submissions list
        await handleAssessmentChange({ target: { value: selectedAssessmentId } });
        
        // Reset selected submission after successful publish
        setSelectedSub(null);
      } else {
        alert(`Error: ${responseData.message || "Failed to publish mark"}`);
      }
    } catch (err) {
      alert("Failed to connect to server. Please check your network connection.");
      console.error("Publish error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper function to get error message for a field
  const getErrorMessage = (fieldName) => {
    return touched[fieldName] && errors[fieldName] ? errors[fieldName] : null;
  };

  // Helper to check if a field is valid
  const isFieldValid = (fieldName) => {
    return touched[fieldName] && !errors[fieldName];
  };

  // Check if mark input is valid
  const isManualMarkValid = () => {
    if (!touched.manualMark) return false;
    if (!manualDocumentMark || manualDocumentMark === "") return false;
    const error = validateField('manualMark', manualDocumentMark);
    return !error;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f6fa", fontFamily: "'Inter', sans-serif" }}>
      
      <LecturerNavbar activePage="Publish Marks" />

      {/* Success Popup */}
      <SuccessPopup 
        isVisible={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false);
          // Optional: reset form after popup closes
          // window.location.reload();
        }}
        mark={publishedMark}
        submissionId={publishedSubmissionId}
        studentName={publishedStudentName}
      />

      <main style={{ padding: "34px 44px" }}>
        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 23, fontWeight: "bold", color: "#18243d" }}>Publish Marks Configuration</h2>
          <p style={{ fontSize: 13, color: "#74839a" }}>Manage visibility and automated marking for assessments.</p>
        </section>

        <div style={mainCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>✔</div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#24324a" }}>Mark Publication Settings</h3>
              <p style={{ fontSize: 12, color: "#74839a" }}>Select subject data and verify marking accuracy.</p>
            </div>
          </div>

          <div style={{ padding: "24px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
              <div>
                <label style={imageLabelStyle}>Subject / Assessment *</label>
                <select 
                  style={{
                    ...imageSelectStyle,
                    borderColor: getErrorMessage("assessment") ? "#ff4d4f" : 
                                 (selectedAssessmentId ? "#52c41a" : "#dde3eb")
                  }} 
                  value={selectedAssessmentId} 
                  onChange={handleAssessmentChange}
                  onBlur={() => handleBlur("assessment")}
                >
                  <option value="">Choose an Assessment</option>
                  {Array.isArray(assessments) && assessments.map(a => (
                    <option key={a.assessment_id} value={a.assessment_id}>
                      {a.assessment_title} (Max: {a.total_marks})
                    </option>
                  ))}
                </select>
                {getErrorMessage("assessment") && (
                  <p style={errorTextStyle}>{getErrorMessage("assessment")}</p>
                )}
                {selectedAssessmentId && !getErrorMessage("assessment") && (
                  <p style={successTextStyle}>✓ Valid assessment selected</p>
                )}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <label style={imageLabelStyle}>Pending Submissions *</label>
                  {selectedSub && (
                    <a 
                      href={`${API_BASE_URL}/api/marks/pdf/${selectedSub.submission_id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ fontSize: 11, fontWeight: "bold", color: "#3c74ff", textDecoration: "none", marginBottom: 8, display: "flex", alignItems: "center" }}
                    >
                      <i className="fas fa-file-pdf" style={{ marginRight: 6 }}></i>
                      Open Submission File
                    </a>
                  )}
                </div>
                <select 
                  style={{
                    ...imageSelectStyle,
                    borderColor: getErrorMessage("submission") ? "#ff4d4f" : 
                                 (selectedSub ? "#52c41a" : "#dde3eb")
                  }}
                  value={selectedSub?.submission_id || ""}
                  onChange={(e) => {
                    const selected = pendingSubmissions.find(s => s.submission_id === e.target.value);
                    if (selected) handleSubmissionSelect(selected);
                  }}
                  onBlur={() => handleBlur("submission")}
                  disabled={isLoadingSubmissions || pendingSubmissions.length === 0}
                >
                  <option value="">{isLoadingSubmissions ? "Loading..." : "Choose a Submission"}</option>
                  {Array.isArray(pendingSubmissions) && pendingSubmissions.map(s => (
                    <option key={s.submission_id} value={s.submission_id}>
                      {s.student_name || s.submission_id}
                    </option>
                  ))}
                </select>
                {getErrorMessage("submission") && (
                  <p style={errorTextStyle}>{getErrorMessage("submission")}</p>
                )}
                {selectedSub && !getErrorMessage("submission") && (
                  <p style={successTextStyle}>✓ Valid submission selected</p>
                )}
                {pendingSubmissions.length === 0 && selectedAssessmentId && !isLoadingSubmissions && (
                  <p style={{ color: "#ff9800", fontSize: 11, marginTop: 6 }}>
                    ⚠️ No pending submissions found for this assessment
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Marking Section */}
            {selectedSub && (
              <div style={{ ...markingDetailContainer, borderColor: errors.mark || errors.manualMark ? "#ff4d4f" : "#edf1f5" }}>
                
                {!hasDiagrams ? (
                  // No Diagrams: Show AI Logic Score
                  <>
                    <div style={{ borderRight: "1px solid #edf1f5", paddingRight: 24 }}>
                      <p style={subHeadingStyle}>AI Logic Score</p>
                      <h4 style={{ marginTop: 8, fontSize: 24, fontWeight: "bold", color: "#18243d" }}>
                        {aiScores?.final_mark !== undefined ? aiTotal : "N/A"}
                      </h4>
                      <p style={{ fontSize: 11, color: "#74839a", marginTop: 4 }}>
                        Auto-generated by AI model
                      </p>
                      {getErrorMessage("aiScore") && (
                        <p style={{ color: "#ff4d4f", fontSize: 11, marginTop: 8 }}>
                          {getErrorMessage("aiScore")}
                        </p>
                      )}
                    </div>

                    <div style={{ paddingLeft: 24 }}>
                      <p style={subHeadingStyle}>Document Analysis</p>
                      <div style={{ 
                        backgroundColor: "#fff", 
                        padding: "12px", 
                        borderRadius: 8, 
                        border: "1px solid #dde3eb", 
                        marginTop: 10 
                      }}>
                        <p style={{ fontSize: 12, color: "#2e3b52", margin: 0 }}>
                          ✓ No diagrams detected in this submission
                        </p>
                        <p style={{ fontSize: 11, color: "#74839a", marginTop: 4 }}>
                          Using AI model assessment for final mark
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  // Has Diagrams: Show Manual Entry Prompt
                  <>
                    <div style={{ borderRight: "1px solid #edf1f5", paddingRight: 24, gridColumn: "span 2" }}>
                      <p style={{ ...subHeadingStyle, color: "#ff6b35" }}>⚠️ Diagrams Detected</p>
                      <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#2e3b52", marginBottom: 8 }}>
                            Detected Diagrams/Images ({diagramPages.length}):
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {diagramPages.map(p => (
                              <span key={p.ocr_id} style={{ 
                                backgroundColor: "#fff", 
                                padding: "4px 10px", 
                                borderRadius: 6, 
                                border: "1px solid #dde3eb",
                                fontSize: 12,
                                color: "#3c74ff"
                              }}>
                                Page {p.page_no}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div style={{ 
                          backgroundColor: "#fff9f0", 
                          padding: "16px", 
                          borderRadius: 10, 
                          border: `1px solid ${getErrorMessage("manualMark") ? "#ff4d4f" : 
                                   (isManualMarkValid() ? "#52c41a" : "#ffe0b5")}`,
                          marginTop: 12
                        }}>
                          <label style={{ fontSize: 13, fontWeight: 600, color: "#2e3b52", display: "block", marginBottom: 8 }}>
                            Enter Document Mark * (Manual Review Required)
                          </label>
                          <input 
                            type="number" 
                            step="0.01"
                            style={{
                              width: "200px",
                              padding: "10px 14px",
                              borderRadius: 10,
                              border: `1px solid ${getErrorMessage("manualMark") ? "#ff4d4f" : 
                                       (isManualMarkValid() ? "#52c41a" : "#dde3eb")}`,
                              fontSize: 14,
                              fontWeight: "bold",
                              color: "#2e3b52",
                              outline: "none",
                              transition: "border-color 0.2s"
                            }}
                            value={manualDocumentMark}
                            onChange={handleManualMarkChange}
                            onBlur={() => handleBlur("manualMark")}
                            placeholder="Enter mark (0-100)"
                          />
                          {getErrorMessage("manualMark") && (
                            <p style={{ color: "#ff4d4f", fontSize: 11, fontWeight: "bold", marginTop: 6 }}>
                              {getErrorMessage("manualMark")}
                            </p>
                          )}
                          {isManualMarkValid() && (
                            <p style={{ color: "#52c41a", fontSize: 11, marginTop: 6 }}>
                              ✓ Valid mark entered
                            </p>
                          )}
                          <p style={{ fontSize: 11, color: "#74839a", marginTop: 8 }}>
                            ℹ️ Diagrams detected in this submission. Please review the document and enter the appropriate mark manually.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div style={finalScoreSection}>
                  <p style={{ ...subHeadingStyle, color: errors.mark || errors.manualMark ? "#ff4d4f" : "#3d6df2" }}>
                    Final Result
                  </p>
                  <div style={{ 
                    fontSize: 32, 
                    fontWeight: "bold", 
                    color: errors.mark || errors.manualMark ? "#ff4d4f" : "#3d6df2",
                    transition: "color 0.2s"
                  }}>
                    {finalMark}
                  </div>
                  {hasDiagrams && manualDocumentMark && isManualMarkValid() && (
                    <p style={{ fontSize: 10, color: "#52c41a", marginTop: 4, textAlign: "right" }}>
                      ✓ Valid manual entry
                    </p>
                  )}
                  {!hasDiagrams && aiScores?.final_mark !== undefined && !errors.aiScore && (
                    <p style={{ fontSize: 10, color: "#52c41a", marginTop: 4, textAlign: "right" }}>
                      AI generated
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && Object.values(errors).some(e => e && touched[Object.keys(errors).find(key => errors[key] === e)]) && (
              <div style={errorSummaryStyle}>
                <p style={{ color: "#ff4d4f", fontSize: 12, fontWeight: "bold", margin: 0 }}>
                  ⚠️ Please fix the following errors:
                </p>
                <ul style={{ margin: "8px 0 0 20px", color: "#ff4d4f", fontSize: 11 }}>
                  {Object.entries(errors).map(([key, error]) => (
                    error && touched[key] && <li key={key}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: "24px 0", borderTop: "1px solid #edf1f5" }}>
              <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#2e3b52" }}>Concern Window</p>
                  <p style={{ fontSize: 12, color: "#74839a" }}>Allow formal inquiries.</p>
                </div>
                <Toggle value={enableConcernWindow} onChange={setEnableConcernWindow} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 12 }}>
              <button 
                onClick={() => {
                  setSelectedAssessmentId("");
                  setSelectedSub(null);
                  setManualDocumentMark("");
                  setErrors({});
                  setTouched({});
                }} 
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button 
                onClick={handlePublish} 
                disabled={isPublishing || Object.keys(errors).some(key => errors[key] && touched[key]) || !selectedSub} 
                style={{ 
                  ...saveBtnStyle, 
                  opacity: (isPublishing || Object.keys(errors).some(key => errors[key] && touched[key]) || !selectedSub) ? 0.7 : 1,
                  cursor: (isPublishing || Object.keys(errors).some(key => errors[key] && touched[key]) || !selectedSub) ? "not-allowed" : "pointer"
                }}
              >
                {isPublishing ? "Processing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// styles
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
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)",
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
  margin: "0 0 20px 0"
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
  padding: "8px 0",
  borderBottom: "1px solid #e9ecef"
};

const detailLabelStyle = {
  fontSize: "13px",
  color: "#74839a",
  fontWeight: "500"
};

const detailValueStyle = {
  fontSize: "13px",
  color: "#2e3b52",
  fontWeight: "600"
};

const markValueStyle = {
  fontSize: "18px",
  color: "#3d6df2",
  fontWeight: "bold"
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

const errorTextStyle = { color: "#ff4d4f", fontSize: 11, fontWeight: "bold", marginTop: 6 };
const successTextStyle = { color: "#52c41a", fontSize: 11, marginTop: 6 };
const errorSummaryStyle = {
  backgroundColor: "#fff2f0",
  border: "1px solid #ffccc7",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 20
};
const mainCardStyle = { backgroundColor: "#fff", border: "1px solid #d8dee8", borderRadius: 14, overflow: "hidden" };
const cardHeaderStyle = { height: 70, padding: "0 28px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #edf1f5" };
const iconBoxStyle = { width: 40, height: 40, backgroundColor: "#3c74ff", borderRadius: 10, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 };
const imageLabelStyle = { display: "block", fontSize: 11, fontWeight: "bold", color: "#9aa8bb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 };
const imageSelectStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #dde3eb", fontSize: 13, color: "#2e3b52", outline: "none", transition: "border-color 0.2s" };
const markingDetailContainer = { display: "grid", gridTemplateColumns: "1fr 2fr 1fr", backgroundColor: "#f9fafb", padding: "20px 24px", borderRadius: 12, marginBottom: 24, border: "1px solid #edf1f5" };
const subHeadingStyle = { fontSize: 11, fontWeight: "bold", color: "#9aa8bb", textTransform: "uppercase", letterSpacing: "0.06em" };
const finalScoreSection = { display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" };
const saveBtnStyle = { backgroundColor: "#3d6df2", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, fontWeight: "bold", fontSize: 12, cursor: "pointer", transition: "opacity 0.2s" };
const cancelBtnStyle = { 
  background: "none", 
  border: "none", 
  color: "#74839a", 
  fontWeight: 600, 
  fontSize: 12, 
  cursor: "pointer",
  padding: "10px 16px",
  borderRadius: 8,
  transition: "background 0.2s"
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
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
  `;
  document.head.appendChild(style);
}