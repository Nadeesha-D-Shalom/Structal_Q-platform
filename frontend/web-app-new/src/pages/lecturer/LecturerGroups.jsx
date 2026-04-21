import { useCallback, useEffect, useState } from "react";
import LecturerNavbar from "./LecturerNavbar";

const API_BASE = process.env.REACT_APP_API_URL || "";

const authHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function LecturerGroups() {
  const [assessments, setAssessments] = useState([]);
  const [assessmentId, setAssessmentId] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [groupName, setGroupName] = useState("");
  const [addGroupId, setAddGroupId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [roleInGroup, setRoleInGroup] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/assessments`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAssessments(Array.isArray(d) ? d : []))
      .catch(() => setAssessments([]));
  }, []);

  const loadGroups = useCallback(async () => {
    const aid = Number(assessmentId);
    if (!aid) {
      setGroups([]);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/groups/assessment/${aid}`, { headers: authHeaders() });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(payload.error || `Error ${res.status}`);
        setGroups([]);
        return;
      }
      setGroups(payload.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const createGroup = async (e) => {
    e.preventDefault();
    const aid = Number(assessmentId);
    if (!aid) {
      setErr("Select an assessment first");
      return;
    }
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          assessment_id: aid,
          group_name: groupName.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(payload.error || payload.message || `Error ${res.status}`);
        return;
      }
      setGroupName("");
      await loadGroups();
    } catch (e) {
      setErr(e.message || "Create failed");
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    const gid = Number(addGroupId);
    const sid = Number(studentId);
    if (!gid || !sid) {
      setErr("Group ID and student user ID are required");
      return;
    }
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/groups/${gid}/members`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          student_id: sid,
          role_in_group: roleInGroup.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(payload.error || `Error ${res.status}`);
        return;
      }
      setStudentId("");
      setRoleInGroup("");
      await loadGroups();
    } catch (e) {
      setErr(e.message || "Add member failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <LecturerNavbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-[#18243d] mb-2">Student groups</h1>
        <p className="text-sm text-[#74839a] mb-6">
          Groups are tied to an assessment. Names must be unique per assessment. Members reference{" "}
          <code className="text-xs bg-[#eef2f7] px-1 rounded">user_id</code> (students).
        </p>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
        )}

        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#5c6b80] mb-1">Assessment</label>
          <select
            className="border border-[#dde3eb] rounded-lg px-3 py-2 text-sm w-full max-w-md bg-white"
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
          >
            <option value="">— Select —</option>
            {assessments.map((a) => (
              <option key={a.assessment_id} value={a.assessment_id}>
                {a.assessment_title} ({a.subject_name || "—"})
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={createGroup} className="bg-white rounded-xl border border-[#dde3eb] p-4 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-[#24324a]">Create group</h2>
          <div className="flex flex-wrap gap-2 items-end">
            <input
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
              placeholder="Group name (optional — auto if empty)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <button
              type="submit"
              disabled={!assessmentId}
              className="rounded-lg bg-[#0f2f66] text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
            >
              Create group
            </button>
          </div>
        </form>

        <form onSubmit={addMember} className="bg-white rounded-xl border border-[#dde3eb] p-4 mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-[#24324a]">Add member</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Group ID"
              type="number"
              value={addGroupId}
              onChange={(e) => setAddGroupId(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Student user_id"
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Role in group (optional)"
              value={roleInGroup}
              onChange={(e) => setRoleInGroup(e.target.value)}
            />
          </div>
          <button type="submit" className="rounded-lg bg-[#1bb56d] text-white text-sm font-semibold px-4 py-2">
            Add member
          </button>
        </form>

        <div className="bg-white rounded-xl border border-[#dde3eb] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#edf1f5] text-sm font-semibold text-[#24324a]">
            Groups for selected assessment
          </div>
          {loading ? (
            <p className="p-4 text-sm text-[#74839a]">Loading…</p>
          ) : !assessmentId ? (
            <p className="p-4 text-sm text-[#74839a]">Select an assessment.</p>
          ) : groups.length === 0 ? (
            <p className="p-4 text-sm text-[#74839a]">No groups yet.</p>
          ) : (
            <ul className="divide-y divide-[#edf1f5]">
              {groups.map((g) => (
                <li key={g.group_id} className="px-4 py-3 text-sm">
                  <span className="font-semibold text-[#18243d]">#{g.group_id}</span>
                  <span className="text-[#5c6b80]"> {g.group_name || "(unnamed)"}</span>
                  <span className="text-[#9aa8bb]"> · {g.member_count ?? 0} member(s)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
