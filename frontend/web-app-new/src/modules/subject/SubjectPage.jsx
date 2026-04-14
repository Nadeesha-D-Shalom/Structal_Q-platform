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
      <div className="flex justify-center">

      
        <div className="w-full max-w-5xl px-4 py-6">

          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              Manage Subjects
            </h1>
            <p className="text-gray-400 text-sm">
              Configure and organize subjects
            </p>
          </div>

          {/* STATS + ACTIONS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center mb-6">

            {/* LEFT */}
            <div>
              <p className="text-gray-400 text-xs tracking-wide">
                ACTIVE SUBJECTS
              </p>
              <h2 className="text-2xl font-bold text-gray-800">
                {subjects.length}
              </h2>
            </div>

            {/* RIGHT */}
            <div className="flex gap-3">

              <button
                onClick={() => navigate("/assessments")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-green-600 transition"
              >
                Assessments
              </button>

              <button
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-blue-700 transition"
              >
                +Add Subject
              </button>

            </div>
          </div>

          {/* TABLE CARD */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border">

            <SubjectList
              subjects={subjects}
              loadSubjects={loadSubjects}
              setEditing={(sub) => {
                setEditing(sub);
                setShowForm(true);
              }}
            />

          </div>

        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <SubjectForm
          loadSubjects={loadSubjects}
          editing={editing}
          setEditing={setEditing}
          close={() => setShowForm(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default SubjectPage;