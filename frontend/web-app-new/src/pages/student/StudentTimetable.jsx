import React, { useEffect, useState } from "react";
import axios from "axios";
import StudentNavbar from "./StudentNavbar";

const API_BASE = "/api/timetable";

export default function StudentTimetable() {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/student/view`, { headers: getAuthHeaders() });
        const data = res.data?.data ?? [];
        if (!mounted) return;
        setSessions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load student timetable:", e);
        if (!mounted) return;
        setError(e?.response?.data?.error || "Failed to load timetable.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f6fa", fontFamily: "'Inter', sans-serif" }}>
      <StudentNavbar activePage="Timetable" />
      <main style={{ padding: "34px 44px" }}>
        <h2 style={{ fontSize: 23, fontWeight: "bold", color: "#18243d", marginBottom: 18 }}>My Exam Timetable</h2>

        {loading ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading timetable…</div>
        ) : error ? (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>No published timetable sessions found.</div>
        ) : (
          <div style={{ backgroundColor: "#fff", border: "1px solid #d8dee8", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Date", "Time", "Room", "Subject"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        padding: "12px 14px",
                        borderBottom: "1px solid #edf1f5",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #edf1f5" }}>
                    <td style={{ padding: "12px 14px", color: "#374151", fontSize: 13 }}>
                      {s.exam_date ? new Date(s.exam_date).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151", fontSize: 13 }}>
                      {s.start_time} - {s.end_time}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151", fontSize: 13 }}>
                      {s.room_name || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151", fontSize: 13 }}>
                      {s.subject_code} - {s.subject_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

