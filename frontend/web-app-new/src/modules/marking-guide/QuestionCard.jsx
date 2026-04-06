import { useState } from "react";
import KeywordList from "./KeywordList";
import {
  createQuestion,
  updateQuestion
} from "../../services/guideQuestionService";

const QuestionCard = ({
  question,
  index,
  reload,
  guideId,
  onDelete,
  dragHandleProps
}) => {

  const [open, setOpen] = useState(!question.question_id);

  const [form, setForm] = useState({
    ...question,
    question_text: question.question_text || "",
    max_marks: question.max_marks || "",
    model_answer_text: question.model_answer_text || "",
    keyword_weight: question.keyword_weight || "",
    semantic_weight: question.semantic_weight || ""
  });

  // SAVE
  const handleSave = async () => {
    if (!form.question_text) return alert("Enter question");

    if (form.question_id) {
      await updateQuestion(form.question_id, form);
    } else {
      await createQuestion({
        ...form,
        marking_guide_id: guideId,
        question_no: index + 1
      });
    }

    reload();
  };

  const shortText =
    form.question_text.length > 70
      ? form.question_text.slice(0, 70) + "..."
      : form.question_text;

  return (
    <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-2xl">

        {/* LEFT */}
        <div className="flex items-center gap-3 flex-1">

          {/* DRAG */}
          <span
            {...dragHandleProps}
            className="cursor-grab text-gray-400 hover:text-gray-600"
          >
            ≡
          </span>

          {/* TITLE */}
          <div className="flex flex-col">

            <div className="flex items-center gap-2">

              <span className="font-semibold text-gray-800">
                Question {index + 1}
              </span>

             

              <button
                onClick={() => setOpen(!open)}
                className="text-gray-400 hover:text-gray-700"
              >
                {open ? "▲" : "▼"}
              </button>

            </div>

            {!open && (
              <span className="text-sm text-gray-500 mt-1">
                {shortText || "No question text"}
              </span>
            )}

          </div>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 text-sm">

           {/* MARKS BADGE */}
              {!open && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  {form.max_marks || 0} marks
                </span>
              )}

          {form.question_id && (
            <button
              onClick={() => onDelete(form.question_id)}
              className="px-2 py-1 rounded hover:bg-red-100 text-red-600 transition"
            >
              Delete
            </button>
          )}

        </div>

      </div>

      {/* BODY */}
      {open && (
        <div className="p-4 space-y-4">

          {/* QUESTION */}
          <div>
            <label className="text-xs text-gray-500">Question</label>
            <input
              className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-200 outline-none"
              value={form.question_text}
              onChange={(e) =>
                setForm({ ...form, question_text: e.target.value })
              }
            />
          </div>

          {/* MODEL ANSWER */}
          <div>
            <label className="text-xs text-gray-500">Model Answer</label>
            <textarea
              className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-200 outline-none"
              rows={3}
              value={form.model_answer_text}
              onChange={(e) =>
                setForm({ ...form, model_answer_text: e.target.value })
              }
            />
          </div>

          {/* STATS ROW */}
          <div className="flex flex-wrap gap-3">

            <div>
              <label className="text-xs text-gray-500">Marks </label>
              <input
                type="number"
                className="border px-2 py-1 rounded w-20 mt-1"
                value={form.max_marks}
                onChange={(e) =>
                  setForm({ ...form, max_marks: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Keyword </label>
              <input
                type="number"
                className="border px-2 py-1 rounded w-20 mt-1"
                value={form.keyword_weight}
                onChange={(e) =>
                  setForm({ ...form, keyword_weight: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Semantic </label>
              <input
                type="number"
                className="border px-2 py-1 rounded w-20 mt-1"
                value={form.semantic_weight}
                onChange={(e) =>
                  setForm({ ...form, semantic_weight: Number(e.target.value) })
                }
              />
            </div>

          </div>

          {/* KEYWORDS */}
          {!form.question_id ? (
            <p className="text-xs text-gray-400">
              Save question to add keywords
            </p>
          ) : (
            <KeywordList questionId={form.question_id} />
          )}

          {/* SAVE */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm transition shadow-sm"
            >
              {form.question_id ? "Update" : "Save"}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default QuestionCard;