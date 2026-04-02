import { useState, useEffect } from "react";
import {
  createAssessment,
  updateAssessment
} from "../../services/assessmentService";

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

  const [error, setError] = useState("");

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
  const validateDates = () => {
    if (form.start_date && form.due_date) {
      const start = new Date(form.start_date);
      const due = new Date(form.due_date);

      if (due <= start) {
        setError("Due date must be after start date");
        return false;
      }
    }

    setError("");
    return true;
  };

  useEffect(() => {
    validateDates();
  }, [form.start_date, form.due_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateDates()) return;

    const payload = {
      ...form,
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

            <input
              placeholder="Subject ID"
              className="border p-2 rounded-lg"
              value={form.subject_id}
              onChange={(e) =>
                setForm({ ...form, subject_id: e.target.value })
              }
            />

            <input
              placeholder="Total Marks"
              type="number"
              className="border p-2 rounded-lg"
              value={form.total_marks}
              onChange={(e) =>
                setForm({ ...form, total_marks: e.target.value })
              }
            />

          </div>

          <input
            placeholder="Assessment Title"
            className="border p-2 rounded-lg w-full"
            value={form.assessment_title}
            onChange={(e) =>
              setForm({ ...form, assessment_title: e.target.value })
            }
          />

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
                className="border p-2 rounded-lg w-full"
                value={form.start_date || ""}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Due Date</label>
              <input
                type="datetime-local"
                className={`border p-2 rounded-lg w-full ${
                  error ? "border-red-400" : ""
                }`}
                value={form.due_date || ""}
                onChange={(e) =>
                  setForm({ ...form, due_date: e.target.value })
                }
              />
            </div>

          </div>

          {/* ERROR */}
          {error && (
            <p className="text-sm text-red-500 -mt-2">
              {error}
            </p>
          )}

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
              disabled={!!error}
              className={`px-5 py-2 rounded-lg text-white shadow-sm transition ${
                error
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
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