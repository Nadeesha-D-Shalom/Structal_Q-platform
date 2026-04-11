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
            Are you sure you want to delete this concern from <strong>{concern?.student}</strong>?
          </p>
          <p style={deleteSubMessageStyle}>
            Concern ID: <strong>{concern?.id}</strong><br/>
            Assignment: <strong>{concern?.assignment}</strong><br/>
            Priority: <strong style={{ color: getPriorityColor(concern?.priority) }}>{concern?.priority}</strong><br/>
            Status: <strong>{concern?.status}</strong>
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

// Respond Modal with Status Selector
const RespondModal = ({ isOpen, onClose, concern, onSend }) => {
  const [comment, setComment] = useState("");
  const [revisedMark, setRevisedMark] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (concern) {
      setComment("");
      setRevisedMark("");
      setSelectedStatus(concern.status || "Pending");
      setErrors({});
    }
  }, [concern]);

  const statusOptions = [
    { value: "Pending", label: "Pending", color: "#f59e0b", bgColor: "#fef3c7" },
    { value: "Accepted", label: "Accepted", color: "#10b981", bgColor: "#d1fae5" },
    { value: "Rejected", label: "Rejected", color: "#dc2626", bgColor: "#fee2e2" },
    { value: "Revised", label: "Revised", color: "#3b82f6", bgColor: "#dbeafe" }
  ];

  const validate = () => {
    const newErrors = {};
    if (!comment.trim()) {
      newErrors.comment = "Please enter a response comment";
    } else if (comment.trim().length < 10) {
      newErrors.comment = "Please provide a detailed response (minimum 10 characters)";
    }
    
    if (revisedMark && revisedMark !== "") {
      const markNum = parseFloat(revisedMark);
      if (isNaN(markNum)) {
        newErrors.revisedMark = "Please enter a valid number";
      } else if (markNum < 0) {
        newErrors.revisedMark = "Mark cannot be negative";
      } else if (markNum > 100) {
        newErrors.revisedMark = "Mark cannot exceed 100";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = () => {
    if (validate()) {
      onSend({
        concern_id: concern.id,
        student_email: concern.student_email,
        student_name: concern.student,
        comment: comment.trim(),
        revised_mark: revisedMark ? parseFloat(revisedMark) : null,
        assignment: concern.assignment,
        original_mark: concern.originalMark,
        priority: concern.priority,
        status: selectedStatus
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
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

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>Respond to Concern</h3>
          <button onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>
        
        <div style={modalBodyStyle}>
          <div style={infoBoxStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Student:</span>
              <span style={infoValueStyle}>{concern?.student}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Assignment:</span>
              <span style={infoValueStyle}>{concern?.assignment}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Priority:</span>
              <span style={{ ...infoValueStyle, color: getPriorityColor(concern?.priority), fontWeight: "bold" }}>
                {concern?.priority}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Original Mark:</span>
              <span style={currentMarkStyle}>{concern?.originalMark}/100</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Current Status:</span>
              <span style={getStatusStyle(concern?.status)}>{concern?.status}</span>
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
              onChange={(e) => setComment(e.target.value)}
              style={{
                ...modalTextareaStyle,
                borderColor: errors.comment ? "#ff4d4f" : "#dde3eb"
              }}
              rows="5"
              placeholder="Provide your detailed response to the student's concern..."
            />
            {errors.comment && <p style={errorTextStyle}>{errors.comment}</p>}
          </div>
          
          <div style={formGroupStyle}>
            <label style={modalLabelStyle}>Revised Mark (Optional)</label>
            <input
              type="number"
              step="0.01"
              value={revisedMark}
              onChange={(e) => setRevisedMark(e.target.value)}
              style={{
                ...modalInputStyle,
                borderColor: errors.revisedMark ? "#ff4d4f" : "#dde3eb"
              }}
              placeholder="Enter revised mark if applicable"
            />
            {errors.revisedMark && <p style={errorTextStyle}>{errors.revisedMark}</p>}
            <p style={hintTextStyle}>Leave blank if no change to the original mark</p>
          </div>
        </div>
        
        <div style={modalFooterStyle}>
          <button onClick={onClose} style={modalCancelBtnStyle}>Cancel</button>
          <button onClick={handleSend} style={modalSaveBtnStyle}>Send Response</button>
        </div>
      </div>
    </div>
  );
};

// Email Modal
const EmailModal = ({ isOpen, onClose, concern, onSend }) => {
  const [emailContent, setEmailContent] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (concern && isOpen) {
      const template = `Dear ${concern?.student},

Regarding your ${concern?.priority} priority concern for ${concern?.assignment} (Concern ID: ${concern?.id})

We have reviewed your concern about the mark you received (${concern?.originalMark}/100).

[Insert your response here]

Best regards,
Dr. Robert Fox
Lecturer, ${concern?.subject || "Department"}`;
      setEmailContent(template);
      setErrors({});
    }
  }, [concern, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!emailContent.trim()) {
      newErrors.emailContent = "Please enter email content";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = () => {
    if (validate()) {
      onSend({
        concern_id: concern.id,
        student_email: concern.student_email,
        student_name: concern.student,
        email_content: emailContent,
        subject: `Response to ${concern.priority} Priority Concern: ${concern.assignment}`
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>Send Email to Student</h3>
          <button onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>
        
        <div style={modalBodyStyle}>
          <div style={infoBoxStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>To:</span>
              <span style={infoValueStyle}>{concern?.student} ({concern?.student_email})</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Subject:</span>
              <span style={infoValueStyle}>Response to {concern?.priority} Priority Concern: {concern?.assignment}</span>
            </div>
          </div>
          
          <div style={formGroupStyle}>
            <label style={modalLabelStyle}>Email Content *</label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              style={{
                ...modalTextareaStyle,
                borderColor: errors.emailContent ? "#ff4d4f" : "#dde3eb",
                minHeight: "250px"
              }}
              rows="10"
              placeholder="Write your email response..."
            />
            {errors.emailContent && <p style={errorTextStyle}>{errors.emailContent}</p>}
          </div>
        </div>
        
        <div style={modalFooterStyle}>
          <button onClick={onClose} style={modalCancelBtnStyle}>Cancel</button>
          <button onClick={handleSend} style={modalSaveBtnStyle}>Send Email</button>
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
            style={{
              width: "100%",
              height: "600px",
              border: "none",
              borderRadius: "8px"
            }}
          />
        </div>
        
        <div style={modalFooterStyle}>
          <a
            href={submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={openNewTabBtnStyle}
          >
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDetails, setPopupDetails] = useState({});
  const [submissionUrl, setSubmissionUrl] = useState("");

  // Sample concerns data with expanded details
  const [concerns, setConcerns] = useState([
    {
      id: "CN-001",
      student: "John Perera",
      student_email: "john.perera@example.com",
      student_id: "STU-2024001",
      assignment: "Software Architecture Project",
      subject: "Software Engineering",
      subject_code: "SE-301",
      originalMark: 72,
      status: "Pending",
      priority: "High",
      date: "Mar 12, 2026",
      message: "I believe my project was undervalued in the documentation section. I have provided additional evidence regarding the architectural diagrams which were not fully captured in the initial review.",
      submission_pdf: `${API_BASE_URL}/api/marks/pdf/SUB-001`
    },
    {
      id: "CN-002",
      student: "Sarah Johnson",
      student_email: "sarah.johnson@example.com",
      student_id: "STU-2024002",
      assignment: "Database Design Assignment",
      subject: "Database Systems",
      subject_code: "DB-201",
      originalMark: 68,
      status: "Pending",
      priority: "Medium",
      date: "Mar 13, 2026",
      message: "I believe my ER diagram was incorrectly marked. The relationships I modeled were correct according to the requirements.",
      submission_pdf: `${API_BASE_URL}/api/marks/pdf/SUB-002`
    },
    {
      id: "CN-003",
      student: "Michael Chen",
      student_email: "michael.chen@example.com",
      student_id: "STU-2024003",
      assignment: "Network Security Report",
      subject: "Computer Networks",
      subject_code: "CN-401",
      originalMark: 85,
      status: "Accepted",
      priority: "Low",
      date: "Mar 14, 2026",
      message: "Requesting clarification on the security analysis section. I think my analysis was comprehensive.",
      submission_pdf: `${API_BASE_URL}/api/marks/pdf/SUB-003`
    },
    {
      id: "CN-004",
      student: "Emily Watson",
      student_email: "emily.watson@example.com",
      student_id: "STU-2024004",
      assignment: "AI Final Project",
      subject: "Artificial Intelligence",
      subject_code: "AI-501",
      originalMark: 45,
      status: "Rejected",
      priority: "High",
      date: "Oct 18, 2023",
      message: "The evaluation seems unfair considering the complexity of my implementation. I spent over 50 hours on this project.",
      submission_pdf: `${API_BASE_URL}/api/marks/pdf/SUB-004`
    },
    {
      id: "CN-005",
      student: "David Kim",
      student_email: "david.kim@example.com",
      student_id: "STU-2024005",
      assignment: "Cloud Computing Report",
      subject: "Cloud Computing",
      subject_code: "CC-601",
      originalMark: 78,
      status: "Revised",
      priority: "Medium",
      date: "Mar 16, 2026",
      message: "Requesting review of the architecture diagram section. I believe I properly documented all components.",
      submission_pdf: `${API_BASE_URL}/api/marks/pdf/SUB-005`
    },
    {
      id: "CN-006",
      student: "Lisa Wang",
      student_email: "lisa.wang@example.com",
      student_id: "STU-2024006",
      assignment: "Mobile App Development",
      subject: "Mobile Computing",
      subject_code: "MC-301",
      originalMark: 92,
      status: "Accepted",
      priority: "Low",
      date: "Oct 5, 2023",
      message: "Minor clarification on the UI/UX evaluation criteria.",
      submission_pdf: `${API_BASE_URL}/api/marks/pdf/SUB-006`
    },
    {
      id: "CN-007",
      student: "James Wilson",
      student_email: "james.wilson@example.com",
      student_id: "STU-2024007",
      assignment: "Operating Systems Project",
      subject: "Operating Systems",
      subject_code: "OS-401",
      originalMark: 55,
      status: "Pending",
      priority: "High",
      date: "Oct 22, 2023",
      message: "The process synchronization implementation was marked incorrectly. My solution handles all edge cases.",
      submission_pdf: `${API_BASE_URL}/api/marks/pdf/SUB-007`
    },
    {
      id: "CN-008",
      student: "Maria Garcia",
      student_email: "maria.garcia@example.com",
      student_id: "STU-2024008",
      assignment: "Web Development Final",
      subject: "Web Technologies",
      subject_code: "WEB-201",
      originalMark: 88,
      status: "Revised",
      priority: "Medium",
      date: "Oct 19, 2023",
      message: "Requesting review of the responsive design section. My implementation meets all requirements.",
      submission_pdf: `${API_BASE_URL}/api/marks/pdf/SUB-008`
    }
  ]);

  const statuses = ["All", "Pending", "Accepted", "Rejected", "Revised"];
  const priorities = ["All", "High", "Medium", "Low"];
  const sortOptions = [
    { value: "date", label: "Date (Newest First)" },
    { value: "date-old", label: "Date (Oldest First)" },
    { value: "priority-high", label: "Priority (High to Low)" },
    { value: "priority-low", label: "Priority (Low to High)" },
    { value: "status", label: "Status" }
  ];

  // Filter and sort concerns
  const filteredConcerns = concerns
    .filter(concern => {
      const matchesSearch = 
        concern.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.assignment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.student_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || concern.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || concern.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === "date-old") {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === "priority-high") {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortBy === "priority-low") {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === "status") {
        const statusOrder = { Pending: 1, Revised: 2, Accepted: 3, Rejected: 4 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return 0;
    });

  const handleDeleteConcern = async () => {
    if (!selectedConcern) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setConcerns(concerns.filter(c => c.id !== selectedConcern.id));
      setPopupTitle("✓ Concern Deleted");
      setPopupMessage(`Concern #${selectedConcern.id} from ${selectedConcern.student} has been deleted.`);
      setPopupDetails({
        "Student": selectedConcern.student,
        "Assignment": selectedConcern.assignment,
        "Priority": selectedConcern.priority,
        "Status": selectedConcern.status,
        "Concern ID": selectedConcern.id
      });
      setShowSuccessPopup(true);
      setShowDeleteModal(false);
      setSelectedConcern(null);
    } catch (err) {
      console.error("Error deleting concern:", err);
      alert("Failed to delete concern");
    }
  };

  const handleSendResponse = async (responseData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setConcerns(concerns.map(c => 
        c.id === responseData.concern_id 
          ? { ...c, status: responseData.status, response: responseData.comment, revisedMark: responseData.revised_mark }
          : c
      ));
      setPopupTitle("✓ Response Sent");
      setPopupMessage(`Response has been sent to ${responseData.student_name}.`);
      setPopupDetails({
        "Student": responseData.student_name,
        "Assignment": responseData.assignment,
        "Priority": responseData.priority,
        "Status": responseData.status,
        "Comment": responseData.comment.substring(0, 100) + "...",
        ...(responseData.revised_mark && { "Revised Mark": `${responseData.revised_mark}/100` })
      });
      setShowSuccessPopup(true);
      setShowRespondModal(false);
      setSelectedConcern(null);
    } catch (err) {
      console.error("Error sending response:", err);
      alert("Failed to send response");
    }
  };

  const handleSendEmail = async (emailData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setPopupTitle("✉️ Email Sent");
      setPopupMessage(`Email has been sent to ${emailData.student_name}.`);
      setPopupDetails({
        "To": `${emailData.student_name} (${emailData.student_email})`,
        "Subject": emailData.subject,
        "Status": "Delivered"
      });
      setShowSuccessPopup(true);
      setShowEmailModal(false);
      setSelectedConcern(null);
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send email");
    }
  };

  const handleViewSubmission = (url) => {
    setSubmissionUrl(url);
    setShowViewModal(true);
  };

  // Priority color functions
  const getPriorityColor = (priority) => {
    switch(priority) {
      case "High": return "#dc2626";
      case "Medium": return "#f59e0b";
      case "Low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getPriorityBgColor = (priority) => {
    switch(priority) {
      case "High": return "#fee2e2";
      case "Medium": return "#fef3c7";
      case "Low": return "#d1fae5";
      default: return "#f3f4f6";
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case "Pending": return { backgroundColor: "#fef3c7", color: "#d97706" };
      case "Accepted": return { backgroundColor: "#d1fae5", color: "#059669" };
      case "Rejected": return { backgroundColor: "#fee2e2", color: "#dc2626" };
      case "Revised": return { backgroundColor: "#dbeafe", color: "#3b82f6" };
      default: return { backgroundColor: "#f3f4f6", color: "#6b7280" };
    }
  };

  return (
    <div style={pageContainerStyle}>
      <LecturerNavbar />

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
                    <button onClick={() => setSearchQuery("")} style={clearSearchBtnStyle}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
              
              <div style={filterWrapperStyle}>
                <label style={filterLabelStyle}>Filter by Status</label>
                <div style={filterSelectWrapperStyle}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={filterSelectStyle}
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <span style={filterArrowStyle}>▼</span>
                </div>
              </div>

              <div style={filterWrapperStyle}>
                <label style={filterLabelStyle}>Filter by Priority</label>
                <div style={filterSelectWrapperStyle}>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={filterSelectStyle}
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <span style={filterArrowStyle}>▼</span>
                </div>
              </div>

              <div style={filterWrapperStyle}>
                <label style={filterLabelStyle}>Sort by</label>
                <div style={filterSelectWrapperStyle}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={filterSelectStyle}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
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
                Showing <strong>{filteredConcerns.length}</strong> of <strong>{concerns.length}</strong> concerns
              </div>
              <div style={activeFiltersStyle}>
                {statusFilter !== "All" && (
                  <div style={activeFilterStyle}>
                    <span>Status: </span>
                    <strong>{statusFilter}</strong>
                    <button onClick={() => setStatusFilter("All")} style={clearFilterBtnStyle}>
                      ✕
                    </button>
                  </div>
                )}
                {priorityFilter !== "All" && (
                  <div style={activeFilterStyle}>
                    <span>Priority: </span>
                    <strong>{priorityFilter}</strong>
                    <button onClick={() => setPriorityFilter("All")} style={clearFilterBtnStyle}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Ultra Expanded Table */}
            <div style={tableContainerStyle}>
              <div style={ultraExpandedTableHeaderStyle}>
                <div style={ultraExpandedHeaderCellStyle}>ID</div>
                <div style={ultraExpandedHeaderCellStyle}>Student Details</div>
                <div style={ultraExpandedHeaderCellStyle}>Assignment Details</div>
                <div style={ultraExpandedHeaderCellStyle}>Priority</div>
                <div style={ultraExpandedHeaderCellStyle}>Mark</div>
                <div style={ultraExpandedHeaderCellStyle}>Date</div>
                <div style={ultraExpandedHeaderCellStyle}>Status</div>
                <div style={ultraExpandedHeaderCellStyle}>Actions</div>
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
                  <div key={concern.id} style={ultraExpandedTableRowStyle(index === filteredConcerns.length - 1)}>
                    <div style={ultraExpandedCellStyle}>
                      <span style={concernIdStyle}>{concern.id}</span>
                    </div>
                    <div style={ultraExpandedCellStyle}>
                      <span style={studentNameStyle}>{concern.student}</span>
                      <span style={studentIdStyle}>{concern.student_id}</span>
                      <span style={studentEmailStyle}>{concern.student_email}</span>
                    </div>
                    <div style={ultraExpandedCellStyle}>
                      <div style={assignmentWithButtonStyle}>
                        <span style={assignmentNameStyle}>{concern.assignment}</span>
                        <button
                          onClick={() => handleViewSubmission(concern.submission_pdf)}
                          style={viewPdfBtnStyle}
                          title="View Submission"
                        >
                          📄 View
                        </button>
                      </div>
                      <span style={subjectNameStyle}>{concern.subject}</span>
                      <span style={subjectCodeStyle}>{concern.subject_code}</span>
                    </div>
                    <div style={ultraExpandedCellStyle}>
                      <span style={{
                        ...priorityBadgeStyle,
                        backgroundColor: getPriorityBgColor(concern.priority),
                        color: getPriorityColor(concern.priority)
                      }}>
                        {concern.priority}
                      </span>
                    </div>
                    <div style={ultraExpandedCellStyle}>
                      <span style={markStyle(concern.originalMark)}>{concern.originalMark}/100</span>
                      <span style={percentageStyle}>{((concern.originalMark / 100) * 100).toFixed(0)}%</span>
                    </div>
                    <div style={ultraExpandedCellStyle}>
                      <span style={dateStyle}>{concern.date}</span>
                    </div>
                    <div style={ultraExpandedCellStyle}>
                      <span style={{
                        ...statusBadgeStyle,
                        backgroundColor: getStatusStyle(concern.status).backgroundColor,
                        color: getStatusStyle(concern.status).color
                      }}>
                        {concern.status}
                      </span>
                    </div>
                    <div style={ultraExpandedCellStyle}>
                      <div style={actionButtonsStyle}>
                        <button
                          onClick={() => {
                            setSelectedConcern(concern);
                            setShowRespondModal(true);
                          }}
                          style={respondBtnStyle}
                          title="Respond to Concern"
                        >
                          💬 Respond
                        </button>
                        <button
                          onClick={() => {
                            setSelectedConcern(concern);
                            setShowEmailModal(true);
                          }}
                          style={emailBtnStyle}
                          title="Send Email"
                        >
                          ✉️ Email
                        </button>
                        <button
                          onClick={() => {
                            setSelectedConcern(concern);
                            setShowDeleteModal(true);
                          }}
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
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedConcern(null);
        }}
        concern={selectedConcern}
        onConfirm={handleDeleteConcern}
      />

      <RespondModal
        isOpen={showRespondModal}
        onClose={() => {
          setShowRespondModal(false);
          setSelectedConcern(null);
        }}
        concern={selectedConcern}
        onSend={handleSendResponse}
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedConcern(null);
        }}
        concern={selectedConcern}
        onSend={handleSendEmail}
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

// Ultra Expanded Styles
const pageContainerStyle = {
  minHeight: "100vh",
  backgroundColor: "#f5f6fa",
  fontFamily: "'Inter', sans-serif"
};

const mainContainerStyle = {
  padding: "34px 44px",
  maxWidth: "1800px",
  margin: "0 auto"
};

const headerSectionStyle = {
  marginBottom: "28px"
};

const pageTitleStyle = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#18243d",
  margin: 0
};

const pageSubtitleStyle = {
  fontSize: "15px",
  color: "#74839a",
  marginTop: "8px"
};

const mainCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
};

const cardHeaderStyle = {
  height: "90px",
  padding: "0 36px",
  display: "flex",
  alignItems: "center",
  gap: "18px",
  borderBottom: "1px solid #edf1f5",
  backgroundColor: "#fafbfc"
};

const iconBoxStyle = {
  width: "48px",
  height: "48px",
  backgroundColor: "#3c74ff",
  borderRadius: "14px",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px"
};

const cardTitleStyle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#18243d",
  margin: 0
};

const cardSubtitleStyle = {
  fontSize: "14px",
  color: "#64748b",
  margin: "4px 0 0 0"
};

const cardContentStyle = {
  padding: "32px 36px"
};

// Search and Filter Styles
const searchFilterContainer = {
  display: "flex",
  gap: "24px",
  marginBottom: "32px",
  flexWrap: "wrap",
  alignItems: "flex-end"
};

const searchWrapperStyle = {
  flex: "2.5",
  minWidth: "350px"
};

const searchInputWrapperStyle = {
  position: "relative",
  width: "100%"
};

const searchIconStyle = {
  position: "absolute",
  left: "16px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "18px",
  color: "#9aa8bb",
  pointerEvents: "none",
  zIndex: 1
};

const searchInputStyle = {
  width: "100%",
  padding: "14px 45px 14px 48px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontSize: "15px",
  color: "#1e293b",
  outline: "none",
  transition: "all 0.2s",
  backgroundColor: "#fff",
  boxSizing: "border-box",
  "&:focus": {
    borderColor: "#3c74ff",
    boxShadow: "0 0 0 3px rgba(60, 116, 255, 0.1)"
  }
};

const clearSearchBtnStyle = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#9aa8bb",
  fontSize: "16px",
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

const filterLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "700",
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
  padding: "14px 40px 14px 16px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  color: "#1e293b",
  outline: "none",
  backgroundColor: "#fff",
  cursor: "pointer",
  appearance: "none",
  boxSizing: "border-box",
  transition: "all 0.2s",
  "&:focus": {
    borderColor: "#3c74ff",
    boxShadow: "0 0 0 3px rgba(60, 116, 255, 0.1)"
  }
};

const filterArrowStyle = {
  position: "absolute",
  right: "16px",
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
  marginBottom: "24px",
  paddingBottom: "20px",
  borderBottom: "1px solid #edf1f5",
  flexWrap: "wrap",
  gap: "12px"
};

const resultsCountStyle = {
  fontSize: "14px",
  color: "#5c6b80",
  fontWeight: "500"
};

const activeFiltersStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap"
};

const activeFilterStyle = {
  fontSize: "13px",
  color: "#3c74ff",
  backgroundColor: "#eef2ff",
  padding: "6px 14px",
  borderRadius: "24px",
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  fontWeight: "500"
};

const clearFilterBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#3c74ff",
  fontSize: "13px",
  padding: "2px",
  marginLeft: "4px",
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "50%",
  transition: "all 0.2s"
};

// Ultra Expanded Table Styles
const tableContainerStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  overflow: "auto",
  maxHeight: "calc(100vh - 520px)",
  minHeight: "450px"
};

const ultraExpandedTableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "0.6fr 1.3fr 1.8fr 0.7fr 0.8fr 0.9fr 0.9fr 1.2fr",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
  padding: "18px 28px",
  gap: "12px"
};

const ultraExpandedHeaderCellStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const ultraExpandedTableRowStyle = (isLast) => ({
  display: "grid",
  gridTemplateColumns: "0.6fr 1.3fr 1.8fr 0.7fr 0.8fr 0.9fr 0.9fr 1.2fr",
  padding: "18px 28px",
  borderBottom: isLast ? "none" : "1px solid #eef2f6",
  transition: "background 0.2s",
  alignItems: "center",
  gap: "12px",
  backgroundColor: "#fff",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#fafbff"
  }
});

const ultraExpandedCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

// Cell Content Styles
const concernIdStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#3c74ff",
  fontFamily: "monospace"
};

const studentNameStyle = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a"
};

const studentIdStyle = {
  fontSize: "12px",
  color: "#64748b",
  fontFamily: "monospace"
};

const studentEmailStyle = {
  fontSize: "12px",
  color: "#9aa8bb",
  marginTop: "2px"
};

const assignmentWithButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap"
};

const assignmentNameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e293b"
};

const subjectNameStyle = {
  fontSize: "13px",
  color: "#475569",
  fontWeight: "500"
};

const subjectCodeStyle = {
  fontSize: "11px",
  color: "#94a3b8"
};

const priorityBadgeStyle = {
  padding: "6px 14px",
  borderRadius: "24px",
  fontSize: "13px",
  fontWeight: "600",
  width: "fit-content"
};

const markStyle = (mark) => ({
  fontSize: "15px",
  fontWeight: "bold",
  color: mark >= 75 ? "#10b981" : mark >= 55 ? "#3b82f6" : "#ef4444"
});

const percentageStyle = {
  fontSize: "11px",
  color: "#94a3b8"
};

const dateStyle = {
  fontSize: "13px",
  color: "#64748b"
};

const statusBadgeStyle = {
  padding: "6px 14px",
  borderRadius: "24px",
  fontSize: "12px",
  fontWeight: "600",
  width: "fit-content"
};

const actionButtonsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap"
};

// Button Styles
const respondBtnStyle = {
  padding: "8px 16px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#3c74ff",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: "#3c74ff",
    color: "#fff",
    borderColor: "#3c74ff",
    transform: "translateY(-1px)"
  }
};

const emailBtnStyle = {
  padding: "8px 16px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#10b981",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: "#10b981",
    color: "#fff",
    borderColor: "#10b981",
    transform: "translateY(-1px)"
  }
};

const deleteActionBtnStyle = {
  padding: "8px 16px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#dc2626",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: "#dc2626",
    color: "#fff",
    borderColor: "#dc2626",
    transform: "translateY(-1px)"
  }
};

const viewPdfBtnStyle = {
  padding: "5px 12px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#f59e0b",
  fontSize: "11px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: "#f59e0b",
    color: "#fff",
    borderColor: "#f59e0b"
  }
};

// Status Selector Styles
const statusSelectorStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap"
};

const statusOptionStyle = {
  padding: "8px 20px",
  borderRadius: "30px",
  border: "2px solid",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
  background: "none",
  "&:hover": {
    transform: "translateY(-2px)"
  }
};

// View Modal Styles
const viewModalContainerStyle = {
  backgroundColor: "#fff",
  borderRadius: "20px",
  width: "90%",
  maxWidth: "1400px",
  maxHeight: "90vh",
  overflow: "hidden",
  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
  animation: "slideUp 0.3s ease-out",
  display: "flex",
  flexDirection: "column"
};

