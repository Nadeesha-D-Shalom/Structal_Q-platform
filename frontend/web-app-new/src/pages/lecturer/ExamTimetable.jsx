import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import LecturerNavbar from "./LecturerNavbar";

const API_BASE = "/api/timetable";

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

  const canPublish = useMemo(() => selectedId !== "", [selectedId]);

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
        setTimetables((prev) => [{ ...res.data, exam_timetable_id: newId }, ...prev]);
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

  const handleCreateSession = async () => {
    if (!selectedId) return alert("Select a timetable first.");
    const payload = {
      subject_id: Number(sSubjectId),
      exam_date: sExamDate,
      start_time: sStart,
      end_time: sEnd,
      room_id: Number(sRoomId),
      capacity: Number(sCapacity),
    };

    if (!payload.subject_id || !payload.room_id || !payload.capacity) return alert("Subject ID, Room ID, and Capacity are required.");
    if (!payload.exam_date || !payload.start_time || !payload.end_time) return alert("Exam date and start/end times are required.");

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/${selectedId}/sessions`, payload, { headers: getAuthHeaders() });
      setSSubjectId("");
      setSExamDate("");
      setSStart("");
      setSEnd("");
      setSRoomId("");
      setSCapacity("");
      await refreshSessions(selectedId);
      await refreshConflicts(selectedId);
    } catch (e) {
      console.error("Create session failed:", e);
      alert(e?.response?.data?.error || "Failed to create session.");
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
            <div style={{ fontSize: 14, fontWeight: 800, color: "#24324a" }}>Add Sessions</div>
            <div style={{ fontSize: 12, color: "#74839a", marginTop: 4 }}>Enter subject_id, room_id, capacity manually.</div>
          </div>

          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Subject ID</div>
              <input value={sSubjectId} onChange={(e) => setSSubjectId(e.target.value)} style={inputStyle} placeholder="e.g., 1" />
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Exam Date</div>
              <input value={sExamDate} onChange={(e) => setSExamDate(e.target.value)} style={inputStyle} placeholder="YYYY-MM-DD" />
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
              <div style={labelStyle}>Room ID</div>
              <input value={sRoomId} onChange={(e) => setSRoomId(e.target.value)} style={inputStyle} placeholder="e.g., 3" />
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <div style={labelStyle}>Capacity</div>
              <input value={sCapacity} onChange={(e) => setSCapacity(e.target.value)} style={inputStyle} placeholder="e.g., 40" />
            </div>

            <div style={{ gridColumn: "span 6", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleCreateSession}
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
                {loading ? "Processing…" : "Add Session"}
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
                    {["Date", "Time", "Room", "Subject", "Capacity"].map((h) => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, padding: "10px 10px", borderBottom: "1px solid #edf1f5" }}>
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

