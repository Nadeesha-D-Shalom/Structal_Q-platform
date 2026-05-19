import { useCallback, useEffect, useMemo, useState } from "react";
import LecturerNavbar from "./LecturerNavbar";

const API_BASE = process.env.REACT_APP_API_URL || "";

const authHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const initialForm = {
  offering_id: "",
  assessment_title: "",
  assessment_type: "COURSEWORK",
  total_marks: "",
  start_date: "",
  due_date: "",
  allow_resubmission: false,
  max_resubmissions: "0",
};

const getFormErrors = (data) => {
  const errors = {};
  if (!String(data.offering_id).trim()) {
    errors.offering_id = "Offering is required";
  }
  if (!data.assessment_title?.trim()) {
    errors.assessment_title = "Assessment title is required";
  }
  if (!String(data.total_marks ?? "").trim() || isNaN(Number(data.total_marks)) || Number(data.total_marks) <= 0) {
    errors.total_marks = "Total marks is required and must be greater than 0";
  }
  if (!String(data.start_date ?? "").trim()) {
    errors.start_date = "Start date is required";
  } else if (isNaN(new Date(data.start_date).getTime())) {
    errors.start_date = "Invalid start date";
  }
  if (!String(data.due_date ?? "").trim()) {
    errors.due_date = "Due date is required";
  } else if (isNaN(new Date(data.due_date).getTime())) {
    errors.due_date = "Invalid due date";
  } else if (data.start_date && new Date(data.due_date) <= new Date(data.start_date)) {
    errors.due_date = "Due date must be after start date";
  }
  if (data.allow_resubmission && (String(data.max_resubmissions ?? "").trim() === "" || isNaN(Number(data.max_resubmissions)) || Number(data.max_resubmissions) < 1)) {
    errors.max_resubmissions = "Max resubmissions must be at least 1";
  }
  return errors;
};

