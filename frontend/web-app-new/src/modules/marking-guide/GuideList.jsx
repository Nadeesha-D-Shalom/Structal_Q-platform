import { useState, useMemo } from "react";
import { deleteGuide } from "../../services/markingGuideService";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";

const GuideList = ({ guides, loadGuides, setEditing }) => {
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  // 🔥 FILTER STATES
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [assessmentFilter, setAssessmentFilter] = useState("ALL");

  // 🔥 PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleDelete = async () => {
    await deleteGuide(deleteId);
    setDeleteId(null);
    loadGuides();
  };

  const onBuild = (guide) => {
    navigate(`/guide-builder/${guide.marking_guide_id}`);
  };

  const onView = (guide) => {
    navigate(`/guide-preview/${guide.marking_guide_id}`);
  };

  // 🔥 UNIQUE SUBJECTS
  const subjectOptions = useMemo(() => {
    const map = new Map();
    guides.forEach(g => {
      map.set(g.subject_name, g.subject_name);
    });
    return Array.from(map.values());
  }, [guides]);

  // 🔥 UNIQUE ASSESSMENTS
  const assessmentOptions = useMemo(() => {
    const map = new Map();
    guides.forEach(g => {
      map.set(g.assessment_title, g.assessment_title);
    });
    return Array.from(map.values());
  }, [guides]);

  // 🔥 FILTER LOGIC
  const filteredGuides = useMemo(() => {
    return guides.filter(g => {
      const matchSubject =
        subjectFilter === "ALL" || g.subject_name === subjectFilter;

      const matchAssessment =
        assessmentFilter === "ALL" || g.assessment_title === assessmentFilter;

      return matchSubject && matchAssessment;
    });
  }, [guides, subjectFilter, assessmentFilter]);

  // 🔥 PAGINATION LOGIC
  const totalPages = Math.ceil(filteredGuides.length / itemsPerPage);

  const paginatedGuides = useMemo(() => {
    return filteredGuides.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredGuides, currentPage]);

  return (
    <div className="bg-white p-5 rounded-xl shadow">

      {/* 🔥 FILTERS */}
      <div className="flex gap-3 mb-5">

        {/* SUBJECT FILTER */}
        <select
          className="border px-3 py-1 rounded-md"
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Subjects</option>
          {subjectOptions.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>

        {/* ASSESSMENT FILTER */}
        <select
          className="border px-3 py-1 rounded-md"
          onChange={(e) => {
            setAssessmentFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Assessments</option>
          {assessmentOptions.map((a, i) => (
            <option key={i} value={a}>{a}</option>
          ))}
        </select>

      </div>

      {/* TABLE */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-600 text-center">
            <th className="py-2">ID</th>
            <th>Assessment</th>
            <th>Subject</th>
            <th>Title</th>
            <th>Version</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedGuides.map((g, index) => (
            <tr
              key={g.marking_guide_id}
              className={`text-center border-t ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-gray-100 transition`}
            >
              <td className="font-bold py-2">{g.marking_guide_id}</td>
              <td>{g.assessment_title}</td>
              <td>{g.subject_name}</td>
              <td>{g.title}</td>
              <td>v{g.version_no}</td>

              <td>
                <div className="flex justify-center gap-2 flex-wrap">

                  <button
                    onClick={() => onBuild(g)}
                    className="px-3 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-xs"
                  >
                    Build
                  </button>

                  <button
                    onClick={() => onView(g)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                  >
                    View
                  </button>

                  <button
                    onClick={() => setEditing(g)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteId(g.marking_guide_id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                  >
                    Delete
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4">

        <p className="text-sm text-gray-500">
          Showing {paginatedGuides.length} of {filteredGuides.length}
        </p>

        <div className="flex gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <ConfirmModal
          title="Delete Guide"
          message="Are you sure you want to delete this guide?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default GuideList;