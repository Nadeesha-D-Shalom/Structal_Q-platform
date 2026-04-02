import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAssessments
} from "../../services/assessmentService";
import AssessmentList from "./AssessmentList";
import AssessmentForm from "./AssessmentForm";
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
      <div className="p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Manage Assessments</h1>

          {/* BUTTON GROUP */}
          <div className="flex gap-3">

            {/*GO TO GUIDES */}
            <button
              onClick={() => navigate("/guides")}
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600"
            >
              Guides
            </button>

            {/*ADD ASSESSMENT */}
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
            >
              + Add Assessment
            </button>

          </div>
        </div>

        {/* LIST */}
        <AssessmentList
          assessments={assessments}
          loadAssessments={loadAssessments}
          setEditing={(a) => {
            setEditing(a);
            setShowForm(true);
          }}
        />

        {/* FORM MODAL */}
        {showForm && (
          <AssessmentForm
            loadAssessments={loadAssessments}
            editing={editing}
            close={() => setShowForm(false)}
          />
        )}

      </div>
    </DashboardLayout>
  );
};

export default AssessmentPage;