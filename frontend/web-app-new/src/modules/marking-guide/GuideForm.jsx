import { useState, useEffect } from "react";
import { createGuide, updateGuide } from "../../services/markingGuideService";
import { getAssessments } from "../../services/assessmentService";

// Toggle
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

const GuideForm = ({ loadGuides, editing, close }) => {

  const [form, setForm] = useState({
    assessment_id: "",
    version_no: 1,
    title: "",
    description: "",
    order_sensitive: false,
    requires_diagram_check: false,
    diagram_types_expected: ""
  });

  const [errors, setErrors] = useState({});
  const [assessments, setAssessments] = useState([]);

  // LOAD ASSESSMENTS
  useEffect(() => {
    const load = async () => {
      const data = await getAssessments();
      setAssessments(data);
    };
    load();
  }, []);

  // EDIT MODE
  useEffect(() => {
    if (editing) {
      setForm({
        ...editing,
        diagram_types_expected: editing.diagram_types_expected || "",
        order_sensitive: Boolean(editing.order_sensitive),
        requires_diagram_check: Boolean(editing.requires_diagram_check)
      });
    }
  }, [editing]);

  // VALIDATION
  const validate = () => {
    let e = {};

    // ASSESSMENT ID
    if (!form.assessment_id) {
      e.assessment_id = "Required";
    } else if (isNaN(form.assessment_id)) {
      e.assessment_id = "Must be a number";
    } else {
      const exists = assessments.some(
        (a) => a.assessment_id === Number(form.assessment_id)
      );
      if (!exists) {
        e.assessment_id = "Assessment does not exist";
      }
    }

    // TITLE
    if (!form.title) {
      e.title = "Required";
    }

    // DIAGRAM VALIDATION
    if (form.requires_diagram_check && !form.diagram_types_expected.trim()) {
      e.diagram_types_expected = "Required when diagram enabled";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    validate();
  }, [form, assessments]);

  const isValid =
    Object.keys(errors).length === 0 &&
    form.assessment_id &&
    form.title;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      assessment_id: Number(form.assessment_id),
      order_sensitive: form.order_sensitive ? 1 : 0,
      requires_diagram_check: form.requires_diagram_check ? 1 : 0
    };

    if (editing) {
      await updateGuide(editing.marking_guide_id, payload);
    } else {
      await createGuide(payload);
    }

    loadGuides();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white w-[600px] rounded-2xl shadow-xl p-6">

        <h2 className="text-xl font-semibold mb-5">
          {editing ? "Edit Marking Guide" : "Create Marking Guide"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* TOP */}
          <div className="grid grid-cols-2 gap-3">

            {/* ASSESSMENT ID */}
            <div>
              <input
                placeholder="Assessment ID"
                className="border p-2 rounded-lg w-full"
                value={form.assessment_id}
                onChange={(e) =>
                  setForm({ ...form, assessment_id: e.target.value })
                }
              />

              {errors.assessment_id && (
                <p className="text-red-500 text-xs">{errors.assessment_id}</p>
              )}

             
            </div>

            <input
              type="number"
              placeholder="Version"
              className="border p-2 rounded-lg"
              value={form.version_no}
              onChange={(e) =>
                setForm({ ...form, version_no: e.target.value })
              }
            />

          </div>

          {/* TITLE */}
          <div>
            <input
              placeholder="Guide Title"
              className="border p-2 rounded-lg w-full"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />
            {errors.title && (
              <p className="text-red-500 text-xs">{errors.title}</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <textarea
            placeholder="Description..."
            className="border p-2 rounded-lg w-full h-20"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          {/* DIAGRAM TYPES */}
          <div>
            <label className="text-xs text-gray-500">
              Diagram Types (comma separated)
            </label>

            <input
              placeholder="Use Case, Sequence, Architecture..."
              className="border p-2 rounded-lg w-full mt-1"
              value={form.diagram_types_expected}
              onChange={(e) =>
                setForm({
                  ...form,
                  diagram_types_expected: e.target.value
                })
              }
            />

            {errors.diagram_types_expected && (
              <p className="text-red-500 text-xs">
                {errors.diagram_types_expected}
              </p>
            )}

            {/* CHIPS */}
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.diagram_types_expected || "")
                .split(",")
                .map((d, i) =>
                  d.trim() && (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full border"
                    >
                      {d.trim()}
                    </span>
                  )
                )}
            </div>
          </div>

          {/* TOGGLES */}
          <div className="space-y-3">

            <div className="flex justify-between items-center border rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Order Sensitive</p>
                <p className="text-xs text-gray-500">
                  Answer must follow correct order
                </p>
              </div>

              <Toggle
                checked={form.order_sensitive}
                onChange={(val) =>
                  setForm({ ...form, order_sensitive: val })
                }
              />
            </div>

            <div className="flex justify-between items-center border rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Diagram Required</p>
                <p className="text-xs text-gray-500">
                  Validate diagram presence & type
                </p>
              </div>

              <Toggle
                checked={form.requires_diagram_check}
                onChange={(val) =>
                  setForm({ ...form, requires_diagram_check: val })
                }
              />
            </div>

          </div>

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
              {editing ? "Update" : "Create"} Guide
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default GuideForm;