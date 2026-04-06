import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssessments } from "../../services/assessmentService";

import AssessmentList from "./AssessmentList";
import AssessmentForm from "./AssessmentForm";
import AssessmentCalendar from "./AssessmentCalendar";

import DashboardLayout from "../../components/layout/DashboardLayout";

const AssessmentPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();

  const loadAssessments = async () => {
    const data = await getAssessments();
    setAssessments(data);
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex justify-center">

        {/* CENTER CONTAINER */}
        <div className="w-full max-w-5xl p-5 space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-center flex-wrap gap-3">

            {/* TITLE */}
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Manage Assessments
              </h1>
              <p className="text-gray-400 text-sm">
                Create and manage assessments
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 flex-wrap">

              <button
                onClick={() => navigate("/guides")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-green-600 transition"
              >
                Guides
              </button>

              <button
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-blue-700 transition"
              >
                + Add Assessment
              </button>

            </div>
          </div>

          {/* LIST */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <AssessmentList
              assessments={assessments}
              loadAssessments={loadAssessments}
              setEditing={(a) => {
                setEditing(a);
                setShowForm(true);
              }}
            />
          </div>

          {/* CALENDAR BELOW */}
          <AssessmentCalendar assessments={assessments} />

        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <AssessmentForm
          loadAssessments={loadAssessments}
          editing={editing}
          close={() => setShowForm(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default AssessmentPage;