import { useEffect, useState } from "react";
import {
  getRubrics,
  createRubric,
  deleteRubric,
  updateRubric // ✅ IMPORTANT
} from "../../services/guideRubricService";

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-purple-500"
];

const BG_COLORS = [
  "bg-blue-50",
  "bg-green-50",
  "bg-yellow-50",
  "bg-red-50",
  "bg-purple-50"
];

const RubricBuilder = ({ guideId }) => {
  const [rubrics, setRubrics] = useState([]);
  const [form, setForm] = useState({
    criterion_name: "",
    description: "",
    max_marks: "",
    weight: ""
  });

  const [deleteId, setDeleteId] = useState(null);
  const [editing, setEditing] = useState(null);

  // LOAD
  const load = async () => {
    const res = await getRubrics();
    setRubrics(
      res.data.filter(r => r.marking_guide_id == guideId)
    );
  };

  useEffect(() => {
    load();
  }, [guideId]);

  // ADD
  const add = async () => {
    if (!form.criterion_name || !form.max_marks) {
      alert("Fill required fields");
      return;
    }

    await createRubric({
      ...form,
      max_marks: Number(form.max_marks),
      weight: Number(form.weight),
      marking_guide_id: guideId
    });

    setForm({
      criterion_name: "",
      description: "",
      max_marks: "",
      weight: ""
    });

    load();
  };

  // DELETE
  const remove = async (id) => {
    await deleteRubric(id);
    load();
  };

  const total = rubrics.reduce(
    (sum, r) => sum + Number(r.max_marks),
    0
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow mt-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Rubric Builder
        </h2>

        <span
          className={`px-3 py-1 rounded-full text-sm font-medium 
          ${total === 100
            ? "bg-green-100 text-green-600"
            : "bg-red-100 text-red-600"}`}
        >
          Total: {total}
        </span>
      </div>

      {/* FORM */}
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <input
          placeholder="Criterion"
          value={form.criterion_name}
          onChange={(e) =>
            setForm({ ...form, criterion_name: e.target.value })
          }
          className="border p-2 rounded-lg"
        />

        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className="border p-2 rounded-lg"
        />

        <input
          type="number"
          placeholder="Marks"
          value={form.max_marks}
          onChange={(e) =>
            setForm({ ...form, max_marks: e.target.value })
          }
          className="border p-2 rounded-lg"
        />

        <input
          type="number"
          placeholder="Weight %"
          value={form.weight}
          onChange={(e) =>
            setForm({ ...form, weight: e.target.value })
          }
          className="border p-2 rounded-lg"
        />
      </div>

      <button
        onClick={add}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition"
      >
        + Add Criterion
      </button>

      {/* LIST */}
      <div className="mt-6 space-y-4">
        {rubrics.map((r, i) => {

          const markPercent =
            total > 0 ? (r.max_marks / total) * 100 : 0;

          const weight = r.weight || 0;

          return (
            <div
              key={r.rubric_item_id}
              className={`p-4 rounded-xl border hover:shadow-md transition ${BG_COLORS[i % BG_COLORS.length]}`}
            >

              {/* TOP */}
              <div className="flex justify-between items-center mb-2">

                <div>
                  <p className="font-semibold">
                    {r.criterion_name}
                  </p>

                  <p className="text-sm text-gray-600">
                    {r.description}
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  {/* CIRCLE */}
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 rotate-[-90deg]">
                      <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 20}
                        strokeDashoffset={2 * Math.PI * 20 * (1 - weight / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                      {weight}%
                    </div>
                  </div>

                  {/* EDIT */}
                  <button
                    onClick={() => setEditing(r)}
                    className="px-3 py-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-100 text-sm"
                  >
                    Edit
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={() => setDeleteId(r.rubric_item_id)}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-100 text-sm"
                  >
                    Delete
                  </button>

                </div>
              </div>

              {/* MARKS */}
              <div className="text-xs text-gray-500 mb-2">
                {r.max_marks} Marks
              </div>

              {/* BAR */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-2 ${COLORS[i % COLORS.length]}`}
                  style={{ width: `${markPercent}%` }}
                />
              </div>

            </div>
          );
        })}
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center">
            <h3 className="text-lg font-semibold mb-2">
              Delete Criterion?
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await remove(deleteId);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96">

            <h3 className="text-lg font-semibold mb-4">
              Edit Criterion
            </h3>

            <input
              value={editing.criterion_name}
              onChange={(e) =>
                setEditing({ ...editing, criterion_name: e.target.value })
              }
              className="w-full border p-2 mb-2 rounded"
            />

            <input
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="w-full border p-2 mb-2 rounded"
            />

            <input
              type="number"
              value={editing.max_marks}
              onChange={(e) =>
                setEditing({ ...editing, max_marks: e.target.value })
              }
              className="w-full border p-2 mb-2 rounded"
            />

            <input
              type="number"
              value={editing.weight}
              onChange={(e) =>
                setEditing({ ...editing, weight: e.target.value })
              }
              className="w-full border p-2 mb-4 rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await updateRubric(editing.rubric_item_id, {
                    criterion_name: editing.criterion_name,
                    description: editing.description,
                    max_marks: Number(editing.max_marks),
                    weight: Number(editing.weight)
                  });

                  setEditing(null);
                  load();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RubricBuilder;