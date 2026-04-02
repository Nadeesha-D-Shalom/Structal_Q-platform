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
      <div className="p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

          {/* TITLE */}
          <h1 className="text-2xl font-semibold">
            Marking Guides
          </h1>

          {/*ACTION BUTTONS */}
          <div className="flex gap-2 flex-wrap">


            {/* ASSESSMENT PAGE */}
            <button
              onClick={() => navigate("/assessments")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 text-sm"
            >
              Assessments
            </button>

            {/* ADD GUIDE */}
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              + Add Guide
            </button>

          </div>

        </div>

        {/* LIST */}
        <GuideList
          guides={guides}
          loadGuides={loadGuides}
          setEditing={(g) => {
            setEditing(g);
            setShowForm(true);
          }}
        />

        {/* FORM */}
        {showForm && (
          <GuideForm
            loadGuides={loadGuides}
            editing={editing}
            close={() => setShowForm(false)}
          />
        )}

      </div>
    </DashboardLayout>
  );
};

export default GuidePage;