const viewModalBodyStyle = {
  padding: "0",
  flex: 1,
  overflow: "auto"
};

const openNewTabBtnStyle = {
  padding: "10px 24px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#3c74ff",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer",
  textDecoration: "none",
  transition: "all 0.2s"
};

// Empty State Styles
const emptyContainerStyle = {
  padding: "100px",
  textAlign: "center"
};

const emptyIconStyle = {
  fontSize: "72px",
  marginBottom: "24px"
};

const emptyTitleStyle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#2e3b52",
  marginBottom: "10px"
};

const emptyMessageStyle = {
  fontSize: "14px",
  color: "#74839a"
};

const hintTextStyle = {
  fontSize: "11px",
  color: "#9aa8bb",
  marginTop: "4px"
};

// Modal Styles (keep existing modal styles)
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
  borderRadius: "20px",
  width: "90%",
  maxWidth: "650px",
  maxHeight: "90vh",
  overflow: "auto",
  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
  animation: "slideUp 0.3s ease-out"
};

const deleteModalContainerStyle = {
  backgroundColor: "#fff",
  borderRadius: "20px",
  width: "90%",
  maxWidth: "550px",
  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
  animation: "slideUp 0.3s ease-out"
};

const modalHeaderStyle = {
  padding: "24px 28px",
  borderBottom: "1px solid #edf1f5",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const deleteModalHeaderStyle = {
  padding: "24px 28px",
  borderBottom: "1px solid #edf1f5",
  display: "flex",
  alignItems: "center",
  gap: "14px"
};

const modalTitleStyle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#18243d",
  margin: 0
};

