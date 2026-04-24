import { useCallback, useEffect, useMemo, useState } from "react";
import LecturerNavbar from "./LecturerNavbar";

const API_BASE = "http://localhost:3000";

const authHeaders = () => ({
  "Content-Type": "application/json",
});

const getJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const initialSubjectForm = {
  subject_code: "",
  subject_name: "",
  credit_value: "",
  department: "",
};

const initialOfferingForm = {
  subject_id: "",
  academic_year: "",
  semester: "",
  intake_name: "",
};

const getSubjectErrors = (data) => {
  const errors = {};
  if (!data.subject_code?.trim()) errors.subject_code = "Subject code is required";
  if (!data.subject_name?.trim()) errors.subject_name = "Subject name is required";
  if (!String(data.credit_value ?? "").trim()) {
    errors.credit_value = "Credits are required";
  } else if (isNaN(Number(data.credit_value))) {
    errors.credit_value = "Credits must be a number";
  }
  if (!data.department?.trim()) errors.department = "Department is required";
  return errors;
};

const getOfferingErrors = (data, { allowExistingSubject = false } = {}) => {
  const errors = {};
  if (!allowExistingSubject && !data.subject_id) errors.subject_id = "Select subject";
  if (!String(data.academic_year || "").trim()) errors.academic_year = "Year is required";
  if (!String(data.semester || "").trim()) errors.semester = "Semester is required";
  if (!String(data.intake_name || "").trim()) errors.intake_name = "Intake is required";
  return errors;
};

