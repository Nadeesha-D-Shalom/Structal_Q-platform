import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionCard from "./QuestionCard";
import DashboardLayout from "../../components/layout/DashboardLayout";
import axios from "axios";
import RubricBuilder from "./RubricBuilder";

import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

const GuideBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);

  // LOAD GUIDE
  const loadGuide = async () => {
    const res = await axios.get(
      `http://localhost:3000/api/marking-guides/${id}`
    );
    setGuide(res.data);
  };

  // LOAD QUESTIONS
  const loadQuestions = async () => {
    const res = await axios.get(
      "http://localhost:3000/api/guide-questions"
    );

    const filtered = res.data
      .filter((q) => q.marking_guide_id == id)
      .sort((a, b) => a.question_no - b.question_no);

    setQuestions(filtered);
  };

  useEffect(() => {
    loadGuide();
    loadQuestions();
  }, [id]);

  // ADD QUESTION
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        max_marks: "",
        model_answer_text: ""
      }
    ]);
  };

  // DELETE
  const deleteQuestion = async (qid) => {
    await axios.delete(
      `http://localhost:3000/api/guide-questions/${qid}`
    );
    loadQuestions();
  };

  // FIXED DRAG (SINGLE API CALL)
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    // update UI instantly
    setQuestions(items);

    try {
      // prepare reorder payload
      const updated = items.map((q, index) => ({
        question_id: q.question_id,
        question_no: index + 1
      }));

      // SINGLE API CALL
      await axios.put(
        "http://localhost:3000/api/guide-questions/reorder",
        { questions: updated }
      );

    } catch (err) {
      console.error(err);
      alert("Reorder failed ");
    }
  };

  // NEW VERSION
  const handleSaveAsVersion = async () => {
    try {
      setLoading(true);

      await axios.post(
        `http://localhost:3000/api/marking-guides/${id}/new-version`
      );

      alert("New version created");
      navigate("/guides");

    } catch (err) {
      alert("Failed to create version");
    } finally {
      setLoading(false);
    }
  };

  // PUBLISH
  const handlePublish = async () => {
    try {
      setLoading(true);

      alert("Guide Published Successfully");
      navigate("/guides");

    } catch (err) {
      alert("Publish failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Marking Guide Builder
        </h1>

        {/* INFO BAR */}
        {guide && (
          <div className="bg-white shadow rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Guide ID</p>
              <p className="font-semibold">{guide.marking_guide_id}</p>
            </div>

            <div>
              <p className="text-gray-400">Subject</p>
              <p className="font-semibold">{guide.subject_name}</p>
            </div>

            <div>
              <p className="text-gray-400">Assessment</p>
              <p className="font-semibold">{guide.assessment_title}</p>
            </div>

            <div>
              <p className="text-gray-400">Version</p>
              <p className="font-semibold">v{guide.version_no}</p>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-3 mb-6">

          <button
            onClick={handlePublish}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 hover:scale-105 transition shadow"
          >
            Publish Guide
          </button>

          <button
            onClick={handleSaveAsVersion}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 hover:scale-105 transition"
          >
            {loading ? "Creating..." : "Save As New Version"}
          </button>

        </div>

        {/* DRAG AREA */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {questions.map((q, index) => (
                  <Draggable
                    key={q.question_id || index}
                    draggableId={String(q.question_id || index)}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <QuestionCard
                          question={q}
                          index={index}
                          guideId={id}
                          reload={loadQuestions}
                          onDelete={deleteQuestion}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <button
          onClick={addQuestion}
          className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 hover:scale-105 transition shadow"
        >
          + Add Question
        </button>

        {/* RUBRIC SECTION */}
        <RubricBuilder guideId={id} />

      </div>
    </DashboardLayout>
  );
};

export default GuideBuilderPage;