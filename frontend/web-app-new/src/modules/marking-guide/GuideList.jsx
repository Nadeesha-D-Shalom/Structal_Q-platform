import { useState, useMemo } from "react";
import { deleteGuide } from "../../services/markingGuideService";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";

const GuideList = ({ guides, loadGuides, setEditing }) => {
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  // FILTERS
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [assessmentFilter, setAssessmentFilter] = useState("ALL");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleDelete = async () => {
    await deleteGuide(deleteId);
    setDeleteId(null);
    loadGuides();
  };

  const onBuild = (guide, e) => {
    e.stopPropagation();
    navigate(`/guide-builder/${guide.marking_guide_id}`);
  };

  const onEdit = (guide, e) => {
    e.stopPropagation();
    setEditing(guide);
  };

  const onRowClick = (guide) => {
    navigate(`/guide-preview/${guide.marking_guide_id}`);
  };

  // SUBJECT OPTIONS
  const subjectOptions = useMemo(() => {
    return [...new Set(guides.map(g => g.subject_name))];
  }, [guides]);

  // 🔥 FILTERED ASSESSMENTS BASED ON SUBJECT
  const assessmentOptions = useMemo(() => {
    return [
      ...new Set(
        guides
          .filter(g =>
            subjectFilter === "ALL"
              ? true
              : g.subject_name === subjectFilter
          )
          .map(g => g.assessment_title)
      )
    ];
  }, [guides, subjectFilter]);

  // FILTER LOGIC
  const filteredGuides = useMemo(() => {
    return guides.filter(g => {
      const matchSubject =
        subjectFilter === "ALL" || g.subject_name === subjectFilter;

      const matchAssessment =
        assessmentFilter === "ALL" || g.assessment_title === assessmentFilter;

      return matchSubject && matchAssessment;
    });
  }, [guides, subjectFilter, assessmentFilter]);

  // PAGINATION
  const totalPages = Math.ceil(filteredGuides.length / itemsPerPage);

  const paginatedGuides = useMemo(() => {
    return filteredGuides.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredGuides, currentPage]);

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">

      {/* FILTER BAR */}
      <div className="flex gap-3 p-4 border-b bg-gray-50">

        {/* SUBJECT */}
        <select
          className="border px-3 py-2 rounded-md text-sm"
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setAssessmentFilter("ALL"); // reset
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Subjects</option>
          {subjectOptions.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>

        {/* ASSESSMENT */}
        <select
          className="border px-3 py-2 rounded-md text-sm"
          value={assessmentFilter}
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
      <table className="w-full text-sm border-collapse">

        <thead className="bg-gray-50 border-b">
          <tr className="text-gray-600 text-center">
            <th className="py-3">ID</th>
            <th className="">Subject</th>
            <th className="">Assessment</th>
            <th className="">Title</th>
            <th className="">Version</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedGuides.map((g, index) => (
            <tr
              key={g.marking_guide_id}
              onClick={() => onRowClick(g)}
              className={`text-center border-b cursor-pointer transition hover:bg-gray-50 ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <td className="py-3 font-bold ">
                #{g.marking_guide_id}
              </td>

              <td className="">
                {g.subject_name}
              </td>

              <td className="">
                {g.assessment_title}
              </td>

              <td className="">
                {g.title}
              </td>

              <td className="">
                v{g.version_no}
              </td>

              {/* ACTIONS */}
              <td onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center gap-2 ">

                  <button
                    onClick={(e) => onBuild(g, e)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                  >
                    Build
                  </button>

                  <button
                    onClick={(e) => onEdit(g, e)}
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
      <div className="flex justify-between items-center p-4 border-t">

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