const deleteModalTitleStyle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#18243d",
  margin: 0
};

const modalCloseBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "22px",
  cursor: "pointer",
  color: "#94a3b8",
  padding: "4px 8px",
  borderRadius: "6px"
};

const modalBodyStyle = {
  padding: "28px"
};

const infoBoxStyle = {
  backgroundColor: "#f8f9fc",
  padding: "18px 22px",
  borderRadius: "14px",
  marginBottom: "28px",
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
  marginBottom: "28px"
};

const modalLabelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#2e3b52",
  marginBottom: "10px"
};

const modalInputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
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
  padding: "12px 16px",
  borderRadius: "12px",
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

const modalFooterStyle = {
  padding: "20px 28px",
  borderTop: "1px solid #edf1f5",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px"
};

const modalCancelBtnStyle = {
  padding: "10px 24px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#5c6b80",
  fontWeight: "500",
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s"
};

const modalSaveBtnStyle = {
  padding: "10px 24px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#3c74ff",
  color: "#fff",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s"
};

const deleteConfirmBtnStyle = {
  padding: "10px 24px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#dc2626",
  color: "#fff",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s"
};

const warningIconStyle = {
  fontSize: "28px"
};

const deleteMessageStyle = {
  fontSize: "15px",
  color: "#2e3b52",
  marginBottom: "20px",
  lineHeight: "1.5"
};

