import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGuides } from "../../services/markingGuideService";
import GuideList from "./GuideList";
import GuideForm from "./GuideForm";
import DashboardLayout from "../../components/layout/DashboardLayout";

const GuidePage = () => {
  const [guides, setGuides] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();

  const loadGuides = async () => {
    const data = await getGuides();
    setGuides(data);
  };

  useEffect(() => {
    loadGuides();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex justify-center">

        <div className="w-full max-w-5xl px-4 py-6">

          {/* HEADER */}
          <div className="mb-6 flex justify-between items-center flex-wrap gap-3">

            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Marking Guides
              </h1>
              <p className="text-gray-400 text-sm">
                Create and manage marking guides
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 flex-wrap">

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
                + Add Guide
              </button>

            </div>

          </div>

          {/* LIST CARD */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border">

            <GuideList
              guides={guides}
              loadGuides={loadGuides}
              setEditing={(g) => {
                setEditing(g);
                setShowForm(true);
              }}
            />

          </div>

        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <GuideForm
          loadGuides={loadGuides}
          editing={editing}
          close={() => setShowForm(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default GuidePage;