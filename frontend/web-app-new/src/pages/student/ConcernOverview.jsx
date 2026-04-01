import { useState, useEffect } from "react";
import StudentNavbar from "./StudentNavbar";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

// View Details Modal
const ViewDetailsModal = ({ isOpen, onClose, concern }) => {
  if (!isOpen) return null;

  const getStatusStyle = (status) => {
    switch(status) {
      case "Pending": return { color: "#f59e0b", bgColor: "#fef3c7", dot: "#f59e0b" };
      case "Resolved": return { color: "#10b981", bgColor: "#d1fae5", dot: "#10b981" };
      case "Accepted": return { color: "#10b981", bgColor: "#d1fae5", dot: "#10b981" };
      case "Rejected": return { color: "#dc2626", bgColor: "#fee2e2", dot: "#dc2626" };
      case "Revised": return { color: "#3b82f6", bgColor: "#dbeafe", dot: "#3b82f6" };
      default: return { color: "#6b7280", bgColor: "#f3f4f6", dot: "#6b7280" };
    }
  };

  const statusStyle = getStatusStyle(concern?.status);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>Concern Details</h3>
          <button onClick={onClose} style={modalCloseBtnStyle}>✕</button>
        </div>
        
        <div style={modalBodyStyle}>
          {/* Concern Info */}
          <div style={infoSectionStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Concern ID:</span>
              <span style={infoValueStyle}>{concern?.id}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Assignment:</span>
              <span style={infoValueStyle}>{concern?.assignment}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Subject:</span>
              <span style={infoValueStyle}>{concern?.subject}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Date Submitted:</span>
              <span style={infoValueStyle}>{concern?.date}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Status:</span>
              <span style={{ ...statusBadgeStyle, backgroundColor: statusStyle.bgColor, color: statusStyle.color }}>
                <span style={{ ...statusDotStyle, backgroundColor: statusStyle.dot }}></span>
                {concern?.status}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Original Mark:</span>
              <span style={markValueStyle}>{concern?.originalMark}/100</span>
            </div>
          </div>

          {/* Student Message */}
          <div style={messageSectionStyle}>
            <label style={sectionLabelStyle}>Your Concern Message</label>
            <div style={messageBoxStyle}>
              "{concern?.message}"
            </div>
          </div>

          {/* Lecturer Response (if any) */}
          {concern?.response && (
            <div style={responseSectionStyle}>
              <label style={sectionLabelStyle}>Lecturer's Response</label>
              <div style={responseBoxStyle}>
                <div style={responseHeaderStyle}>
                  <span style={lecturerNameStyle}>Dr. Robert Fox</span>
                  <span style={responseDateStyle}>{concern?.responseDate || "Oct 20, 2023"}</span>
                </div>
                <div style={responseMessageStyle}>
                  "{concern?.response}"
                </div>
                {concern?.revisedMark && (
                  <div style={revisedMarkStyle}>
                    <span style={revisedMarkLabel}>Revised Mark:</span>
                    <span style={revisedMarkValue}>{concern?.revisedMark}/100</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div style={modalFooterStyle}>
          <button onClick={onClose} style={modalCloseBtnStyle}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default function StudentConcernsOverview() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [concerns, setConcerns] = useState([]);
  const [filteredConcerns, setFilteredConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [subjects, setSubjects] = useState(["All"]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch session
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

  // Fetch student's concerns
  useEffect(() => {
    if (!session?.student_id) return;

    const fetchConcerns = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/concerns/student/${session.student_id}`, {
          credentials: "include"
        });
        const data = await res.json();
        
        if (data.success) {
          setConcerns(data.data);
          setFilteredConcerns(data.data);
          
          // Extract unique subjects for filter
          const uniqueSubjects = ["All", ...new Set(data.data.map(c => c.subject))];
          setSubjects(uniqueSubjects);
        }
      } catch (err) {
        console.error("Error fetching concerns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConcerns();
  }, [session?.student_id]);

  // Filter concerns based on subject and status
  useEffect(() => {
    let filtered = [...concerns];
    
    if (subjectFilter !== "All") {
      filtered = filtered.filter(c => c.subject === subjectFilter);
    }
    
    if (statusFilter !== "All") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    setFilteredConcerns(filtered);
  }, [subjectFilter, statusFilter, concerns]);

  const clearFilters = () => {
    setSubjectFilter("All");
    setStatusFilter("All");
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case "Pending": return { color: "#f59e0b", dot: "#f59e0b" };
      case "Resolved": return { color: "#10b981", dot: "#10b981" };
      case "Accepted": return { color: "#10b981", dot: "#10b981" };
      case "Rejected": return { color: "#dc2626", dot: "#dc2626" };
      case "Revised": return { color: "#3b82f6", dot: "#3b82f6" };
      default: return { color: "#6b7280", dot: "#6b7280" };
    }
  };

  const handleViewDetails = (concern) => {
    setSelectedConcern(concern);
    setShowDetailsModal(true);
  };

  const initials = session?.student_name
    ?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "S";

  if (sessionLoading) {
    return (
      <div style={pageContainerStyle}>
        <StudentNavbar activePage="Concerns" />
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle} />
          <p style={loadingTextStyle}>Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      <StudentNavbar activePage="Concerns" />

      <main style={mainContainerStyle}>
        {/* Header Section */}
        <section style={headerSectionStyle}>
          <h2 style={pageTitleStyle}>Student Concerns Overview</h2>
          <p style={pageSubtitleStyle}>Monitor and track your grading disputes or assignment queries.</p>
        </section>

        {/* Filters Card */}
        <div style={filtersCardStyle}>
          <div style={filtersContainerStyle}>
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Subject</label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                style={filterSelectStyle}
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Revised">Revised</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <button onClick={clearFilters} style={clearFiltersBtnStyle}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Concerns Table */}
        <div style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div style={headerCellStyle}>STUDENT</div>
            <div style={headerCellStyle}>ASSIGNMENT</div>
            <div style={headerCellStyle}>DATE SUBMITTED</div>
            <div style={headerCellStyle}>STATUS</div>
            <div style={headerCellStyle}>ACTION</div>
          </div>

          {loading ? (
            <div style={loadingContainerStyle}>
              <div style={spinnerStyle} />
              <p style={loadingTextStyle}>Loading your concerns...</p>
            </div>
          ) : filteredConcerns.length === 0 ? (
            <div style={emptyContainerStyle}>
              <div style={emptyIconStyle}>📭</div>
              <p style={emptyTitleStyle}>No concerns found</p>
              <p style={emptyMessageStyle}>
                {subjectFilter !== "All" || statusFilter !== "All"
                  ? "Try adjusting your filters."
                  : "You haven't raised any concerns yet."}
              </p>
            </div>
          ) : (
            filteredConcerns.map((concern, index) => {
              const statusStyle = getStatusStyle(concern.status);
              const avatarColor = getAvatarColor(concern.student_name || session?.student_name);
              const initials = getInitials(concern.student_name || session?.student_name);
              
              return (
                <div key={concern.id} style={tableRowStyle(index === filteredConcerns.length - 1)}>
                  <div style={studentCellStyle}>
                    <div style={avatarStyle(avatarColor)}>{initials}</div>
                    <div>
                      <div style={studentNameStyle}>{concern.student_name || session?.student_name}</div>
                      <div style={studentIdStyle}>ID: {concern.student_id || session?.student_id}</div>
                    </div>
                  </div>
                  <div style={assignmentCellStyle}>
                    <div style={assignmentNameStyle}>{concern.assignment}</div>
                    <div style={subjectNameStyle}>{concern.subject}</div>
                  </div>
                  <div style={dateCellStyle}>
                    <span style={dateStyle}>{concern.date}</span>
                  </div>
                  <div style={statusCellStyle}>
                    <span style={{ ...statusBadgeStyle, color: statusStyle.color }}>
                      <span style={{ ...statusDotStyle, backgroundColor: statusStyle.dot }}></span>
                      {concern.status}
                    </span>
                  </div>
                  <div style={actionCellStyle}>
                    <button
                      onClick={() => handleViewDetails(concern)}
                      style={viewDetailsBtnStyle}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Results Count */}
          {!loading && filteredConcerns.length > 0 && (
            <div style={resultsCountStyle}>
              Showing {filteredConcerns.length} of {concerns.length} concerns
            </div>
          )}
        </div>
      </main>

      {/* View Details Modal */}
      <ViewDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedConcern(null);
        }}
        concern={selectedConcern}
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
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "40px 24px"
};

const headerSectionStyle = {
  marginBottom: "32px"
};

const pageTitleStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#18243d",
  margin: "0 0 8px 0"
};

const pageSubtitleStyle = {
  fontSize: "14px",
  color: "#74839a",
  margin: 0
};

// Filters Card Styles
const filtersCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "20px 24px",
  marginBottom: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
};

const filtersContainerStyle = {
  display: "flex",
  gap: "20px",
  alignItems: "flex-end",
  flexWrap: "wrap"
};

const filterGroupStyle = {
  flex: "1",
  minWidth: "200px"
};

const filterLabelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: "700",
  color: "#5c6b80",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const filterSelectStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "13px",
  color: "#1e293b",
  outline: "none",
  backgroundColor: "#fff",
  cursor: "pointer",
  transition: "all 0.2s"
};

const clearFiltersBtnStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  whiteSpace: "nowrap"
};

// Table Styles
const tableCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  padding: "14px 20px"
};

const headerCellStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const tableRowStyle = (isLast) => ({
  display: "grid",
  gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr",
  padding: "16px 20px",
  borderBottom: isLast ? "none" : "1px solid #f1f5f9",
  transition: "background 0.2s",
  alignItems: "center"
});

// Cell Styles
const studentCellStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
};

const avatarStyle = (color) => ({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  backgroundColor: color,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: "700",
  flexShrink: 0
});

const studentNameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#0f172a"
};

const studentIdStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  marginTop: "2px"
};

const assignmentCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

const assignmentNameStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#1e293b"
};

const subjectNameStyle = {
  fontSize: "11px",
  color: "#94a3b8"
};

const dateCellStyle = {
  fontSize: "13px",
  color: "#64748b"
};

const dateStyle = {
  fontSize: "13px",
  color: "#64748b"
};

const statusCellStyle = {
  display: "flex",
  alignItems: "center"
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "600",
  backgroundColor: "#f8fafc"
};

const statusDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  display: "inline-block"
};

const actionCellStyle = {};

const viewDetailsBtnStyle = {
  padding: "6px 14px",
  borderRadius: "6px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  color: "#3c74ff",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px"
};

const resultsCountStyle = {
  padding: "12px 20px",
  borderTop: "1px solid #e2e8f0",
  fontSize: "12px",
  color: "#64748b",
  backgroundColor: "#fafbfc"
};

// Loading and Empty States
const loadingContainerStyle = {
  padding: "60px",
  textAlign: "center"
};

const loadingTextStyle = {
  color: "#64748b",
  marginTop: "16px",
  fontSize: "14px"
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
  zIndex: 1000,
  animation: "fadeIn 0.3s ease-out"
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

const modalHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #edf1f5",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const modalTitleStyle = {
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
  borderRadius: "6px"
};

const modalBodyStyle = {
  padding: "24px"
};

const modalFooterStyle = {
  padding: "16px 24px",
  borderTop: "1px solid #edf1f5",
  display: "flex",
  justifyContent: "flex-end"
};

// Modal Content Styles
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

const infoLabelStyle = {
  fontSize: "12px",
  color: "#74839a",
  fontWeight: "500"
};

const infoValueStyle = {
  fontSize: "13px",
  color: "#2e3b52",
  fontWeight: "600"
};

const markValueStyle = {
  fontSize: "16px",
  color: "#3d6df2",
  fontWeight: "bold"
};

const messageSectionStyle = {
  marginBottom: "20px"
};

const responseSectionStyle = {
  marginBottom: "20px"
};

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

const responseBoxStyle = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #d1fae5",
  borderRadius: "10px",
  padding: "14px 16px"
};

const responseHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  paddingBottom: "8px",
  borderBottom: "1px solid #d1fae5"
};

const lecturerNameStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#059669"
};

const responseDateStyle = {
  fontSize: "10px",
  color: "#94a3b8"
};

const responseMessageStyle = {
  fontSize: "13px",
  color: "#1e293b",
  lineHeight: "1.6",
  marginBottom: "10px"
};

const revisedMarkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "10px",
  paddingTop: "8px",
  borderTop: "1px solid #d1fae5"
};

const revisedMarkLabel = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#059669"
};

const revisedMarkValue = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#059669"
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
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    button:hover {
      transform: translateY(-1px);
    }
    
    .view-details-btn:hover {
      background-color: #3c74ff;
      color: #fff;
      border-color: #3c74ff;
    }
    
    .clear-filters-btn:hover {
      background-color: #f1f5f9;
      border-color: #cbd5e1;
    }
  `;
  document.head.appendChild(style);
}