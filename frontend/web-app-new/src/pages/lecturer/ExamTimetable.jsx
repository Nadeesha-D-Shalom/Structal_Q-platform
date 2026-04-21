import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import LecturerNavbar from "./LecturerNavbar";
import { getApiBaseUrl } from "../../utils/apiBase";

const API_ROOT = getApiBaseUrl();
const API_BASE = `${API_ROOT}/api/timetable`;
const SUBJECTS_URL = `${API_ROOT}/api/subjects`;

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

  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");

  const [sSubjectId, setSSubjectId] = useState("");
  const [sExamDate, setSExamDate] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");
  const [sRoomId, setSRoomId] = useState("");
  const [sCapacity, setSCapacity] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState("");

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const canPublish = useMemo(() => selectedId !== "", [selectedId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [subRes, roomRes] = await Promise.all([
          axios.get(SUBJECTS_URL, { headers: getAuthHeaders() }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/rooms`, { headers: getAuthHeaders() }).catch(() => ({ data: {} })),
        ]);
        if (!mounted) return;
        const subData = Array.isArray(subRes.data) ? subRes.data : subRes.data?.data || [];
        setSubjects(subData);
        const roomData = roomRes.data?.data ?? roomRes.data ?? [];
        setRooms(Array.isArray(roomData) ? roomData : []);
      } catch (e) {
        console.error("Failed to load subjects/rooms:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(API_BASE, { headers: getAuthHeaders() });
        if (!mounted) return;
        setTimetables(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
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
    if (!tTitle.trim()) return alert("Timetable title is required.");
    setLoading(true);
    try {
      const res = await axios.post(
        API_BASE,
        { title: tTitle.trim(), description: tDesc.trim() },
        { headers: getAuthHeaders() }
      );
      const newId = res.data?.timetable_id ?? res.data?.data?.timetable_id;
      if (newId) {
        setTimetables((prev) => [
          {
            exam_timetable_id: newId,
            title: tTitle.trim(),
            status: "DRAFT",
            ...res.data,
          },
          ...prev,
        ]);
        setSelectedId(String(newId));
        setTTitle("");
        setTDesc("");
        await refreshSessions(String(newId));
        await refreshConflicts(String(newId));
      }
    } catch (e) {
      console.error("Create timetable failed:", e);
      alert(e?.response?.data?.error || "Failed to create timetable.");
    } finally {
      setLoading(false);
    }
  };

  const normalizeTime = (t) => {
    const s = String(t || "").trim();
    if (!s) return "";
    return s.length === 5 && s[2] === ":" ? `${s}:00` : s;
  };

  const validateSessionForm = () => {
    if (!selectedId) return "Select a timetable first.";
    if (!sSubjectId || !sRoomId || !sCapacity) return "Subject, room, and capacity are required.";
    if (!sExamDate || !sStart || !sEnd) return "Exam date and start/end times are required.";
    if (!editingSessionId && sExamDate < todayStr) return "Exam date cannot be in the past.";
    const st = normalizeTime(sStart);
    const et = normalizeTime(sEnd);
    const toM = (x) => {
      const p = String(x).split(":").map(Number);
      return (p[0] || 0) * 60 + (p[1] || 0);
    };
    if (toM(et) <= toM(st)) return "End time must be after start time.";
    return null;
  };

  const clearSessionForm = () => {
    setSSubjectId("");
    setSExamDate("");
    setSStart("");
    setSEnd("");
    setSRoomId("");
    setSCapacity("");
    setEditingSessionId("");
  };

  const handleSaveSession = async () => {
    const err = validateSessionForm();
    if (err) return alert(err);

    const payload = {
      subject_id: Number(sSubjectId),
      exam_date: sExamDate,
      start_time: normalizeTime(sStart),
      end_time: normalizeTime(sEnd),
      room_id: Number(sRoomId),
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
    setSSubjectId(String(s.subject_id ?? ""));
    setSExamDate(dateStr);
    setSStart(String(s.start_time || "").slice(0, 5));
    setSEnd(String(s.end_time || "").slice(0, 5));
    setSRoomId(String(s.room_id ?? ""));
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
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #edf1f5", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#24324a" }}>Create / Manage Timetables</div>
              <div style={{ fontSize: 12, color: "#74839a", marginTop: 4 }}>Add sessions and publish when ready.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  refreshSessions(e.target.value);
                  refreshConflicts(e.target.value);
                }}
                style={{ ...inputStyle, width: 260 }}
              >
                <option value="">Select Timetable</option>
                {Array.isArray(timetables) &&
                  timetables.map((t) => (
                    <option key={t.exam_timetable_id || t.timetable_id} value={String(t.exam_timetable_id || t.timetable_id)}>
                      {t.title || t.timetable_title || `Timetable #${t.exam_timetable_id || t.timetable_id}`}
                    </option>
                  ))}
              </select>
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

          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <div style={labelStyle}>Timetable Title</div>
              <input value={tTitle} onChange={(e) => setTTitle(e.target.value)} style={inputStyle} placeholder="e.g., Mid Semester Exams" />
            </div>
            <div>
              <div style={labelStyle}>Description</div>
              <input value={tDesc} onChange={(e) => setTDesc(e.target.value)} style={inputStyle} placeholder="Optional description" />
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
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
                Create Timetable
              </button>
            </div>
          </div>
        </div>

        <div style={topCardStyle}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #edf1f5" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#24324a" }}>Add / edit sessions</div>
            <div style={{ fontSize: 12, color: "#74839a", marginTop: 4 }}>
              Choose subject and room; date cannot be in the past; end time must be after start time.
            </div>
          </div>

          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Subject</div>
              <select value={sSubjectId} onChange={(e) => setSSubjectId(e.target.value)} style={inputStyle}>
                <option value="">Select subject</option>
                {subjects.map((sub) => (
                  <option key={sub.subject_id} value={String(sub.subject_id)}>
                    {sub.subject_code} — {sub.subject_name}
                  </option>
                ))}
              </select>
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
              <div style={labelStyle}>Start (HH:mm)</div>
              <input value={sStart} onChange={(e) => setSStart(e.target.value)} style={inputStyle} placeholder="09:00" />
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>End (HH:mm)</div>
              <input value={sEnd} onChange={(e) => setSEnd(e.target.value)} style={inputStyle} placeholder="11:00" />
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Room</div>
              <select value={sRoomId} onChange={(e) => setSRoomId(e.target.value)} style={inputStyle}>
                <option value="">Select room</option>
                {rooms.map((r) => (
                  <option key={r.room_id} value={String(r.room_id)}>
                    {r.room_name}
                    {r.building ? ` (${r.building})` : ""}
                  </option>
                ))}
              </select>
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
                    {["Date", "Time", "Room", "Subject", "Capacity", "Actions"].map((h) => (
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
                      <td style={{ padding: "12px 10px", color: "#374151" }}>{s.start_time} - {s.end_time}</td>
                      <td style={{ padding: "12px 10px", color: "#374151" }}>{s.room_name || "—"}</td>
                      <td style={{ padding: "12px 10px", color: "#374151" }}>
                        {s.subject_code} - {s.subject_name}
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
                      {c.exam_date ? new Date(c.exam_date).toLocaleDateString("en-GB") : ""} {c.start_time ? `(${c.start_time} - ${c.end_time})` : ""}
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

