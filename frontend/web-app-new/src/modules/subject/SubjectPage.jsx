import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSubjects } from "../../services/subjectService";
import SubjectList from "./SubjectList";
import SubjectForm from "./SubjectForm";
import DashboardLayout from "../../components/layout/DashboardLayout";

const SubjectPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();

  const loadSubjects = async () => {
    const data = await getSubjects();
    setSubjects(data);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Manage Subjects</h1>
            <p className="text-gray-400 text-sm">
              Configure and organize subjects
            </p>
          </div>
        </div>

        {/* STATS + BUTTONS */}
        <div className="bg-white p-5 rounded-xl shadow flex justify-between items-center mb-6">

          {/* LEFT */}
          <div>
            <p className="text-gray-400 text-sm">ACTIVE SUBJECTS</p>
            <h2 className="text-2xl font-bold">{subjects.length}</h2>
          </div>

          {/* RIGHT - BUTTON GROUP */}
          <div className="flex gap-3">

            {/* GO TO ASSESSMENTS */}
            <button
              onClick={() => navigate("/assessments")}
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600"
            >
              Assessments
            </button>

            {/* CREATE NEW */}
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
            >
              + Create New
            </button>

          </div>
        </div>

        {/* TABLE */}
        <SubjectList
          subjects={subjects}
          loadSubjects={loadSubjects}
          setEditing={(sub) => {
            setEditing(sub);
            setShowForm(true);
          }}
        />

        {/* MODAL */}
        {showForm && (
          <SubjectForm
            loadSubjects={loadSubjects}
            editing={editing}
            setEditing={setEditing}
            close={() => setShowForm(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default SubjectPage;