export default function LecturerSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(initialSubjectForm);
  const [offForm, setOffForm] = useState(initialOfferingForm);
  const [editForm, setEditForm] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const deleteItem = (id, type) => setConfirmDelete({ id, type });

  const [subjectTouched, setSubjectTouched] = useState({});
  const [offeringTouched, setOfferingTouched] = useState({});
  const [editTouched, setEditTouched] = useState({});

  const [subjectSaving, setSubjectSaving] = useState(false);
  const [offeringSaving, setOfferingSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(window.__subjectToastTimeout);
    window.__subjectToastTimeout = window.setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, offRes] = await Promise.all([
        fetch(`${API_BASE}/api/subjects`),
        fetch(`${API_BASE}/api/subjects/offerings`),
      ]);

      if (!subRes.ok || !offRes.ok) {
        const [subErrorData, offErrorData] = await Promise.all([getJsonSafe(subRes), getJsonSafe(offRes)]);
        const errorMessage = subErrorData?.error || offErrorData?.error || "Failed to load records.";
        showToast(errorMessage, "error");
        return;
      }

      const [subData, offData] = await Promise.all([subRes.json(), offRes.json()]);
      setSubjects(Array.isArray(subData) ? subData : subData?.data || []);
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

  const subjectErrors = useMemo(() => getSubjectErrors(form), [form]);
  const offeringErrors = useMemo(() => getOfferingErrors(offForm), [offForm]);
  const editErrors = useMemo(() => {
    if (mode === "subject") return getSubjectErrors(editForm);
    if (mode === "offering") return getOfferingErrors(editForm, { allowExistingSubject: true });
    return {};
  }, [editForm, mode]);

  const isSubjectValid = Object.keys(subjectErrors).length === 0;
  const isOfferingValid = Object.keys(offeringErrors).length === 0;
  const isEditValid = Object.keys(editErrors).length === 0;

  const stats = useMemo(() => ({
    totalSubjects: subjects.length,
    totalOfferings: offerings.length,
  }), [subjects, offerings]);

  const handleSubjectChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOfferingChange = (field, value) => {
    setOffForm((prev) => ({ ...prev, [field]: value }));
  };

  const createSubject = async (e) => {
    e.preventDefault();
    setSubjectTouched({ subject_code: true, subject_name: true, credit_value: true, department: true });
    if (!isSubjectValid) return;

    setSubjectSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/subjects`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await getJsonSafe(res);
        showToast(data?.error || "Create subject failed", "error");
        return;
      }

      showToast("Subject created successfully", "success");
      setForm(initialSubjectForm);
      setSubjectTouched({});
      load();
    } catch (error) {
      console.error(error);
      showToast("Unable to create subject", "error");
    } finally {
      setSubjectSaving(false);
    }
  };

  const createOffering = async (e) => {
    e.preventDefault();
    setOfferingTouched({ subject_id: true, academic_year: true, semester: true, intake_name: true });
    if (!isOfferingValid) return;

    setOfferingSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/subjects/offerings`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(offForm),
      });

      if (!res.ok) {
        const data = await getJsonSafe(res);
        showToast(data?.error || "Create offering failed", "error");
        return;
      }

      showToast("Offering created successfully", "success");
      setOffForm(initialOfferingForm);
      setOfferingTouched({});
      load();
    } catch (error) {
      console.error(error);
      showToast("Unable to create offering", "error");
    } finally {
      setOfferingSaving(false);
    }
  };

  const openEdit = (item, type) => {
    if (!item) return;
    setSelected(item);
    setMode(type);
    setEditTouched({});

    if (type === "subject") {
      setEditForm({
        subject_code: item.subject_code || "",
        subject_name: item.subject_name || "",
        credit_value: item.credit_value || "",
        department: item.department || "",
      });
    }

    if (type === "offering") {
      setEditForm({
        academic_year: item.academic_year || "",
        semester: item.semester || "",
        intake_name: item.intake_name || "",
      });
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setMode("");
    setEditForm({});
    setEditTouched({});
  };

  const saveEdit = async () => {
    setEditTouched({
      ...editTouched,
      ...(mode === "subject"
        ? { subject_code: true, subject_name: true, credit_value: true, department: true }
        : { academic_year: true, semester: true, intake_name: true }),
    });

    if (!isEditValid) return;
    if (!selected) {
      showToast("No record selected to save", "error");
      return;
    }

    setEditSaving(true);
    try {
      let res;
      if (mode === "subject") {
        res = await fetch(`${API_BASE}/api/subjects/${selected.subject_id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(editForm),
        });
      }

      if (mode === "offering") {
        res = await fetch(`${API_BASE}/api/subjects/offerings/${selected.offering_id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(editForm),
        });
      }

      if (!res) {
        showToast("Invalid edit type", "error");
        return;
      }

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

  const confirmDeleteItem = async () => {
    if (!confirmDelete) return;
    const { id, type } = confirmDelete;

    try {
      const url = type === "subject"
        ? `${API_BASE}/api/subjects/${id}`
        : `${API_BASE}/api/subjects/offerings/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const data = await getJsonSafe(res);
        showToast(data?.error || "Delete failed", "error");
        return;
      }
      showToast("Record deleted", "success");
      setConfirmDelete(null);
      load();
    } catch (error) {
      console.error(error);
      showToast("Unable to delete record", "error");
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
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Subject Management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Manage subjects, offerings, and workflow with instant form validation, clean actions, and summary metrics.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Subjects</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.totalSubjects}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Offerings</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.totalOfferings}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Last refresh</p>
              <p className="mt-4 text-xl font-semibold text-slate-900">{loading ? "Refreshing..." : "Live"}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Quick actions</p>
              <p className="mt-4 text-sm text-slate-600">Use the forms below to add subjects or offerings.</p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Create a new subject</h2>
                <p className="mt-1 text-sm text-slate-500">Add a subject record before creating an offering.</p>
              </div>
            </div>

            <form onSubmit={createSubject} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subject Code</label>
                <input
                  type="text"
                  value={form.subject_code}
                  onChange={(e) => handleSubjectChange("subject_code", e.target.value)}
                  onBlur={() => setSubjectTouched((prev) => ({ ...prev, subject_code: true }))}
                  className={`${inputClass} ${subjectTouched.subject_code && subjectErrors.subject_code ? "border-rose-500 ring-rose-200" : ""}`}
                />
                {subjectTouched.subject_code && subjectErrors.subject_code && (
                  <p className="mt-2 text-sm text-rose-600">{subjectErrors.subject_code}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subject Name</label>
                <input
                  type="text"
                  value={form.subject_name}
                  onChange={(e) => handleSubjectChange("subject_name", e.target.value)}
                  onBlur={() => setSubjectTouched((prev) => ({ ...prev, subject_name: true }))}
                  className={`${inputClass} ${subjectTouched.subject_name && subjectErrors.subject_name ? "border-rose-500 ring-rose-200" : ""}`}
                />
                {subjectTouched.subject_name && subjectErrors.subject_name && (
                  <p className="mt-2 text-sm text-rose-600">{subjectErrors.subject_name}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Credits</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={form.credit_value}
                    onChange={(e) => handleSubjectChange("credit_value", e.target.value)}
                    onBlur={() => setSubjectTouched((prev) => ({ ...prev, credit_value: true }))}
                    className={`${inputClass} ${subjectTouched.credit_value && subjectErrors.credit_value ? "border-rose-500 ring-rose-200" : ""}`}
                  />
                  {subjectTouched.credit_value && subjectErrors.credit_value && (
                    <p className="mt-2 text-sm text-rose-600">{subjectErrors.credit_value}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => handleSubjectChange("department", e.target.value)}
                    onBlur={() => setSubjectTouched((prev) => ({ ...prev, department: true }))}
                    className={`${inputClass} ${subjectTouched.department && subjectErrors.department ? "border-rose-500 ring-rose-200" : ""}`}
                  />
                  {subjectTouched.department && subjectErrors.department && (
                    <p className="mt-2 text-sm text-rose-600">{subjectErrors.department}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={!isSubjectValid || subjectSaving}
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
                    isSubjectValid && !subjectSaving
                      ? "bg-sky-600 hover:bg-sky-700"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {subjectSaving ? "Saving..." : "Save subject"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(initialSubjectForm);
                    setSubjectTouched({});
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Create an offering</h2>
              <p className="mt-1 text-sm text-slate-500">Link an existing subject to a year, semester, and intake.</p>
            </div>

            <form onSubmit={createOffering} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
                <select
                  value={offForm.subject_id}
                  onChange={(e) => handleOfferingChange("subject_id", e.target.value)}
                  onBlur={() => setOfferingTouched((prev) => ({ ...prev, subject_id: true }))}
                  className={`${inputClass} ${offeringTouched.subject_id && offeringErrors.subject_id ? "border-rose-500 ring-rose-200" : ""}`}
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name || subject.subject_code}
                    </option>
                  ))}
                </select>
                {offeringTouched.subject_id && offeringErrors.subject_id && (
                  <p className="mt-2 text-sm text-rose-600">{offeringErrors.subject_id}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Academic Year</label>
                  <select
                    value={offForm.academic_year}
                    onChange={(e) => handleOfferingChange("academic_year", e.target.value)}
                    onBlur={() => setOfferingTouched((prev) => ({ ...prev, academic_year: true }))}
                    className={`${inputClass} ${offeringTouched.academic_year && offeringErrors.academic_year ? "border-rose-500 ring-rose-200" : ""}`}
                  >
                    <option value="">Select year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                  {offeringTouched.academic_year && offeringErrors.academic_year && (
                    <p className="mt-2 text-sm text-rose-600">{offeringErrors.academic_year}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Semester</label>
                  <select
                    value={offForm.semester}
                    onChange={(e) => handleOfferingChange("semester", e.target.value)}
                    onBlur={() => setOfferingTouched((prev) => ({ ...prev, semester: true }))}
                    className={`${inputClass} ${offeringTouched.semester && offeringErrors.semester ? "border-rose-500 ring-rose-200" : ""}`}
                  >
                    <option value="">Select semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                  {offeringTouched.semester && offeringErrors.semester && (
                    <p className="mt-2 text-sm text-rose-600">{offeringErrors.semester}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Intake</label>
                  <input
                    type="text"
                    value={offForm.intake_name}
                    onChange={(e) => handleOfferingChange("intake_name", e.target.value)}
                    onBlur={() => setOfferingTouched((prev) => ({ ...prev, intake_name: true }))}
                    className={`${inputClass} ${offeringTouched.intake_name && offeringErrors.intake_name ? "border-rose-500 ring-rose-200" : ""}`}
                  />
                  {offeringTouched.intake_name && offeringErrors.intake_name && (
                    <p className="mt-2 text-sm text-rose-600">{offeringErrors.intake_name}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={!isOfferingValid || offeringSaving}
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
                    isOfferingValid && !offeringSaving
                      ? "bg-sky-600 hover:bg-sky-700"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {offeringSaving ? "Saving..." : "Save offering"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOffForm(initialOfferingForm);
                    setOfferingTouched({});
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="mt-8 grid gap-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Subjects</h2>
                <p className="mt-1 text-sm text-slate-500">View and manage all subject records.</p>
              </div>
              <div className="text-sm text-slate-500">
                {subjects.length} subject{subjects.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-slate-200">
              <table className="w-full min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-4">ID</th>
                    <th className="px-4 py-4">Code</th>
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Credits</th>
                    <th className="px-4 py-4">Department</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading subjects...</td>
                    </tr>
                  ) : subjects.length === 0 ? (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        <div className="mx-auto inline-flex flex-col items-center gap-3 text-slate-500">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📚</div>
                          <div className="text-sm font-medium">No subjects created yet</div>
                          <div className="text-sm">Add a subject using the form above.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    subjects.map((subject) => (
                      <tr key={subject.subject_id} className={`${tableRowClass}`}>
                        <td className="px-4 py-4 text-slate-600">{subject.subject_id}</td>
                        <td className="px-4 py-4 font-medium text-slate-900">{subject.subject_code}</td>
                        <td className="px-4 py-4 text-slate-700">{subject.subject_name}</td>
                        <td className="px-4 py-4 text-slate-700">{subject.credit_value}</td>
                        <td className="px-4 py-4 text-slate-700">{subject.department}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(subject, "subject")}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                              aria-label="Edit subject"
                            >
                              <i className="fa-solid fa-pen-to-square" />
                            </button>
                            <button
                              onClick={() => deleteItem(subject.subject_id, "subject")}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-rose-600 shadow-sm transition hover:bg-rose-50"
                              aria-label="Delete subject"
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

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Offerings</h2>
                <p className="mt-1 text-sm text-slate-500">Review offerings linked to subjects, semesters, and intakes.</p>
              </div>
              <div className="text-sm text-slate-500">
                {offerings.length} offering{offerings.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-slate-200">
              <table className="w-full min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-4">ID</th>
                    <th className="px-4 py-4">Subject</th>
                    <th className="px-4 py-4">Year</th>
                    <th className="px-4 py-4">Semester</th>
                    <th className="px-4 py-4">Intake</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading offerings...</td>
                    </tr>
                  ) : offerings.length === 0 ? (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        <div className="mx-auto inline-flex flex-col items-center gap-3 text-slate-500">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📅</div>
                          <div className="text-sm font-medium">No offerings created yet</div>
                          <div className="text-sm">Create an offering after adding a subject.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    offerings.map((offering) => (
                      <tr key={offering.offering_id} className={`${tableRowClass}`}>
                        <td className="px-4 py-4 text-slate-600">{offering.offering_id}</td>
                        <td className="px-4 py-4 text-slate-700">{offering.subject_name}</td>
                        <td className="px-4 py-4 text-slate-700">{offering.academic_year}</td>
                        <td className="px-4 py-4 text-slate-700">{offering.semester}</td>
                        <td className="px-4 py-4 text-slate-700">{offering.intake_name}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(offering, "offering")}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                              aria-label="Edit offering"
                            >
                              <i className="fa-solid fa-pen-to-square" />
                            </button>
                            <button
                              onClick={() => deleteItem(offering.offering_id, "offering")}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-rose-600 shadow-sm transition hover:bg-rose-50"
                              aria-label="Delete offering"
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
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Edit {mode}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Update {mode === "subject" ? "Subject" : "Offering"}</h2>
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
              {mode === "subject" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Subject Code</label>
                    <input
                      type="text"
                      value={editForm.subject_code || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, subject_code: e.target.value }))}
                      onBlur={() => setEditTouched((prev) => ({ ...prev, subject_code: true }))}
                      className={`${inputClass} ${editTouched.subject_code && editErrors.subject_code ? "border-rose-500 ring-rose-200" : ""}`}
                    />
                    {editTouched.subject_code && editErrors.subject_code && (
                      <p className="mt-2 text-sm text-rose-600">{editErrors.subject_code}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Subject Name</label>
                    <input
                      type="text"
                      value={editForm.subject_name || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, subject_name: e.target.value }))}
                      onBlur={() => setEditTouched((prev) => ({ ...prev, subject_name: true }))}
                      className={`${inputClass} ${editTouched.subject_name && editErrors.subject_name ? "border-rose-500 ring-rose-200" : ""}`}
                    />
                    {editTouched.subject_name && editErrors.subject_name && (
                      <p className="mt-2 text-sm text-rose-600">{editErrors.subject_name}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Credits</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={editForm.credit_value || ""}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, credit_value: e.target.value }))}
                        onBlur={() => setEditTouched((prev) => ({ ...prev, credit_value: true }))}
                        className={`${inputClass} ${editTouched.credit_value && editErrors.credit_value ? "border-rose-500 ring-rose-200" : ""}`}
                      />
                      {editTouched.credit_value && editErrors.credit_value && (
                        <p className="mt-2 text-sm text-rose-600">{editErrors.credit_value}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
                      <input
                        type="text"
                        value={editForm.department || ""}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                        onBlur={() => setEditTouched((prev) => ({ ...prev, department: true }))}
                        className={`${inputClass} ${editTouched.department && editErrors.department ? "border-rose-500 ring-rose-200" : ""}`}
                      />
                      {editTouched.department && editErrors.department && (
                        <p className="mt-2 text-sm text-rose-600">{editErrors.department}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {mode === "offering" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Academic Year</label>
                    <select
                      value={editForm.academic_year || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, academic_year: e.target.value }))}
                      onBlur={() => setEditTouched((prev) => ({ ...prev, academic_year: true }))}
                      className={`${inputClass} ${editTouched.academic_year && editErrors.academic_year ? "border-rose-500 ring-rose-200" : ""}`}
                    >
                      <option value="">Select year</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                    {editTouched.academic_year && editErrors.academic_year && (
                      <p className="mt-2 text-sm text-rose-600">{editErrors.academic_year}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Semester</label>
                    <select
                      value={editForm.semester || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, semester: e.target.value }))}
                      onBlur={() => setEditTouched((prev) => ({ ...prev, semester: true }))}
                      className={`${inputClass} ${editTouched.semester && editErrors.semester ? "border-rose-500 ring-rose-200" : ""}`}
                    >
                      <option value="">Select semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                    {editTouched.semester && editErrors.semester && (
                      <p className="mt-2 text-sm text-rose-600">{editErrors.semester}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Intake</label>
                    <input
                      type="text"
                      value={editForm.intake_name || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, intake_name: e.target.value }))}
                      onBlur={() => setEditTouched((prev) => ({ ...prev, intake_name: true }))}
                      className={`${inputClass} ${editTouched.intake_name && editErrors.intake_name ? "border-rose-500 ring-rose-200" : ""}`}
                    />
                    {editTouched.intake_name && editErrors.intake_name && (
                      <p className="mt-2 text-sm text-rose-600">{editErrors.intake_name}</p>
                    )}
                  </div>
                </>
              )}
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
                {editSaving ? "Saving..." : "Save changes"}
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
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Remove this record?</h2>
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
            <div>
              <p className="font-semibold">{toast.type === "error" ? "Error" : "Success"}</p>
              <p className="mt-1 text-sm text-slate-100">{toast.message}</p>
            </div>
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
