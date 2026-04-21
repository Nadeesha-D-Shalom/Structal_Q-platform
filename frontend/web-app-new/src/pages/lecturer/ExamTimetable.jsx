import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import LecturerNavbar from "./LecturerNavbar";
import { getApiBaseUrl } from "../../utils/apiBase";

const API_ROOT = getApiBaseUrl();
const API_BASE = `${API_ROOT}/api/timetable`;

const PageShell = ({ children }) => (
  <div style={{ minHeight: "100vh", backgroundColor: "#f5f6fa", fontFamily: "'Inter', sans-serif" }}>
    {children}
  </div>
);

export default function LecturerTimetable() {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [timetables, setTimetables] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  const [loading, setLoading] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [editingTimetableId, setEditingTimetableId] = useState("");
  const [timetableType, setTimetableType] = useState("GENERAL");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("First Semester");
  const [sectionName, setSectionName] = useState("");

  const [sSubjectCode, setSSubjectCode] = useState("");
  const [sExamDate, setSExamDate] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");
  const [sRoomName, setSRoomName] = useState("");
  const [sBuildingName, setSBuildingName] = useState("");
  const [sCapacity, setSCapacity] = useState("");
  const [editingSessionId, setEditingSessionId] = useState("");

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yearOptions = useMemo(() => ["Year 1", "Year 2", "Year 3", "Year 4"], []);

  const canPublish = useMemo(() => selectedId !== "", [selectedId]);
  const selectedTimetable = useMemo(
    () =>
      timetables.find(
        (t) => String(t.exam_timetable_id || t.timetable_id) === String(selectedId)
      ) || null,
    [timetables, selectedId]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [res, subRes, roomRes] = await Promise.all([
          axios.get(API_BASE, { headers: getAuthHeaders() }),
          axios.get(`${API_ROOT}/api/subjects`, { headers: getAuthHeaders() }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/rooms`, { headers: getAuthHeaders() }).catch(() => ({ data: {} })),
        ]);
        if (!mounted) return;
        setTimetables(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
        const sd = Array.isArray(subRes.data) ? subRes.data : subRes.data?.data || [];
        setSubjects(sd);
        const rd = roomRes.data?.data ?? roomRes.data ?? [];
        setLocations(Array.isArray(rd) ? rd : []);
      } catch (e) {
        console.error("Failed to load timetables:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshSessions = async (tid) => {
    if (!tid) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/${tid}/sessions`, { headers: getAuthHeaders() });
      const data = res.data?.data ?? res.data ?? [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load sessions:", e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshConflicts = async (tid) => {
    if (!tid) return;
    try {
      const res = await axios.get(`${API_BASE}/${tid}/conflicts`, { headers: getAuthHeaders() });
      const data = res.data?.data ?? res.data ?? [];
      setConflicts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load conflicts:", e);
      setConflicts([]);
    }
  };

  const handleCreateTimetable = async () => {
    if (!academicYear || !semester || !timetableType || !sectionName.trim()) {
      return alert("Select exam type, year, semester and specialization.");
    }
    const generatedTitle = [timetableType, academicYear, semester, sectionName.trim()].join(" - ");
    setLoading(true);
    try {
      const body = {
        title: generatedTitle,
        timetable_type: timetableType,
        academic_year: academicYear,
        semester,
        section_name: sectionName.trim() || null,
      };

      if (editingTimetableId) {
        await axios.put(`${API_BASE}/${editingTimetableId}`, body, { headers: getAuthHeaders() });
        setTimetables((prev) =>
          prev.map((t) =>
            String(t.exam_timetable_id || t.timetable_id) === String(editingTimetableId)
              ? {
                  ...t,
                  title: generatedTitle,
                  timetable_type: timetableType,
                  academic_year: academicYear,
                  semester,
                  section_name: sectionName.trim() || null,
                }
              : t
          )
        );
        alert("Timetable updated.");
      } else {
        const res = await axios.post(API_BASE, body, { headers: getAuthHeaders() });
        const newId = res.data?.timetable_id ?? res.data?.data?.timetable_id;
        if (newId) {
          setTimetables((prev) => [
            {
              exam_timetable_id: newId,
              title: generatedTitle,
              timetable_type: timetableType,
              academic_year: academicYear,
              semester,
              section_name: sectionName.trim() || null,
              status: "DRAFT",
              ...res.data,
            },
            ...prev,
          ]);
          setSelectedId(String(newId));
          await refreshSessions(String(newId));
          await refreshConflicts(String(newId));
        }
      }

      setEditingTimetableId("");
      setSectionName("");
      setTimetableType("GENERAL");
      setAcademicYear("");
      setSemester("First Semester");
    } catch (e) {
      console.error("Save timetable failed:", e);
      alert(e?.response?.data?.error || "Failed to save timetable.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTimetable = () => {
    if (!selectedId) return alert("Select a timetable first.");
    const current = timetables.find(
      (t) => String(t.exam_timetable_id || t.timetable_id) === String(selectedId)
    );
    if (!current) return alert("Selected timetable not found.");
    setEditingTimetableId(String(current.exam_timetable_id || current.timetable_id));
    setTimetableType(String(current.timetable_type || "GENERAL"));
    setAcademicYear(String(current.academic_year || ""));
    setSemester(String(current.semester || "First Semester"));
    setSectionName(String(current.section_name || ""));
  };

  const handleCancelTimetableEdit = () => {
    setEditingTimetableId("");
    setTimetableType("GENERAL");
    setAcademicYear("");
    setSemester("First Semester");
    setSectionName("");
  };

  const handleDeleteTimetable = async () => {
    if (!selectedId) return alert("Select a timetable first.");
    if (!window.confirm("Delete selected timetable and all its sessions?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/${selectedId}`, { headers: getAuthHeaders() });
      setTimetables((prev) =>
        prev.filter((t) => String(t.exam_timetable_id || t.timetable_id) !== String(selectedId))
      );
      if (String(editingTimetableId) === String(selectedId)) {
        handleCancelTimetableEdit();
      }
      setSelectedId("");
      setSessions([]);
      setConflicts([]);
      alert("Timetable deleted.");
    } catch (e) {
      console.error("Delete timetable failed:", e);
      alert(e?.response?.data?.error || "Failed to delete timetable.");
    } finally {
      setLoading(false);
    }
  };

  const normalizeTime = (t) => {
    const s = String(t || "").trim();
    if (!s) return "";
    return s.length === 5 && s[2] === ":" ? `${s}:00` : s;
  };

  const extractHHmm = (value) => {
    if (value == null) return "";
    const s = String(value).trim();
    if (!s) return "";
    const m = s.match(/(?:T)?(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;
    return "";
  };

  const validateSessionForm = () => {
    if (!selectedId) return "Select a timetable first.";
    if (!sSubjectCode.trim() || !sCapacity) return "Subject and capacity are required.";
    if (!sRoomName.trim()) return "Room name is required.";
    if (!sBuildingName.trim()) return "Building name is required.";
    if (!sExamDate || !sStart || !sEnd) return "Exam date and start/end times are required.";
    if (!editingSessionId && sExamDate < todayStr) return "Exam date cannot be in the past.";
    const st = normalizeTime(sStart);
    const et = normalizeTime(sEnd);
    const toM = (x) => {
      const p = String(x).split(":").map(Number);
      return (p[0] || 0) * 60 + (p[1] || 0);
    };
    const startMins = toM(st);
    const endMins = toM(et);
    if (startMins < 7 * 60 || endMins > 20 * 60) return "Times must be between 07:00 AM and 08:00 PM.";
    if (toM(et) <= toM(st)) return "End time must be after start time.";
    return null;
  };

  const clearSessionForm = () => {
    setSSubjectCode("");
    setSExamDate("");
    setSStart("");
    setSEnd("");
    setSRoomName("");
    setSBuildingName("");
    setSCapacity("");
    setEditingSessionId("");
  };

  const handleSaveSession = async () => {
    const err = validateSessionForm();
    if (err) return alert(err);
    const trimmedRoom = sRoomName.trim();
    const trimmedBuilding = sBuildingName.trim();
    const roomAsNum = Number(trimmedRoom);

    const payload = {
      subject_id: sSubjectCode.trim(),
      exam_date: sExamDate,
      start_time: normalizeTime(sStart),
      end_time: normalizeTime(sEnd),
      room_id: Number.isFinite(roomAsNum) && roomAsNum > 0 ? roomAsNum : null,
      room_name: trimmedRoom,
      building: trimmedBuilding,
      capacity: Number(sCapacity),
    };

    setLoading(true);
    try {
      if (editingSessionId) {
        await axios.put(`${API_BASE}/${selectedId}/sessions/${editingSessionId}`, payload, {
          headers: getAuthHeaders(),
        });
      } else {
        await axios.post(`${API_BASE}/${selectedId}/sessions`, payload, { headers: getAuthHeaders() });
      }
      clearSessionForm();
      await refreshSessions(selectedId);
      await refreshConflicts(selectedId);
    } catch (e) {
      console.error("Save session failed:", e);
      alert(e?.response?.data?.error || "Failed to save session.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = (s) => {
    const raw = s.exam_date;
    const dateStr =
      typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)
        ? raw.slice(0, 10)
        : raw
          ? new Date(raw).toISOString().slice(0, 10)
          : "";
    setEditingSessionId(String(s.session_id));
    setSSubjectCode(String(s.subject_code || s.subject_name || s.subject_id || ""));
    setSExamDate(dateStr);
    setSStart(extractHHmm(s.start_time));
    setSEnd(extractHHmm(s.end_time));
    setSRoomName(String(s.room_name || s.room_id || ""));
    setSBuildingName(String(s.room_building || ""));
    setSCapacity(String(s.capacity ?? ""));
  };

  const handleDeleteSession = async (sessionId) => {
    if (!selectedId || !sessionId) return;
    if (!window.confirm("Delete this session?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/${selectedId}/sessions/${sessionId}`, { headers: getAuthHeaders() });
      if (String(editingSessionId) === String(sessionId)) clearSessionForm();
      await refreshSessions(selectedId);
      await refreshConflicts(selectedId);
    } catch (e) {
      console.error("Delete session failed:", e);
      alert(e?.response?.data?.error || "Failed to delete session.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await axios.patch(`${API_BASE}/${selectedId}/publish`, {}, { headers: getAuthHeaders() });
      await refreshSessions(selectedId);
      await refreshConflicts(selectedId);
      alert("Timetable published.");
    } catch (e) {
      console.error("Publish failed:", e);
      alert(e?.response?.data?.error || "Failed to publish timetable.");
    } finally {
      setLoading(false);
    }
  };

  const topCardStyle = {
    backgroundColor: "#fff",
    border: "1px solid #d8dee8",
    borderRadius: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: 18,
    overflow: "hidden",
  };

  const labelStyle = { fontSize: 12.5, fontWeight: 700, color: "#6b7280", marginBottom: 6 };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #dde3eb", outline: "none", fontSize: 13.5 };

  return (
    <PageShell>
      <LecturerNavbar activePage="Timetable" />
      <main style={{ padding: "34px 44px" }}>
        <h2 style={{ fontSize: 23, fontWeight: "bold", color: "#18243d", marginBottom: 18 }}>Exam Timetable (Lecturer)</h2>

        <div style={topCardStyle}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #edf1f5" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#24324a" }}>Create / Manage Timetables</div>
              <div style={{ fontSize: 12, color: "#74839a", marginTop: 4 }}>Select exam type, year, semester, specialization, then add sessions and publish.</div>
            </div>
          </div>

          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18 }}>
            <div>
              <div style={labelStyle}>Exam Type</div>
              <select value={timetableType} onChange={(e) => setTimetableType(e.target.value)} style={inputStyle}>
                <option value="GENERAL">General</option>
                <option value="MID">Mid</option>
                <option value="FINAL">Final</option>
                <option value="REPEAT">Repeat</option>
              </select>
            </div>
            <div>
              <div style={labelStyle}>Academic Year</div>
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={inputStyle}>
                <option value="">Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Semester</div>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} style={inputStyle}>
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
              </select>
            </div>
            <div>
              <div style={labelStyle}>Specialization</div>
              <input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                style={inputStyle}
                placeholder="e.g., Software Engineering"
              />
            </div>
            <div style={{ gridColumn: "span 4", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {editingTimetableId ? (
                <button
                  type="button"
                  onClick={handleCancelTimetableEdit}
                  disabled={loading}
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    padding: "10px 18px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
              <button
                onClick={handleCreateTimetable}
                disabled={loading}
                style={{
                  backgroundColor: "#3d6df2",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {editingTimetableId ? "Update Timetable" : "Create Timetable"}
              </button>
            </div>
          </div>
        </div>

        <div style={topCardStyle}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #edf1f5", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#24324a" }}>Add / edit sessions</div>
              <div style={{ fontSize: 12, color: "#74839a", marginTop: 4 }}>
                Select timetable first, then choose subject, date, time range, building and room.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  refreshSessions(e.target.value);
                  refreshConflicts(e.target.value);
                }}
                style={{ ...inputStyle, width: 300 }}
              >
                <option value="">Select Timetable</option>
                {Array.isArray(timetables) &&
                  timetables.map((t) => (
                    <option key={t.exam_timetable_id || t.timetable_id} value={String(t.exam_timetable_id || t.timetable_id)}>
                      {[t.title || t.timetable_title || `Timetable #${t.exam_timetable_id || t.timetable_id}`, t.timetable_type, t.academic_year, t.semester, t.section_name]
                        .filter(Boolean)
                        .join(" · ")}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleEditTimetable}
                disabled={!selectedId || loading}
                style={{
                  backgroundColor: !selectedId ? "#dde3eb" : "#eef2ff",
                  color: !selectedId ? "#9ca3af" : "#3730a3",
                  border: "1px solid #c7d2fe",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: !selectedId || loading ? "not-allowed" : "pointer",
                  opacity: !selectedId || loading ? 0.8 : 1,
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteTimetable}
                disabled={!selectedId || loading}
                style={{
                  backgroundColor: !selectedId ? "#dde3eb" : "#fef2f2",
                  color: !selectedId ? "#9ca3af" : "#b91c1c",
                  border: "1px solid #fecaca",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: !selectedId || loading ? "not-allowed" : "pointer",
                  opacity: !selectedId || loading ? 0.8 : 1,
                }}
              >
                Delete
              </button>
              <button
                onClick={handlePublish}
                disabled={!canPublish || loading}
                style={{
                  backgroundColor: canPublish ? "#3d6df2" : "#dde3eb",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: !canPublish || loading ? "not-allowed" : "pointer",
                  opacity: !canPublish || loading ? 0.7 : 1,
                }}
              >
                {loading ? "Processing…" : "Publish"}
              </button>
            </div>
          </div>

          {selectedTimetable ? (
            <div
              style={{
                margin: "0 24px",
                marginTop: 16,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: 12.5,
                color: "#475569",
              }}
            >
              <span><strong style={{ color: "#1e293b" }}>Type:</strong> {selectedTimetable.timetable_type || "—"}</span>
              <span><strong style={{ color: "#1e293b" }}>Year:</strong> {selectedTimetable.academic_year || "—"}</span>
              <span><strong style={{ color: "#1e293b" }}>Semester:</strong> {selectedTimetable.semester || "—"}</span>
              <span><strong style={{ color: "#1e293b" }}>Specialization:</strong> {selectedTimetable.section_name || "—"}</span>
              <span><strong style={{ color: "#1e293b" }}>Status:</strong> {selectedTimetable.status || "—"}</span>
            </div>
          ) : null}

          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Subject</div>
              <input list="subject-options" value={sSubjectCode} onChange={(e) => setSSubjectCode(e.target.value)} style={inputStyle} placeholder="e.g., SE2601" />
              <datalist id="subject-options">
                {subjects.map((sub) => (
                  <option key={sub.subject_id} value={sub.subject_code || sub.subject_name || ""}>
                    {sub.subject_name}
                  </option>
                ))}
              </datalist>
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Exam Date</div>
              <input
                type="date"
                min={editingSessionId ? undefined : todayStr}
                value={sExamDate}
                onChange={(e) => setSExamDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Start Time</div>
              <input
                type="time"
                min="07:00"
                max="20:00"
                step="1800"
                value={sStart}
                onChange={(e) => setSStart(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>End Time</div>
              <input
                type="time"
                min="07:00"
                max="20:00"
                step="1800"
                value={sEnd}
                onChange={(e) => setSEnd(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Building Name</div>
              <input
                list="building-options"
                value={sBuildingName}
                onChange={(e) => setSBuildingName(e.target.value)}
                style={inputStyle}
                placeholder="e.g., Main Building"
              />
              <datalist id="building-options">
                {[...new Set(locations.map((loc) => loc.building).filter(Boolean))].map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Room Name</div>
              <input
                list="location-options"
                value={sRoomName}
                onChange={(e) => {
                  const nextRoom = e.target.value;
                  setSRoomName(nextRoom);
                  const matched = locations.find((loc) => String(loc.room_name || "") === nextRoom);
                  if (matched?.building) {
                    setSBuildingName(String(matched.building));
                  }
                }}
                style={inputStyle}
                placeholder="e.g., B401"
              />
              <datalist id="location-options">
                {locations.map((loc) => (
                  <option key={loc.room_id} value={loc.room_name || String(loc.room_id)}>
                    {loc.building ? `${loc.building}` : ""}
                  </option>
                ))}
              </datalist>
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Capacity</div>
              <input value={sCapacity} onChange={(e) => setSCapacity(e.target.value)} style={inputStyle} placeholder="e.g., 40" />
            </div>

            <div style={{ gridColumn: "span 6", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {editingSessionId ? (
                <button
                  type="button"
                  onClick={clearSessionForm}
                  disabled={loading}
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    padding: "10px 18px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
              <button
                onClick={handleSaveSession}
                disabled={loading || !selectedId}
                style={{
                  backgroundColor: !selectedId ? "#dde3eb" : "#3d6df2",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: !selectedId || loading ? "not-allowed" : "pointer",
                  opacity: !selectedId || loading ? 0.7 : 1,
                }}
              >
                {loading ? "Processing…" : editingSessionId ? "Update session" : "Add session"}
              </button>
            </div>
          </div>
        </div>

        <div style={topCardStyle}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #edf1f5" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#24324a" }}>Sessions</div>
            <div style={{ fontSize: 12, color: "#74839a", marginTop: 4 }}>{selectedId ? "Latest sessions for selected timetable." : "Select a timetable to view sessions."}</div>
          </div>

          <div style={{ padding: 24 }}>
            {!selectedId ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Select a timetable.</div>
            ) : sessions.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>No sessions found.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Time", "Building", "Room", "Subject", "Capacity", "Actions"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: h === "Actions" ? "right" : "left",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                          padding: "10px 10px",
                          borderBottom: "1px solid #edf1f5",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.session_id} style={{ borderBottom: "1px solid #edf1f5" }}>
                      <td style={{ padding: "12px 10px", color: "#374151" }}>{s.exam_date ? new Date(s.exam_date).toLocaleDateString("en-GB") : "—"}</td>
                      <td style={{ padding: "12px 10px", color: "#374151" }}>{extractHHmm(s.start_time) || "—"} - {extractHHmm(s.end_time) || "—"}</td>
                      <td style={{ padding: "12px 10px", color: "#374151" }}>{s.room_building || "—"}</td>
                      <td style={{ padding: "12px 10px", color: "#374151" }}>{s.room_name || s.room_id || "—"}</td>
                      <td style={{ padding: "12px 10px", color: "#374151" }}>
                        {s.subject_code || s.subject_name || s.subject_id || "—"}
                      </td>
                      <td style={{ padding: "12px 10px", color: "#374151" }}>{s.capacity ?? "—"}</td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleEditSession(s)}
                          style={{
                            marginRight: 8,
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #c7d2fe",
                            background: "#eef2ff",
                            color: "#3730a3",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s.session_id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={topCardStyle}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #edf1f5" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#24324a" }}>Conflicts</div>
            <div style={{ fontSize: 12, color: "#74839a", marginTop: 4 }}>
              {selectedId ? "Conflict log entries for this timetable." : "Select a timetable to view conflicts."}
            </div>
          </div>
          <div style={{ padding: 24 }}>
            {!selectedId ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Select a timetable.</div>
            ) : conflicts.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>No conflicts found.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {conflicts.map((c) => (
                  <div key={c.conflict_id} style={{ border: "1px solid #fca5a5", background: "#fff5f5", padding: 14, borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#dc2626" }}>Conflict</div>
                    <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>{c.conflict_type || c.subject || c.conflict_description || "—"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      {c.exam_date ? new Date(c.exam_date).toLocaleDateString("en-GB") : ""} {c.start_time ? `(${extractHHmm(c.start_time)} - ${extractHHmm(c.end_time)})` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}