export default function LecturerAssignments() {
  const [items, setItems] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [formTouched, setFormTouched] = useState({});
  const [editTouched, setEditTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [editSubmitted, setEditSubmitted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(window.__assignmentToastTimeout);
    window.__assignmentToastTimeout = window.setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  const ToggleSwitch = ({ checked, onChange, disabled }) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? "bg-sky-600" : "bg-slate-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [assRes, offRes] = await Promise.all([
        fetch(`${API_BASE}/api/assessments`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/subjects/offerings`, { headers: authHeaders() }),
      ]);

      if (!assRes.ok || !offRes.ok) {
        const [assErrorData, offErrorData] = await Promise.all([getJsonSafe(assRes), getJsonSafe(offRes)]);
        const errorMessage = assErrorData?.error || offErrorData?.error || "Failed to load records.";
        showToast(errorMessage, "error");
        return;
      }

      const [assData, offData] = await Promise.all([assRes.json(), offRes.json()]);
      setItems(Array.isArray(assData) ? assData : assData?.data || []);
      setOfferings(Array.isArray(offData) ? offData : offData?.data || []);
    } catch (error) {
      console.error(error);
      showToast("Unable to load records", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const formErrors = useMemo(() => getFormErrors(form), [form]);
  const editErrors = useMemo(() => {
    if (mode === "edit") return getFormErrors(editForm);
    return {};
  }, [editForm, mode]);

  const isFormValid = Object.keys(formErrors).length === 0;
  const isEditValid = Object.keys(editErrors).length === 0;

  const stats = useMemo(() => ({
    totalAssignments: items.length,
    activeAssignments: items.filter(a => new Date(a.due_date) > new Date()).length,
  }), [items]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormTouched({});
    setSubmitted(false);
  };

  const create = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormTouched({
      offering_id: true,
      assessment_title: true,
      assessment_type: true,
      total_marks: true,
      start_date: true,
      due_date: true,
      max_resubmissions: true,
    });
    if (!isFormValid) return;

    setSaving(true);
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

      if (!res.ok) {
        const data = await getJsonSafe(res);
        showToast(data?.error || "Create assignment failed", "error");
        return;
      }

      showToast("Assignment created successfully", "success");
      resetForm();
      load();
    } catch (error) {
      console.error(error);
      showToast("Unable to create assignment", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item) => {
    if (!item) return;
    setSelected(item);
    setMode("edit");
    setEditTouched({});

    setEditForm({
      offering_id: item.offering_id || "",
      assessment_title: item.assessment_title || "",
      assessment_type: item.assessment_type || "",
      total_marks: item.total_marks || "",
      start_date: item.start_date || "",
      due_date: item.due_date || "",
      allow_resubmission: !!item.allow_resubmission,
      max_resubmissions: item.max_resubmissions || "0",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setMode("");
    setEditForm({});
    setEditTouched({});
    setEditSubmitted(false);
  };

  const saveEdit = async () => {
    setEditSubmitted(true);
    setEditTouched({
      offering_id: true,
      assessment_title: true,
      assessment_type: true,
      total_marks: true,
      start_date: true,
      due_date: true,
      max_resubmissions: true,
    });

    if (!isEditValid) return;
    if (!selected) {
      showToast("No record selected to save", "error");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessments/${selected.assessment_id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          offering_id: Number(editForm.offering_id),
          assessment_title: editForm.assessment_title.trim(),
          assessment_type: editForm.assessment_type.trim(),
          total_marks: editForm.total_marks ? Number(editForm.total_marks) : null,
          start_date: editForm.start_date || null,
          due_date: editForm.due_date || null,
          allow_resubmission: !!editForm.allow_resubmission,
          max_resubmissions: editForm.max_resubmissions === "" ? null : Number(editForm.max_resubmissions),
          late_policy_enabled: false,
          grace_minutes: 0,
        }),
      });

      if (!res.ok) {
        const data = await getJsonSafe(res);
        showToast(data?.error || "Update failed", "error");
        return;
      }

      showToast("Update saved", "success");
      closeModal();
      load();
    } catch (error) {
      console.error(error);
      showToast("Unable to save update", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteItem = (id) => setConfirmDelete(id);

  const confirmDeleteItem = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${API_BASE}/api/assessments/${confirmDelete}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) {
        const data = await getJsonSafe(res);
        showToast(data?.error || "Delete failed", "error");
        return;
      }
      showToast("Assignment deleted", "success");
      setConfirmDelete(null);
      load();
    } catch (error) {
      console.error(error);
      showToast("Unable to delete assignment", "error");
    }
  };

  const tableRowClass = "border-b border-slate-200 hover:bg-slate-50 transition-colors";
  const inputClass = "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        .toast-slide { animation: toastSlide 0.3s ease-out; }
        @keyframes toastSlide { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <LecturerNavbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Lecturer dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Assignments Management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Create and manage assignments for subject offerings with validation and real-time feedback.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Assignments</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.totalAssignments}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Active Assignments</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.activeAssignments}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Last refresh</p>
              <p className="mt-4 text-xl font-semibold text-slate-900">{loading ? "Refreshing..." : "Live"}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Quick actions</p>
              <p className="mt-4 text-sm text-slate-600">Use the form below to add new assignments.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Create a new assignment</h2>
              <p className="mt-1 text-sm text-slate-500">Link to an existing subject offering and set assessment details.</p>
            </div>
          </div>

          <form onSubmit={create} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Offering ID</label>
                <select
                  value={form.offering_id}
                  onChange={(e) => handleFormChange("offering_id", e.target.value)}
                  className={`${inputClass} ${(formTouched.offering_id || submitted) && formErrors.offering_id ? "border-rose-500 ring-rose-200" : ""}`}
                >
                  <option value="">Select offering</option>
                  {offerings.map((offering) => (
                    <option key={offering.offering_id} value={offering.offering_id}>
                      {offering.subject_name} - {offering.academic_year} {offering.semester}
                    </option>
                  ))}
                </select>
                {(formTouched.offering_id || submitted) && formErrors.offering_id && (
                  <p className="mt-2 text-sm text-rose-600">{formErrors.offering_id}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Assessment Title</label>
                <input
                  type="text"
                  value={form.assessment_title}
                  onChange={(e) => handleFormChange("assessment_title", e.target.value)}
                  className={`${inputClass} ${(formTouched.assessment_title || submitted) && formErrors.assessment_title ? "border-rose-500 ring-rose-200" : ""}`}
                />
                {(formTouched.assessment_title || submitted) && formErrors.assessment_title && (
                  <p className="mt-2 text-sm text-rose-600">{formErrors.assessment_title}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Assessment Type</label>
                <select
                  value={form.assessment_type}
                  onChange={(e) => handleFormChange("assessment_type", e.target.value)}
                  className={`${inputClass} ${(formTouched.assessment_type || submitted) && formErrors.assessment_type ? "border-rose-500 ring-rose-200" : ""}`}
                >
                  <option value="COURSEWORK">Coursework</option>
                  <option value="EXAM">Exam</option>
                  <option value="PROJECT">Project</option>
                </select>
                {(formTouched.assessment_type || submitted) && formErrors.assessment_type && (
                  <p className="mt-2 text-sm text-rose-600">{formErrors.assessment_type}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Total Marks</label>
                <input
                  type="number"
                  value={form.total_marks}
                  onChange={(e) => handleFormChange("total_marks", e.target.value)}
                  className={`${inputClass} ${(formTouched.total_marks || submitted) && formErrors.total_marks ? "border-rose-500 ring-rose-200" : ""}`}
                />
                {(formTouched.total_marks || submitted) && formErrors.total_marks && (
                  <p className="mt-2 text-sm text-rose-600">{formErrors.total_marks}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Max Resubmissions</label>
                <div className={`transition-all duration-200 ${form.allow_resubmission ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"}`}>
                  <input
                    type="number"
                    min="0"
                    value={form.max_resubmissions}
                    onChange={(e) => handleFormChange("max_resubmissions", e.target.value)}
                    className={`${inputClass} ${(formTouched.max_resubmissions || submitted) && formErrors.max_resubmissions ? "border-rose-500 ring-rose-200" : ""}`}
                    disabled={!form.allow_resubmission}
                  />
                  {(formTouched.max_resubmissions || submitted) && formErrors.max_resubmissions && (
                    <p className="mt-2 text-sm text-rose-600">{formErrors.max_resubmissions}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => handleFormChange("start_date", e.target.value)}
                  className={`${inputClass} ${(formTouched.start_date || submitted) && formErrors.start_date ? "border-rose-500 ring-rose-200" : ""}`}
                />
                {(formTouched.start_date || submitted) && formErrors.start_date && (
                  <p className="mt-2 text-sm text-rose-600">{formErrors.start_date}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Due Date</label>
                <input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => handleFormChange("due_date", e.target.value)}
                  className={`${inputClass} ${(formTouched.due_date || submitted) && formErrors.due_date ? "border-rose-500 ring-rose-200" : ""}`}
                />
                {(formTouched.due_date || submitted) && formErrors.due_date && (
                  <p className="mt-2 text-sm text-rose-600">{formErrors.due_date}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3">
                <ToggleSwitch checked={form.allow_resubmission} onChange={(v) => handleFormChange("allow_resubmission", v)} />
                <span className="text-sm text-slate-700">Allow resubmission</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!isFormValid || saving}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
                  isFormValid && !saving
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                {saving ? "Creating..." : "Create assignment"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Assignments</h2>
              <p className="mt-1 text-sm text-slate-500">View and manage all assignment records.</p>
            </div>
            <div className="text-sm text-slate-500">
              {items.length} assignment{items.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <table className="w-full min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-4">ID</th>
                  <th className="px-4 py-4">Title</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Subject</th>
                  <th className="px-4 py-4">Due Date</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading assignments...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      <div className="mx-auto inline-flex flex-col items-center gap-3 text-slate-500">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📝</div>
                        <div className="text-sm font-medium">No assignments created yet</div>
                        <div className="text-sm">Add an assignment using the form above.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.assessment_id} className={`${tableRowClass}`}>
                      <td className="px-4 py-4 text-slate-600">{item.assessment_id}</td>
                      <td className="px-4 py-4 font-medium text-slate-900">{item.assessment_title}</td>
                      <td className="px-4 py-4 text-slate-700">{item.assessment_type}</td>
                      <td className="px-4 py-4 text-slate-700">{item.subject_name || "—"}</td>
                      <td className="px-4 py-4 text-slate-700">{item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                            aria-label="Edit assignment"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.assessment_id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-rose-600 shadow-sm transition hover:bg-rose-50"
                            aria-label="Delete assignment"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Edit assignment</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Update Assignment</h2>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Offering ID</label>
                <select
                  value={editForm.offering_id || ""}
                  onChange={(e) => handleEditChange("offering_id", e.target.value)}
                  className={`${inputClass} ${(editTouched.offering_id || editSubmitted) && editErrors.offering_id ? "border-rose-500 ring-rose-200" : ""}`}
                >
                  <option value="">Select offering</option>
                  {offerings.map((offering) => (
                    <option key={offering.offering_id} value={offering.offering_id}>
                      {offering.subject_name} - {offering.academic_year} {offering.semester}
                    </option>
                  ))}
                </select>
                {(editTouched.offering_id || editSubmitted) && editErrors.offering_id && (
                  <p className="mt-2 text-sm text-rose-600">{editErrors.offering_id}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Assessment Title</label>
                <input
                  type="text"
                  value={editForm.assessment_title || ""}
                  onChange={(e) => handleEditChange("assessment_title", e.target.value)}
                  className={`${inputClass} ${(editTouched.assessment_title || editSubmitted) && editErrors.assessment_title ? "border-rose-500 ring-rose-200" : ""}`}
                />
                {(editTouched.assessment_title || editSubmitted) && editErrors.assessment_title && (
                  <p className="mt-2 text-sm text-rose-600">{editErrors.assessment_title}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Assessment Type</label>
                  <select
                    value={editForm.assessment_type || ""}
                    onChange={(e) => handleEditChange("assessment_type", e.target.value)}
                    className={`${inputClass} ${(editTouched.assessment_type || editSubmitted) && editErrors.assessment_type ? "border-rose-500 ring-rose-200" : ""}`}
                  >
                    <option value="COURSEWORK">Coursework</option>
                    <option value="EXAM">Exam</option>
                    <option value="PROJECT">Project</option>
                  </select>
                  {(editTouched.assessment_type || editSubmitted) && editErrors.assessment_type && (
                    <p className="mt-2 text-sm text-rose-600">{editErrors.assessment_type}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Total Marks</label>
                  <input
                    type="number"
                    value={editForm.total_marks || ""}
                    onChange={(e) => handleEditChange("total_marks", e.target.value)}
                    className={`${inputClass} ${(editTouched.total_marks || editSubmitted) && editErrors.total_marks ? "border-rose-500 ring-rose-200" : ""}`}
                  />
                  {(editTouched.total_marks || editSubmitted) && editErrors.total_marks && (
                    <p className="mt-2 text-sm text-rose-600">{editErrors.total_marks}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
                  <input
                    type="datetime-local"
                    value={editForm.start_date || ""}
                    onChange={(e) => handleEditChange("start_date", e.target.value)}
                    className={`${inputClass} ${(editTouched.start_date || editSubmitted) && editErrors.start_date ? "border-rose-500 ring-rose-200" : ""}`}
                  />
                  {(editTouched.start_date || editSubmitted) && editErrors.start_date && (
                    <p className="mt-2 text-sm text-rose-600">{editErrors.start_date}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Due Date</label>
                  <input
                    type="datetime-local"
                    value={editForm.due_date || ""}
                    onChange={(e) => handleEditChange("due_date", e.target.value)}
                    className={`${inputClass} ${(editTouched.due_date || editSubmitted) && editErrors.due_date ? "border-rose-500 ring-rose-200" : ""}`}
                  />
                  {(editTouched.due_date || editSubmitted) && editErrors.due_date && (
                    <p className="mt-2 text-sm text-rose-600">{editErrors.due_date}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3">
                  <ToggleSwitch checked={editForm.allow_resubmission} onChange={(v) => handleEditChange("allow_resubmission", v)} />
                  <span className="text-sm text-slate-700">Allow resubmission</span>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Max Resubmissions</label>
                <div className={`transition-all duration-200 ${editForm.allow_resubmission ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"}`}>
                  <input
                    type="number"
                    min="0"
                    value={editForm.max_resubmissions || ""}
                    onChange={(e) => handleEditChange("max_resubmissions", e.target.value)}
                    className={`${inputClass} ${(editTouched.max_resubmissions || editSubmitted) && editErrors.max_resubmissions ? "border-rose-500 ring-rose-200" : ""}`}
                    disabled={!editForm.allow_resubmission}
                  />
                  {(editTouched.max_resubmissions || editSubmitted) && editErrors.max_resubmissions && (
                    <p className="mt-2 text-sm text-rose-600">{editErrors.max_resubmissions}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={saveEdit}
                disabled={!isEditValid || editSaving}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
                  isEditValid && !editSaving
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                {editSaving ? "Updating..." : "Save changes"}
              </button>
              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">Confirm delete</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Remove this assignment?</h2>
              <p className="mt-2 text-sm text-slate-500">This action is permanent. Please confirm to continue.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={confirmDeleteItem}
                className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-xs rounded-3xl bg-slate-900 px-5 py-4 text-sm text-white shadow-2xl toast-slide">
          <div className="flex items-start justify-between gap-4">
            <p className="font-semibold">{toast.type === "error" ? "Error" : "Success"}</p>
            <p className="mt-1 text-sm text-slate-100">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close notification"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

