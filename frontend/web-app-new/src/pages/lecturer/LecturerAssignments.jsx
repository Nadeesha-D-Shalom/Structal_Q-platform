import { useEffect, useState } from "react";
import LecturerNavbar from "./LecturerNavbar";

const API_BASE = process.env.REACT_APP_API_URL || "";

const authHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function LecturerAssignments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    offering_id: "",
    assessment_title: "",
    assessment_type: "COURSEWORK",
    total_marks: "",
    start_date: "",
    due_date: "",
    allow_resubmission: false,
    max_resubmissions: "0",
  });

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/assessments`, { headers: authHeaders() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/assessments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          offering_id: Number(form.offering_id),
          assessment_title: form.assessment_title.trim(),
          assessment_type: form.assessment_type.trim(),
          total_marks: form.total_marks ? Number(form.total_marks) : null,
          start_date: form.start_date || null,
          due_date: form.due_date || null,
          allow_resubmission: !!form.allow_resubmission,
          max_resubmissions: form.max_resubmissions === "" ? null : Number(form.max_resubmissions),
          late_policy_enabled: false,
          grace_minutes: 0,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(payload.message || payload.error || `Error ${res.status}`);
        return;
      }
      setForm({
        offering_id: "",
        assessment_title: "",
        assessment_type: "COURSEWORK",
        total_marks: "",
        start_date: "",
        due_date: "",
        allow_resubmission: false,
        max_resubmissions: "0",
      });
      await load();
    } catch (e) {
      setErr(e.message || "Create failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <LecturerNavbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-[#18243d] mb-2">Assignments</h1>
        <p className="text-sm text-[#74839a] mb-6">
          Assignments belong to a subject offering. Enter the <strong>offering_id</strong> from your database (subject_offering table).
        </p>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
        )}

        <form onSubmit={create} className="bg-white rounded-xl border border-[#dde3eb] p-4 mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-[#24324a]">Create assignment</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Offering ID *"
              type="number"
              value={form.offering_id}
              onChange={(e) => setForm((f) => ({ ...f, offering_id: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Title *"
              value={form.assessment_title}
              onChange={(e) => setForm((f) => ({ ...f, assessment_title: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Type (e.g. COURSEWORK)"
              value={form.assessment_type}
              onChange={(e) => setForm((f) => ({ ...f, assessment_type: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Total marks"
              type="number"
              value={form.total_marks}
              onChange={(e) => setForm((f) => ({ ...f, total_marks: e.target.value }))}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#24324a]">
            <input
              type="checkbox"
              checked={form.allow_resubmission}
              onChange={(e) => setForm((f) => ({ ...f, allow_resubmission: e.target.checked }))}
            />
            Allow resubmission
          </label>
          <input
            className="border rounded-lg px-3 py-2 text-sm max-w-xs"
            placeholder="Max resubmissions"
            type="number"
            min="0"
            value={form.max_resubmissions}
            onChange={(e) => setForm((f) => ({ ...f, max_resubmissions: e.target.value }))}
          />
          <button type="submit" className="rounded-lg bg-[#0f2f66] text-white text-sm font-semibold px-4 py-2 hover:bg-[#1a3d7a]">
            Create assignment
          </button>
        </form>

        <div className="bg-white rounded-xl border border-[#dde3eb] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#edf1f5] text-sm font-semibold text-[#24324a]">Assignments</div>
          {loading ? (
            <p className="p-4 text-sm text-[#74839a]">Loading…</p>
          ) : (
            <ul className="divide-y divide-[#edf1f5]">
              {items.map((a) => (
                <li key={a.assessment_id} className="px-4 py-3 text-sm">
                  <span className="font-semibold text-[#18243d]">{a.assessment_title}</span>
                  <span className="text-[#5c6b80]"> · {a.subject_name || "—"}</span>
                  <span className="text-[#9aa8bb]"> · offering {a.offering_id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
