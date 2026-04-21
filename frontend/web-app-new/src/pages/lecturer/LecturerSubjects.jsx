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

export default function LecturerSubjects() {
  const [items, setItems] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    subject_code: "",
    subject_name: "",
    credit_value: "",
    department: "",
  });
  const [offForm, setOffForm] = useState({
    subject_id: "",
    academic_year: "",
    semester: "",
    intake_name: "",
  });

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [subRes, offRes] = await Promise.all([
        fetch(`${API_BASE}/api/subjects`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/subjects/offerings`, { headers: authHeaders() }),
      ]);
      const data = await subRes.json();
      const offJson = await offRes.json().catch(() => ({}));
      setItems(Array.isArray(data) ? data : []);
      const list = offJson?.data ?? offJson;
      setOfferings(Array.isArray(list) ? list : []);
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
      const res = await fetch(`${API_BASE}/api/subjects`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          subject_code: form.subject_code.trim(),
          subject_name: form.subject_name.trim(),
          credit_value: form.credit_value ? Number(form.credit_value) : null,
          department: form.department.trim() || null,
          status: "ACTIVE",
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(payload.error || payload.message || `Error ${res.status}`);
        return;
      }
      setForm({ subject_code: "", subject_name: "", credit_value: "", department: "" });
      await load();
    } catch (e) {
      setErr(e.message || "Create failed");
    }
  };

  const createOffering = async (e) => {
    e.preventDefault();
    setErr("");
    const sid = Number(offForm.subject_id);
    if (!sid) {
      setErr("Select a subject for the offering.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/subjects/offerings`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          subject_id: sid,
          academic_year: offForm.academic_year.trim() || null,
          semester: offForm.semester.trim() || null,
          intake_name: offForm.intake_name.trim() || null,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(payload.error || payload.message || `Error ${res.status}`);
        return;
      }
      setOffForm({ subject_id: "", academic_year: "", semester: "", intake_name: "" });
      await load();
    } catch (e2) {
      setErr(e2.message || "Offering create failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <LecturerNavbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-[#18243d] mb-2">Subjects</h1>
        <p className="text-sm text-[#74839a] mb-6">Create and view subjects (unique subject code).</p>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
        )}

        <form onSubmit={create} className="bg-white rounded-xl border border-[#dde3eb] p-4 mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-[#24324a]">Create subject</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Subject code *"
              value={form.subject_code}
              onChange={(e) => setForm((f) => ({ ...f, subject_code: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Subject name *"
              value={form.subject_name}
              onChange={(e) => setForm((f) => ({ ...f, subject_name: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Credits"
              type="number"
              value={form.credit_value}
              onChange={(e) => setForm((f) => ({ ...f, credit_value: e.target.value }))}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            />
          </div>
          <button type="submit" className="rounded-lg bg-[#0f2f66] text-white text-sm font-semibold px-4 py-2 hover:bg-[#1a3d7a]">
            Save subject
          </button>
        </form>

        <div className="bg-white rounded-xl border border-[#dde3eb] p-4 mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-[#24324a]">Subject offerings (year / semester)</h2>
          <p className="text-xs text-[#74839a]">
            Map each subject to an academic year and semester so assignments can be created under the correct offering.
          </p>
          <form onSubmit={createOffering} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Subject</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={offForm.subject_id}
                onChange={(e) => setOffForm((f) => ({ ...f, subject_id: e.target.value }))}
                required
              >
                <option value="">Select subject</option>
                {items.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_code} — {s.subject_name}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Academic year"
              value={offForm.academic_year}
              onChange={(e) => setOffForm((f) => ({ ...f, academic_year: e.target.value }))}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Semester"
              value={offForm.semester}
              onChange={(e) => setOffForm((f) => ({ ...f, semester: e.target.value }))}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
              placeholder="Intake (optional)"
              value={offForm.intake_name}
              onChange={(e) => setOffForm((f) => ({ ...f, intake_name: e.target.value }))}
            />
            <button
              type="submit"
              className="rounded-lg bg-[#3d6df2] text-white text-sm font-semibold px-4 py-2 hover:opacity-95 sm:col-span-2"
            >
              Add offering
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-[#dde3eb] overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-[#edf1f5] text-sm font-semibold text-[#24324a]">Offerings</div>
          {loading ? (
            <p className="p-4 text-sm text-[#74839a]">Loading…</p>
          ) : offerings.length === 0 ? (
            <p className="p-4 text-sm text-[#74839a]">No offerings yet. Add one above.</p>
          ) : (
            <ul className="divide-y divide-[#edf1f5]">
              {offerings.map((o) => (
                <li key={o.offering_id} className="px-4 py-3 text-sm">
                  <span className="font-semibold text-[#18243d]">{o.subject_code}</span>
                  <span className="text-[#5c6b80]">
                    {" "}
                    — {o.academic_year || "—"} / {o.semester || "—"}
                    {o.intake_name ? ` · ${o.intake_name}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#dde3eb] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#edf1f5] text-sm font-semibold text-[#24324a]">All subjects</div>
          {loading ? (
            <p className="p-4 text-sm text-[#74839a]">Loading…</p>
          ) : (
            <ul className="divide-y divide-[#edf1f5]">
              {items.map((s) => (
                <li key={s.subject_id} className="px-4 py-3 text-sm">
                  <span className="font-semibold text-[#18243d]">{s.subject_code}</span>
                  <span className="text-[#5c6b80]"> — {s.subject_name}</span>
                  {s.department && <span className="text-[#9aa8bb]"> · {s.department}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
