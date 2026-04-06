import { useState, useMemo } from "react";
import { deleteAssessment } from "../../services/assessmentService";
import ConfirmModal from "../../components/common/ConfirmModal";

const AssessmentList = ({ assessments, loadAssessments, setEditing }) => {
  const [deleteId, setDeleteId] = useState(null);

  // FILTER
  const [subjectFilter, setSubjectFilter] = useState("ALL");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleDelete = async () => {
    await deleteAssessment(deleteId);
    setDeleteId(null);
    loadAssessments();
  };

  // SUBJECT OPTIONS
  const subjectOptions = useMemo(() => {
    const map = new Map();
    assessments.forEach((a) => {
      map.set(a.subject_id, a.subject_name);
    });
    return Array.from(map.entries());
  }, [assessments]);

  // FILTER LOGIC
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      return (
        subjectFilter === "ALL" ||
        a.subject_id === parseInt(subjectFilter)
      );
    });
  }, [assessments, subjectFilter]);

  // STATS
  const stats = useMemo(() => {
    const result = {
      total: filteredAssessments.length,
      EXAM: 0,
      LAB: 0,
      REPORT: 0,
    };

    filteredAssessments.forEach((a) => {
      if (a.assessment_type === "EXAM") result.EXAM++;
      if (a.assessment_type === "LAB") result.LAB++;
      if (a.assessment_type === "REPORT") result.REPORT++;
    });

    return result;
  }, [filteredAssessments]);

  // PAGINATION
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);

  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">

      {/* FILTER */}
      <div className="flex gap-3 p-4 border-b bg-gray-50">
        <select
          className="border px-3 py-2 rounded-md text-sm"
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Subjects</option>
          {subjectOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b">

        <div className="bg-blue-50 border border-blue-600 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <h2 className="text-lg font-bold text-blue-600">{stats.total}</h2>
        </div>

        <div className="bg-purple-50 border border-purple-600 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">EXAM</p>
          <h2 className="text-lg font-bold text-purple-600">{stats.EXAM}</h2>
        </div>

        <div className="bg-green-50 border border-green-600 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">LAB</p>
          <h2 className="text-lg font-bold text-green-600">{stats.LAB}</h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-600 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">REPORT</p>
          <h2 className="text-lg font-bold text-yellow-600">{stats.REPORT}</h2>
        </div>

      </div>

      {/* TABLE */}
      <table className="w-full text-sm border-collapse">

        <thead className="bg-gray-50 border-b">
          <tr className="text-gray-600 text-center">
            <th className="py-3">ID</th>
            <th className="">Subject</th>
            <th className="">Title</th>
            <th className="">Type</th>
            <th className="">Marks</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedAssessments.map((a, index) => (
            <tr
              key={a.assessment_id}
              className={`text-center border-b transition hover:bg-gray-50 ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <td className="py-3 font-bold">
                #{a.assessment_id}
              </td>

              <td className="">
                {a.subject_name}
              </td>

              <td className="">
                {a.assessment_title}
              </td>

              <td className="">
                {a.assessment_type}
              </td>

              <td className="">
                {a.total_marks}
              </td>

              <td>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setEditing(a)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteId(a.assessment_id)}
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
          Showing {paginatedAssessments.length} of {filteredAssessments.length}
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
          title="Delete Assessment"
          message="Are you sure you want to delete this assessment?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

    </div>
  );
};

export default AssessmentList;