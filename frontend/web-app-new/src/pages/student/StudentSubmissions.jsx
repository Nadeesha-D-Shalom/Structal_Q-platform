import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentNavbar from "./StudentNavbar";

const API_BASE = process.env.REACT_APP_API_URL || "";

const getAuthHeaders = (json = false) => {
  const token = localStorage.getItem("auth_token");
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

const api = (path) => `${API_BASE}${path}`;

const formatCountdown = (sec) => {
  if (sec == null || sec <= 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const statusLabel = (lab) => {
  const map = {
    not_available: "Not available",
    open: "Open",
    open_late: "Open (late)",
    open_resubmit: "Open (resubmit)",
    submitted: "Submitted",
    resubmitted: "Resubmitted",
    closed: "Closed",
    evaluated: "Evaluated",
    published: "Published",
  };
  return map[lab.lab_status] || lab.lab_status || "—";
};

const statusClass = (lab) => {
  const st = lab.lab_status;
  if (st === "published") return "bg-emerald-100 text-emerald-800";
  if (st === "evaluated") return "bg-indigo-100 text-indigo-800";
  if (st === "open" || st === "open_late" || st === "open_resubmit")
    return "bg-sky-100 text-sky-800";
  if (st === "submitted" || st === "resubmitted") return "bg-amber-100 text-amber-900";
  if (st === "closed" || st === "not_available") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
};

export default function StudentSubmissions() {
  const [labs, setLabs] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ assessment_id: "", file: null });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [labsRes, sRes] = await Promise.all([
        fetch(api("/api/assessments/student/labs"), { headers: getAuthHeaders(false) }),
        fetch(api("/api/submissions/me"), { headers: getAuthHeaders(false) }),
      ]);
      const labsJson = await labsRes.json().catch(() => ({}));
      const sJson = await sRes.json().catch(() => ({}));
      const labList = labsJson?.data ?? labsJson?.recordset ?? [];
      setLabs(Array.isArray(labList) ? labList : []);
      const list = sJson?.data ?? sJson?.recordset ?? sJson;
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submittable = labs.filter((l) => l.can_submit);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assessment_id || !form.file) {
      setError("Choose an assessment and a PDF or DOCX file.");
      return;
    }
    const assessmentId = Number(String(form.assessment_id).trim());
    if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
      setError("Please select a valid assessment.");
      return;
    }
    const allowed = submittable.some((l) => Number(l.assessment_id) === assessmentId);
    if (!allowed) {
      setError("This assignment is not open for submission right now.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("assessment_id", String(assessmentId));
      fd.append("file", form.file);
      const res = await fetch(api("/api/submissions/upload"), {
        method: "POST",
        headers: getAuthHeaders(false),
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Upload failed");
      }
      setMessage(data.message || "Submission uploaded.");
      setForm({ assessment_id: "", file: null });
      await load();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <StudentNavbar activePage="Submissions" />

      <main className="px-4 sm:px-8 md:px-12 pt-6 sm:pt-8 pb-16 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-[#1b2b44]">My submissions</h1>
            <p className="text-[12px] text-[#7a8aa0] mt-1">
              Upload PDF or DOCX reports. Resubmissions create a new attempt when allowed by the assessment.
            </p>
          </div>
          <Link
            to="/student"
            className="text-[12px] text-blue-600 font-semibold hover:underline shrink-0"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="bg-white border rounded-[14px] shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-[14px] font-semibold text-[#1b2b44] mb-4">New submission</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Assessment</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-[13px] bg-[#f9fafb]"
                value={form.assessment_id}
                onChange={(e) => setForm((f) => ({ ...f, assessment_id: e.target.value }))}
              >
                <option value="">
                  {submittable.length === 0 ? "No assignments open for upload" : "Select assessment"}
                </option>
                {submittable.map((a) => (
                  <option key={a.assessment_id} value={a.assessment_id}>
                    {a.subject_name || "Subject"} — {a.assessment_title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">File (PDF / DOCX)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="w-full text-[13px]"
                onChange={(e) =>
                  setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))
                }
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={uploading || submittable.length === 0}
                className="px-5 py-2.5 rounded-lg bg-[#2563eb] text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
              {message && <span className="text-[12px] text-green-600">{message}</span>}
              {error && <span className="text-[12px] text-red-600">{error}</span>}
            </div>
          </form>
        </div>

        <div className="bg-white border rounded-[14px] shadow-sm overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#1b2b44]">Lab assignments</h2>
            {loading && <span className="text-[12px] text-gray-400">Loading…</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-[12px] min-w-[640px]">
              <thead className="bg-[#f9fafb] text-gray-500">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Subject</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Assessment</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Status</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Due</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Time left</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Mark</th>
                </tr>
              </thead>
              <tbody>
                {!loading && labs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No lab assignments found.
                    </td>
                  </tr>
                )}
                {labs.map((lab) => (
                  <tr key={lab.assessment_id} className="border-t border-gray-100">
                    <td className="px-3 sm:px-4 py-3 font-medium text-gray-800 max-w-[140px] truncate" title={lab.subject_name}>
                      {lab.subject_code ? `${lab.subject_code} ` : ""}
                      {lab.subject_name || "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 max-w-[200px]" title={lab.assessment_title}>
                      {lab.assessment_title}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${statusClass(lab)}`}
                      >
                        {statusLabel(lab)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-600 whitespace-nowrap">
                      {lab.due_date ? new Date(lab.due_date).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatCountdown(lab.seconds_remaining)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-800">
                      {lab.marking_status === "PUBLISHED" && lab.total_marks_awarded != null
                        ? Number(lab.total_marks_awarded).toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#1b2b44]">Submission history</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-[12px] min-w-[560px]">
              <thead className="bg-[#f9fafb] text-gray-500">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Subject</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Assessment</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Attempt</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Late</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">File</th>
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No submissions yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.submission_id} className="border-t border-gray-100">
                    <td className="px-3 sm:px-4 py-3 text-gray-700 whitespace-nowrap">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3">{r.subject_name}</td>
                    <td className="px-3 sm:px-4 py-3">{r.assessment_title}</td>
                    <td className="px-3 sm:px-4 py-3">{r.attempt_no}</td>
                    <td className="px-3 sm:px-4 py-3">
                      {r.is_late ? (
                        <span className="text-orange-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-green-600">No</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 max-w-[220px] truncate" title={r.original_file_name}>
                      {r.original_file_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