const deleteSubMessageStyle = {
  fontSize: "13px",
  color: "#64748b",
  marginBottom: "20px",
  lineHeight: "1.6"
};

const deleteWarningStyle = {
  fontSize: "12px",
  color: "#dc2626",
  backgroundColor: "#fee2e2",
  padding: "12px",
  borderRadius: "10px",
  marginTop: "20px"
};

const errorTextStyle = {
  color: "#ff4d4f",
  fontSize: "11px",
  marginTop: "6px"
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
  maxWidth: "550px",
  width: "90%",
  margin: "20px"
};

const popupAnimationStyle = {
  backgroundColor: "#fff",
  borderRadius: "24px",
  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
  overflow: "hidden",
  animation: "slideUp 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)"
};

const successIconContainerStyle = {
  display: "flex",
  justifyContent: "center",
  marginTop: "35px",
  marginBottom: "25px"
};

const successIconStyle = {
  width: "90px",
  height: "90px",
  backgroundColor: "#52c41a",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 20px rgba(82, 196, 26, 0.3)",
  animation: "scaleIn 0.5s ease-out"
};

const popupTitleStyle = {
  fontSize: "26px",
  fontWeight: "bold",
  textAlign: "center",
  color: "#2e3b52",
  margin: "0 0 14px 0"
};

const popupMessageStyle = {
  fontSize: "15px",
  textAlign: "center",
  color: "#64748b",
  margin: "0 28px 20px 28px",
  lineHeight: "1.5"
};

const popupDetailsStyle = {
  backgroundColor: "#f8f9fa",
  margin: "0 28px 28px 28px",
  padding: "18px",
  borderRadius: "14px",
  border: "1px solid #e9ecef"
};

const detailRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
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
  padding: "0 28px 28px 28px",
  display: "flex",
  justifyContent: "center"
};

const popupButtonStyle = {
  backgroundColor: "#3d6df2",
  color: "#fff",
  border: "none",
  padding: "12px 36px",
  borderRadius: "12px",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s"
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
        transform: translateY(40px);
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
    
    button {
      transition: all 0.2s ease;
    }
    
    button:active {
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);
}