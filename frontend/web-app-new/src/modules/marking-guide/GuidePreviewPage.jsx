import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import axios from "axios";
import html2pdf from "html2pdf.js";

const GuidePreviewPage = () => {
  const { id } = useParams();
  const printRef = useRef();

  const [guide, setGuide] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [keywords, setKeywords] = useState([]);

  // LOAD DATA
  const loadData = async () => {
    const guideRes = await axios.get(
      `http://localhost:3000/api/marking-guides/${id}`
    );

    const qRes = await axios.get(
      `http://localhost:3000/api/guide-questions`
    );

    const kRes = await axios.get(
      `http://localhost:3000/api/question-keywords`
    );

    setGuide(guideRes.data);

    const filteredQ = qRes.data
      .filter((q) => q.marking_guide_id == id)
      .sort((a, b) => a.question_no - b.question_no);

    setQuestions(filteredQ);
    setKeywords(kRes.data);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // TOTAL MARKS
  const totalMarks = questions.reduce(
    (sum, q) => sum + (q.max_marks || 0),
    0
  );

  // EXPORT PDF
  const handleExport = () => {
    const element = printRef.current;

    const opt = {
      margin: 0.5,
      filename: `MarkingGuide_${guide?.marking_guide_id}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Guide Preview
          </h1>

          <button
            onClick={handleExport}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 hover:scale-105 transition shadow"
          >
            Export as PDF
          </button>
        </div>

        {/* PRINT AREA */}
        <div
          ref={printRef}
          className="bg-white p-6 rounded-xl shadow border"
        >

          {/* GUIDE INFO */}
          {guide && (
            <div className="mb-6 border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">
                {guide.title}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Subject</p>
                  <p className="font-medium">{guide.subject_name}</p>
                </div>

                <div>
                  <p className="text-gray-400">Assessment</p>
                  <p className="font-medium">{guide.assessment_title}</p>
                </div>

                <div>
                  <p className="text-gray-400">Version</p>
                  <p className="font-medium">v{guide.version_no}</p>
                </div>

                <div>
                  <p className="text-gray-400">Total Marks</p>
                  <p className="font-medium">{totalMarks}</p>
                </div>
              </div>
            </div>
          )}

          {/* QUESTIONS */}
          <div className="space-y-6">
            {questions.map((q, index) => {
              const qKeywords = keywords.filter(
                (k) => k.question_id === q.question_id
              );

              return (
                <div
                  key={q.question_id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">
                      Question {index + 1}
                    </h3>
                    <span className="text-sm text-red-800">
                      {q.max_marks} Marks
                    </span>
                  </div>

                  <p className="mb-2 text-gray-800">
                    {q.question_text}
                  </p>

                  {/* MODEL ANSWER */}
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">
                      Model Answer:
                    </p>
                    <p className="text-gray-700">
                      {q.model_answer_text}
                    </p>
                  </div>

                  {/* KEYWORDS */}
                  <div>
                    <hr></hr>
                    <p className="text-sm text-gray-500 mb-1">
                      Keywords:
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {qKeywords.map((k) => (
                        <span
                          key={k.keyword_id}
                          className=" text-green-700  text-sm"
                        >
                          {k.keyword_text}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default GuidePreviewPage;