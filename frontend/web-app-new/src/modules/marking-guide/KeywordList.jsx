import { useEffect, useState } from "react";
import {
  getKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword
} from "../../services/keywordService";

const KeywordList = ({ questionId }) => {
  const [keywords, setKeywords] = useState([]);

  const [form, setForm] = useState({
    keyword_text: "",
    marks_weight: 1,
    is_mandatory: false,
    match_type: "EXACT"
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // LOAD
  const load = async () => {
    const res = await getKeywords();

    const filtered = res.data
      .filter(k => k.question_id === questionId)
      .map(k => ({
        ...k,
        is_mandatory: Boolean(k.is_mandatory)
      }))
      .sort((a, b) => b.marks_weight - a.marks_weight);

    setKeywords(filtered);
  };

  useEffect(() => {
    load();
  }, [questionId]);

  // ADD
  const add = async () => {
    if (!form.keyword_text.trim()) return;

    await createKeyword({
      question_id: questionId,
      keyword_text: form.keyword_text,
      marks_weight: Number(form.marks_weight),
      is_mandatory: form.is_mandatory ? 1 : 0,
      match_type: form.match_type
    });

    setForm({
      keyword_text: "",
      marks_weight: 1,
      is_mandatory: false,
      match_type: "EXACT"
    });

    load();
  };

  // DELETE
  const remove = async (id) => {
    await deleteKeyword(id);
    load();
  };

  // OPEN EDIT
  const openEdit = (k) => {
    setEditingId(k.keyword_id);
    setEditForm({
      keyword_text: k.keyword_text,
      marks_weight: k.marks_weight,
      is_mandatory: Boolean(k.is_mandatory),
      match_type: k.match_type
    });
  };

  // SAVE
  const saveEdit = async (id) => {
    await updateKeyword(id, {
      ...editForm,
      marks_weight: Number(editForm.marks_weight),
      is_mandatory: editForm.is_mandatory ? 1 : 0
    });

    setEditingId(null);
    load();
  };

  return (
    <div className="mt-4">

      <h4 className="text-sm font-semibold text-gray-700 mb-4">
        Keywords
      </h4>

      {/* INPUT */}
      <div className="flex flex-wrap gap-2 mb-4">

        <input
          placeholder="Keyword..."
          value={form.keyword_text}
          onChange={(e) =>
            setForm({ ...form, keyword_text: e.target.value })
          }
          className="border px-3 py-2 rounded-lg text-sm"
        />

        <input
          type="number"
          value={form.marks_weight}
          onChange={(e) =>
            setForm({ ...form, marks_weight: e.target.value })
          }
          className="border px-3 py-2 rounded-lg w-20 text-sm"
        />

        <select
          value={form.match_type}
          onChange={(e) =>
            setForm({ ...form, match_type: e.target.value })
          }
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="EXACT">Exact</option>
          <option value="PARTIAL">Partial</option>
          <option value="SEMANTIC">Semantic</option>
        </select>

        <label className="flex items-center gap-1 text-sm px-2">
          <input
            type="checkbox"
            checked={form.is_mandatory}
            onChange={(e) =>
              setForm({ ...form, is_mandatory: e.target.checked })
            }
          />
          Mandatory
        </label>

        <button
          onClick={add}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Add
        </button>
      </div>

      {/* KEYWORDS */}
      <div className="flex flex-wrap gap-3">

        {keywords.map((k) => {

          const isMandatory = k.is_mandatory;

          const baseColor = isMandatory
            ? "bg-red-50 border-red-200"
            : "bg-green-50 border-green-200";

          return (
            <div
              key={k.keyword_id}
              className={`rounded-xl border text-sm shadow-sm transition ${baseColor}`}
            >

              {editingId === k.keyword_id ? (

                /* EXPANDED EDIT VIEW */
                <div className="p-3 space-y-2 w-64">

                  <input
                    value={editForm.keyword_text}
                    onChange={(e) =>
                      setEditForm({ ...editForm, keyword_text: e.target.value })
                    }
                    className="border p-2 rounded w-full text-sm"
                  />

                  <input
                    type="number"
                    value={editForm.marks_weight}
                    onChange={(e) =>
                      setEditForm({ ...editForm, marks_weight: e.target.value })
                    }
                    className="border p-2 rounded w-full text-sm"
                  />

                  <select
                    value={editForm.match_type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, match_type: e.target.value })
                    }
                    className="border p-2 rounded w-full text-sm"
                  >
                    <option value="EXACT">Exact</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="SEMANTIC">Semantic</option>
                  </select>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.is_mandatory}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          is_mandatory: e.target.checked
                        })
                      }
                    />
                    Mandatory
                  </label>

                  <div className="flex justify-end gap-2 text-sm">
                    <button
                      onClick={() => saveEdit(k.keyword_id)}
                      className="text-blue-600 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                </div>

              ) : (

                /* COLLAPSED VIEW */
                <div
                  onClick={() => openEdit(k)}
                  className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-xl"
                >

                  <span className="font-medium">
                    {k.keyword_text}
                  </span>

                  <span className="text-gray-500 text-xs">
                    {k.marks_weight} Marks
                  </span>

                  {/* DELETE */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      remove(k.keyword_id);
                    }}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>

                </div>

              )}

            </div>
          );
        })}

      </div>

    </div>
  );
};

export default KeywordList;