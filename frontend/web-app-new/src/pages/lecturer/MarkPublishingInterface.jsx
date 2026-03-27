import { useState, useEffect } from "react";
import logo from "../../assets/logo.png";

const NAV_ITEMS = ["Dashboard", "Subjects", "Grades & Marks", "Publish Marks", "Timetable", "Submissions"];

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

export default function PublishMarksConfig() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [aiScores, setAiScores] = useState(null);
  const [diagramPages, setDiagramPages] = useState([]);
  const [diagramMarks, setDiagramMarks] = useState({});
  const [enableConcernWindow, setEnableConcernWindow] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState({});

  // 1. Initial Load: Fetch Assessments
  useEffect(() => {
    fetch("/api/marks/assessments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAssessments(data);
      })
      .catch(err => console.error("Error fetching assessments:", err));
  }, []);

  // 2. Handle Assessment Selection
  const handleAssessmentChange = async (e) => {
    const aid = e.target.value;
    setSelectedAssessmentId(aid);
    setErrors({});
    setSelectedSub(null); // Reset selection
    setAiScores(null);
    setDiagramPages([]);

    if (!aid) {
        setPendingSubmissions([]);
        return;
    }

    try {
        const res = await fetch(`/api/marks/pending-submissions?assessment_id=${aid}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
            setPendingSubmissions(data);
            if (data.length > 0) {
                handleSubmissionSelect(data[0]);
            }
        } else {
            setPendingSubmissions([]);
        }
    } catch (err) {
        console.error("Error fetching submissions:", err);
        setPendingSubmissions([]);
    }
  };

  // 3. Handle Specific Submission Selection
  const handleSubmissionSelect = async (sub) => {
    if (!sub) return;
    setSelectedSub(sub);
    setDiagramMarks({});
    setErrors({});
    
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

  // Logic: Calculate Totals
  const aiTotal = aiScores?.final_mark || 0; 
  const diagramTotal = Object.values(diagramMarks).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const rawSum = aiTotal + diagramTotal;
  const finalMark = +Math.min(100, Math.max(0, rawSum)).toFixed(2);

  // Validations
  const validate = () => {
    let newErrors = {};
    // Cast both to Number to avoid string/int mismatch
    const selectedAssessment = assessments.find(a => Number(a.assessment_id) === Number(selectedAssessmentId));
    
    if (!selectedSub) newErrors.submission = "Please select a submission";
    if (finalMark < 0) newErrors.mark = "Mark cannot be negative.";
    
    if (selectedAssessment && finalMark > selectedAssessment.total_marks) {
      newErrors.mark = `Exceeds Assessment Max (${selectedAssessment.total_marks}).`;
    }

    const missing = diagramPages.filter(p => !diagramMarks[p.ocr_id] || diagramMarks[p.ocr_id] === "");
    if (missing.length > 0) newErrors.diagrams = "Provide marks for all diagram pages.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setIsPublishing(true);
    try {
      const res = await fetch("/api/marks/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: selectedSub.submission_id,
          final_mark: finalMark,
          enable_concern_window: enableConcernWindow
        })
      });
      if (res.ok) {
          alert("Mark Successfully Published!");
          // Refresh submissions list to remove the one we just published
          handleAssessmentChange({ target: { value: selectedAssessmentId } });
      } else {
          const errData = await res.json();
          alert(`Error: ${errData.message}`);
      }
    } catch (err) {
        alert("Failed to connect to server.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f6fa", fontFamily: "'Inter', sans-serif" }}>
      <header style={navStyle}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", marginRight: 56 }}>
            <img src={logo} alt="Logo" style={{ width: 55, height: 40, objectFit: "contain" }} />
            <h1 style={{ marginLeft: 12, fontSize: 18, fontWeight: "bold", color: "#0f2f66" }}>
              Structal<span style={{ color: "#f28b22" }}>Q</span>
            </h1>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 36, fontSize: 12, color: "#4c5b70", fontWeight: 500 }}>
            {NAV_ITEMS.map(item => (
              <div key={item} style={{ 
                color: item === "Publish Marks" ? "#2f3a4d" : "#4c5b70",
                fontWeight: item === "Publish Marks" ? 700 : 500,
                cursor: "pointer" 
              }}>
                <span>{item}</span>
              </div>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#1f2937" }}>Dr. Robert Fox</p>
          <div style={avatarStyle}><i className="fas fa-user" style={{ fontSize: 12 }}></i></div>
        </div>
      </header>

      <main style={{ padding: "34px 44px" }}>
        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 23, fontWeight: "bold", color: "#18243d" }}>Publish Marks Configuration</h2>
          <p style={{ fontSize: 13, color: "#74839a" }}>Manage visibility and automated marking for assessments.</p>
        </section>

        <div style={mainCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>✔</div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#24324a" }}>Mark Publication Settings</h3>
              <p style={{ fontSize: 12, color: "#74839a" }}>Select subject data and verify marking accuracy.</p>
            </div>
          </div>

          <div style={{ padding: "24px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
              <div>
                <label style={imageLabelStyle}>Subject / Assessment</label>
                <select style={imageSelectStyle} value={selectedAssessmentId} onChange={handleAssessmentChange}>
                  <option value="">Choose an Assessment</option>
                  {Array.isArray(assessments) && assessments.map(a => (
                      <option key={a.assessment_id} value={a.assessment_id}>{a.assessment_title}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <label style={imageLabelStyle}>Pending Submissions</label>
                  {selectedSub && (
                    <a 
                      href={`/api/marks/pdf/${selectedSub.submission_id}`} 
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
                  style={imageSelectStyle} 
                  value={selectedSub?.submission_id || ""}
                  onChange={(e) => handleSubmissionSelect(pendingSubmissions.find(s => s.submission_id === e.target.value))}
                >
                  <option value="">Choose a Submission</option>
                  {Array.isArray(pendingSubmissions) && pendingSubmissions.map(s => (
                      <option key={s.submission_id} value={s.submission_id}>{s.submission_id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...markingDetailContainer, borderColor: errors.mark ? "#ff4d4f" : "#edf1f5" }}>
              <div style={{ borderRight: "1px solid #edf1f5", paddingRight: 24 }}>
                <p style={subHeadingStyle}>AI Logic Score</p>
                <h4 style={{ marginTop: 8, fontSize: 24, fontWeight: "bold", color: "#18243d" }}>{aiTotal}</h4>
              </div>

              <div style={{ paddingLeft: 24 }}>
                <p style={subHeadingStyle}>Manual Diagram Review</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                  {diagramPages.length > 0 ? diagramPages.map(p => (
                    <div key={p.ocr_id} style={{ ...diagramInputWrapper, borderColor: errors.diagrams && !diagramMarks[p.ocr_id] ? "#ff4d4f" : "#dde3eb" }}>
                      <span style={{ fontSize: 10, fontWeight: "bold", color: "#9aa7bb" }}>PG {p.page_no}</span>
                      <input 
                        type="number" 
                        style={smallInputStyle} 
                        value={diagramMarks[p.ocr_id] || ""}
                        onChange={(e) => setDiagramMarks({...diagramMarks, [p.ocr_id]: e.target.value})} 
                      />
                    </div>
                  )) : <span style={{ fontSize: 12, color: "#9aa7bb", fontStyle: "italic" }}>No diagrams detected.</span>}
                </div>
                {errors.diagrams && <p style={errorTextStyle}>{errors.diagrams}</p>}
              </div>

              <div style={finalScoreSection}>
                <p style={{ ...subHeadingStyle, color: errors.mark ? "#ff4d4f" : "#3d6df2" }}>Final Result</p>
                <div style={{ fontSize: 32, fontWeight: "bold", color: errors.mark ? "#ff4d4f" : "#3d6df2" }}>{finalMark}</div>
              </div>
            </div>
            {errors.mark && <p style={{ ...errorTextStyle, textAlign: "right" }}>{errors.mark}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, padding: "24px 0", borderTop: "1px solid #edf1f5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#2e3b52" }}>Instant Publication</p>
                  <p style={{ fontSize: 12, color: "#74839a" }}>Make grades visible instantly.</p>
                </div>
                <Toggle value={true} onChange={() => {}} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#2e3b52" }}>Concern Window</p>
                  <p style={{ fontSize: 12, color: "#74839a" }}>Allow formal inquiries.</p>
                </div>
                <Toggle value={enableConcernWindow} onChange={setEnableConcernWindow} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 12 }}>
              <button style={{ background: "none", border: "none", color: "#74839a", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={handlePublish} disabled={isPublishing} style={{ ...saveBtnStyle, opacity: isPublishing ? 0.7 : 1 }}>
                  {isPublishing ? "Processing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Styles
const errorTextStyle = { color: "#ff4d4f", fontSize: 11, fontWeight: "bold", marginTop: 8 };
const navStyle = { height: 78, backgroundColor: "#fff", borderBottom: "1px solid #e7ebf1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" };
const avatarStyle = { width: 30, height: 30, borderRadius: "50%", backgroundColor: "#ead7c2", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b6b4a" };
const mainCardStyle = { backgroundColor: "#fff", border: "1px solid #d8dee8", borderRadius: 14, overflow: "hidden" };
const cardHeaderStyle = { height: 50, padding: "0 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #edf1f5" };
const iconBoxStyle = { width: 30, height: 30, backgroundColor: "#3c74ff", borderRadius: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 };
const imageLabelStyle = { display: "block", fontSize: 11, fontWeight: "bold", color: "#9aa8bb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 };
const imageSelectStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #dde3eb", fontSize: 13, color: "#2e3b52", outline: "none" };
const markingDetailContainer = { display: "grid", gridTemplateColumns: "1fr 2fr 1fr", backgroundColor: "#f9fafb", padding: "20px 24px", borderRadius: 12, marginBottom: 24, border: "1px solid #edf1f5" };
const subHeadingStyle = { fontSize: 11, fontWeight: "bold", color: "#9aa8bb", textTransform: "uppercase", letterSpacing: "0.06em" };
const diagramInputWrapper = { display: "flex", flexDirection: "column", gap: 4, background: "#fff", padding: "8px", borderRadius: 8, border: "1px solid #dde3eb" };
const smallInputStyle = { width: 42, border: "1px solid #dde3eb", borderRadius: 6, padding: "4px", fontSize: 12, fontWeight: "bold", textAlign: "center", outline: 'none' };
const finalScoreSection = { display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" };
const saveBtnStyle = { backgroundColor: "#3d6df2", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, fontWeight: "bold", fontSize: 12, cursor: "pointer" };