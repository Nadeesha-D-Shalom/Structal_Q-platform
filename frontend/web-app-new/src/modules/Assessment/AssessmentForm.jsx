import { useState, useEffect } from "react";
import {
  createAssessment,
  updateAssessment
} from "../../services/assessmentService";
import { getSubjects } from "../../services/subjectService"; // 🔥 needed

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
      checked ? "bg-blue-600" : "bg-gray-300"
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
        checked ? "translate-x-5" : ""
      }`}
    />
  </button>
);


const AssessmentForm = ({ loadAssessments, editing, close }) => {

  const [form, setForm] = useState({
    subject_id: "",
    assessment_title: "",
    assessment_type: "EXAM",
    total_marks: "",
    start_date: "",
    due_date: "",
    allow_resubmission: false,
    max_resubmissions: "",
    late_policy_enabled: false,
    grace_minutes: ""
  });

  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]);

  // Subject ID check
  useEffect(() => {
    const loadSubjects = async () => {
      const data = await getSubjects();
      setSubjects(data);
    };
    loadSubjects();
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        ...editing,
        allow_resubmission: Boolean(editing.allow_resubmission),
        late_policy_enabled: Boolean(editing.late_policy_enabled)
      });
    }
  }, [editing]);

  // VALIDATION
  const validate = () => {
    let e = {};

    // SUBJECT ID
    if (!form.subject_id) {
      e.subject_id = "Required";
    } 
    else {
      const exists = subjects.some(
        (s) => s.subject_id === Number(form.subject_id)
      );
      if (!exists) {
        e.subject_id = "Subject does not exist";
      }
    }

    // TITLE
    if (!form.assessment_title) {
      e.assessment_title = "Required";
    }

    // MARKS
    if (!form.total_marks) {
      e.total_marks = "Required";
    } else if (isNaN(form.total_marks) || form.total_marks <= 0) {
      e.total_marks = "Invalid marks";
    }

    // DATES REQUIRED
    if (!form.start_date) {
      e.start_date = "Start date required";
    }

    if (!form.due_date) {
      e.due_date = "Due date required";
    }

    // DATE LOGIC
    if (form.start_date && form.due_date) {
      const start = new Date(form.start_date);
      const due = new Date(form.due_date);

      if (due <= start) {
        e.due_date = "Due must be after start date";
      }
    }

    // RESUBMISSION
    if (form.allow_resubmission) {
      if (!form.max_resubmissions || form.max_resubmissions <= 0) {
        e.max_resubmissions = "Required";
      }
    }

    // LATE POLICY
    if (form.late_policy_enabled) {
      if (!form.grace_minutes || form.grace_minutes <= 0) {
        e.grace_minutes = "Required";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    validate();
  }, [form, subjects]);

  const isValid =
    Object.keys(errors).length === 0 &&
    form.subject_id &&
    form.assessment_title &&
    form.total_marks &&
    form.start_date &&
    form.due_date;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        ...form,
        subject_id: Number(form.subject_id),
        total_marks: Number(form.total_marks),
        max_resubmissions: form.max_resubmissions
          ? Number(form.max_resubmissions)
          : null,
        grace_minutes: form.grace_minutes
          ? Number(form.grace_minutes)
          : null,
        allow_resubmission: form.allow_resubmission ? 1 : 0,
        late_policy_enabled: form.late_policy_enabled ? 1 : 0
      };

      if (editing) {
        await updateAssessment(editing.assessment_id, payload);
      } else {
        await createAssessment(payload);
      }

      loadAssessments();
      close();

    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white w-[600px] rounded-2xl shadow-xl p-6">

        <h2 className="text-xl font-semibold mb-5">
          {editing ? "Edit Assessment" : "Add Assessment"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* BASIC */}
          <div className="grid grid-cols-2 gap-3">

            <div>
              <input
                placeholder="Subject ID"
                type="number"
                className="border p-2 rounded-lg w-full"
                value={form.subject_id}
                onChange={(e) =>
                  setForm({ ...form, subject_id: e.target.value })
                }
              />
              {errors.subject_id && (
                <p className="text-red-500 text-xs">{errors.subject_id}</p>
              )}
            </div>

            <div>
              <input
                placeholder="Total Marks"
                type="number"
                className="border p-2 rounded-lg w-full"
                value={form.total_marks}
                onChange={(e) =>
                  setForm({ ...form, total_marks: e.target.value })
                }
              />
              {errors.total_marks && (
                <p className="text-red-500 text-xs">{errors.total_marks}</p>
              )}
            </div>

          </div>

          <div>
            <input
              placeholder="Assessment Title"
              className="border p-2 rounded-lg w-full"
              value={form.assessment_title}
              onChange={(e) =>
                setForm({ ...form, assessment_title: e.target.value })
              }
            />
            {errors.assessment_title && (
              <p className="text-red-500 text-xs">{errors.assessment_title}</p>
            )}
          </div>

          <select
            className="border p-2 rounded-lg w-full"
            value={form.assessment_type}
            onChange={(e) =>
              setForm({ ...form, assessment_type: e.target.value })
            }
          >
            <option value="EXAM">Exam</option>
            <option value="LAB">Lab</option>
            <option value="REPORT">Report</option>
          </select>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="text-xs text-gray-500">Start Date</label>
              <input
                type="datetime-local"
                className={`border p-2 rounded-lg w-full ${
                  errors.start_date ? "border-red-400" : ""
                }`}
                value={form.start_date || ""}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
              {errors.start_date && (
                <p className="text-red-500 text-xs">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500">Due Date</label>
              <input
                type="datetime-local"
                className={`border p-2 rounded-lg w-full ${
                  errors.due_date ? "border-red-400" : ""
                }`}
                value={form.due_date || ""}
                onChange={(e) =>
                  setForm({ ...form, due_date: e.target.value })
                }
              />
              {errors.due_date && (
                <p className="text-red-500 text-xs">{errors.due_date}</p>
              )}
            </div>

          </div>

          {/* RESUBMISSION */}
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">Allow Resubmission</p>
              <p className="text-xs text-gray-500">
                Students can submit again
              </p>
            </div>

            <Toggle
              checked={form.allow_resubmission}
              onChange={(val) =>
                setForm({ ...form, allow_resubmission: val })
              }
            />
          </div>

          {form.allow_resubmission && (
            <div>
              <input
                type="number"
                placeholder="Max Resubmissions"
                className="border p-2 rounded-lg w-full"
                value={form.max_resubmissions}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_resubmissions: e.target.value
                  })
                }
              />
              {errors.max_resubmissions && (
                <p className="text-red-500 text-xs">{errors.max_resubmissions}</p>
              )}
            </div>
          )}

          {/* LATE POLICY */}
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">Late Submission Policy</p>
              <p className="text-xs text-gray-500">
                Allow late submissions
              </p>
            </div>

            <Toggle
              checked={form.late_policy_enabled}
              onChange={(val) =>
                setForm({ ...form, late_policy_enabled: val })
              }
            />
          </div>

          {form.late_policy_enabled && (
            <div>
              <input
                type="number"
                placeholder="Grace Minutes"
                className="border p-2 rounded-lg w-full"
                value={form.grace_minutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    grace_minutes: e.target.value
                  })
                }
              />
              {errors.grace_minutes && (
                <p className="text-red-500 text-xs">{errors.grace_minutes}</p>
              )}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-3">

            <button
              type="button"
              onClick={close}
              className="text-gray-500 hover:text-black"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isValid}
              className={`px-5 py-2 rounded-lg text-white ${
                isValid
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {editing ? "Update" : "Save"} Assessment
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AssessmentForm;