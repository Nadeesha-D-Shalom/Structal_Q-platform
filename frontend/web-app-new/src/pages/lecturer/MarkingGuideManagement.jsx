import { useCallback, useEffect, useMemo, useState } from "react";
import LecturerNavbar from "./LecturerNavbar";
import { appConfirm } from "../../components/UIFeedback/appNotify";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function MarkingGuideManagement() {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [guides, setGuides] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);

  const [form, setForm] = useState({
    assessment_id: "",
    title: "",
    version_no: "",
    description: "",
    order_sensitive: false,
    requires_diagram_check: true,
    diagram_types_expected: "ER,UML,DFD",
    file: null,
  });

  const [fileName, setFileName] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [guideRes, assessmentRes] = await Promise.all([
        fetch(`${API_BASE}/api/marking-guides`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/assessments`, { headers: getAuthHeaders() }),
      ]);
      const guidePayload = await guideRes.json();
      const assessmentPayload = await assessmentRes.json();
      setGuides(Array.isArray(guidePayload?.data) ? guidePayload.data : []);
      setAssessments(Array.isArray(assessmentPayload) ? assessmentPayload : []);
    } catch {
      setError("Failed to load marking guide data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const groupedGuides = useMemo(() => {
    const map = new Map();
    guides.forEach((guide) => {
      const key = `${guide.assessment_id}-${guide.title}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(guide);
    });
    return Array.from(map.values()).map((items) =>
      items.sort((a, b) => Number(b.version_no || 0) - Number(a.version_no || 0))
    );
  }, [guides]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm({
      assessment_id: "",
      title: "",
      version_no: "",
      description: "",
      order_sensitive: false,
      requires_diagram_check: true,
      diagram_types_expected: "ER,UML,DFD",
      file: null,
    });
    setFileName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assessment_id || !form.title || !form.file) {
      setError("Assessment, title, and guide file are required.");
      return;
    }
    const assessmentId = Number(String(form.assessment_id).trim());
    if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
      setError("Please select a valid assessment.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      const payload = new FormData();
      payload.append("assessment_id", String(assessmentId));
      payload.append("title", form.title);
      payload.append("version_no", form.version_no || "");
      payload.append("description", form.description);
      payload.append("order_sensitive", String(form.order_sensitive));
      payload.append("requires_diagram_check", String(form.requires_diagram_check));
      payload.append("diagram_types_expected", form.diagram_types_expected);
      payload.append("file", form.file);
      const res = await fetch(`${API_BASE}/api/marking-guides/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: payload,
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || result.message || "Upload failed");
      setMessage("Marking guide uploaded successfully.");
      resetForm();
      await loadData();
    } catch (e2) {
      setError(e2.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (guideId) => {
    if (!(await appConfirm(`Deactivate marking guide #${guideId}?`, { title: "Deactivate guide", confirmLabel: "Deactivate", variant: "warning" }))) return;
    try {
      const res = await fetch(`${API_BASE}/api/marking-guides/${guideId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || result.message || "Deactivate failed");
      setMessage("Marking guide deactivated.");
      await loadData();
    } catch (e) {
      setError(e.message || "Deactivate failed.");
    }
  };

  const handlePrepareNewVersion = (guide) => {
    setForm({
      assessment_id: guide.assessment_id || "",
      title: guide.title || guide.guide_name || "",
      version_no: String((Number(guide.version_no || 0) + 1) || 1),
      description: guide.description || "",
      order_sensitive: !!guide.order_sensitive,
      requires_diagram_check: !!guide.requires_diagram_check,
      diagram_types_expected: Array.isArray(guide.diagram_types_expected)
        ? guide.diagram_types_expected.join(",")
        : "ER,UML,DFD",
      file: null,
    });
    setFileName("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreview = async (guide) => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/marking-guides/file/${guide.file_id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Preview failed");
      }
      const blob = await res.blob();
      const previewUrl = window.URL.createObjectURL(blob);
      window.open(previewUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(previewUrl), 60000);
    } catch (err) {
      setError(err.message || "Preview failed.");
    }
  };

  const selectedAssessment = assessments.find(
    (a) => String(a.assessment_id) === String(form.assessment_id)
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans">
      <LecturerNavbar />

      <main className="max-w-5xl mx-auto px-5 py-8">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-800 tracking-tight">Marking Guide Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Upload, version, and manage marking guides linked to assessments.</p>
        </div>

        {/* Alerts */}
        {message && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 mb-4">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {message}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 mb-4">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* ── UPLOAD SECTION ── */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Upload Marking Guide</h2>
              <p className="text-xs text-gray-400 mt-0.5">Create a new guide or upload a replacement version.</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md px-2.5 py-1.5 transition-colors hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4">
            {/* Row 1: Assessment + Version */}
            <div className="grid grid-cols-[1fr_120px] gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Assessment</label>
                <select
                  value={form.assessment_id}
                  onChange={(e) => updateForm("assessment_id", e.target.value)}
                  className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                >
                  <option value="">Select assessment</option>
                  {assessments.map((a) => (
                    <option key={a.assessment_id} value={a.assessment_id}>
                      {a.assessment_id} - {a.assessment_title}
                      {a.subject_name ? ` (${a.subject_name})` : ""}
                    </option>
                  ))}
                </select>
                {selectedAssessment && (
                  <p className="text-[11px] text-gray-400 mt-1 truncate">
                    Found: {selectedAssessment.assessment_title}{selectedAssessment.subject_name ? ` — ${selectedAssessment.subject_name}` : ""}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Version</label>
                <input
                  type="number"
                  min="1"
                  value={form.version_no}
                  onChange={(e) => updateForm("version_no", e.target.value)}
                  placeholder="Auto"
                  className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </div>
            </div>

            {/* Row 2: Title */}
            <div className="mb-3">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Guide Title</label>
              <input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="e.g. Final Report Marking Guide"
                className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              />
            </div>

            {/* Row 3: Description */}
            <div className="mb-3">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Guide summary, scope, and marking notes…"
                rows={3}
                className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition resize-none"
              />
            </div>

            {/* Row 4: Diagram Types + File */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Expected Diagram Types</label>
                <input
                  value={form.diagram_types_expected}
                  onChange={(e) => updateForm("diagram_types_expected", e.target.value)}
                  placeholder="ER,UML,DFD"
                  className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Guide File</label>
                <label className="flex items-center gap-2 w-full text-xs text-gray-500 bg-gray-50 border border-gray-200 border-dashed rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="truncate">{fileName || "Choose PDF or DOCX…"}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      updateForm("file", f);
                      setFileName(f ? f.name : "");
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Row 5: Checkboxes + Submit */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.order_sensitive}
                    onChange={(e) => updateForm("order_sensitive", e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-blue-500"
                  />
                  Order Sensitive
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.requires_diagram_check}
                    onChange={(e) => updateForm("requires_diagram_check", e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-blue-500"
                  />
                  Requires Diagram Check
                </label>
              </div>
              <div className="flex items-center gap-3">
                {selectedAssessment && (
                  <span className="text-[11px] text-gray-400 hidden sm:block">
                    → {selectedAssessment.assessment_title}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 transition-colors"
                >
                  {submitting ? "Uploading…" : "Upload Guide"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* ── EXISTING GUIDES SECTION ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Existing Guides</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {groupedGuides.length} guide{groupedGuides.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-8 text-center">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Loading guides…</p>
            </div>
          ) : groupedGuides.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-10 text-center">
              <svg className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs text-gray-400">No marking guides uploaded yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {groupedGuides.map((versions) => {
                const latest = versions[0];
                const groupKey = `${latest.assessment_id}-${latest.title}`;
                const isOpen = expandedGroup === groupKey;

                return (
                  <div key={groupKey} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Group Header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedGroup(isOpen ? null : groupKey)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{latest.title}</p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {latest.assessment_title}{latest.subject_name ? ` — ${latest.subject_name}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                          v{latest.version_no || 1} · {versions.length} version{versions.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePrepareNewVersion(latest); }}
                          className="text-[11px] text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-md px-2.5 py-1 transition-colors"
                        >
                          New Version
                        </button>
                        <svg
                          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Versions List */}
                    {isOpen && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {versions.map((guide, idx) => (
                          <div
                            key={guide.marking_guide_id}
                            className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-gray-50/60 transition-colors"
                          >
                            {/* Version badge */}
                            <div className="flex items-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                idx === 0
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : "bg-gray-100 text-gray-400"
                              }`}>
                                v{guide.version_no || 1}
                              </span>
                            </div>

                            {/* File info */}
                            <div className="min-w-0">
                              <p className="text-xs text-gray-700 font-medium truncate">
                                {guide.original_file_name || "Guide file"}
                              </p>
                              {guide.description && (
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">{guide.description}</p>
                              )}
                            </div>

                            {/* Diagram check */}
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400 mb-0.5">Diagram</p>
                              <span className={`text-[10px] font-semibold ${guide.requires_diagram_check ? "text-blue-500" : "text-gray-400"}`}>
                                {guide.requires_diagram_check ? "Required" : "Optional"}
                              </span>
                            </div>

                            {/* Date */}
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400 mb-0.5">Created</p>
                              <span className="text-[11px] text-gray-600">
                                {guide.created_at ? new Date(guide.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handlePreview(guide)}
                                className="text-[11px] text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-md px-2.5 py-1 transition-colors"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeactivate(guide.marking_guide_id)}
                                className="text-[11px] text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-md px-2.5 py-1 transition-colors"
                              >
                                Deactivate
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}