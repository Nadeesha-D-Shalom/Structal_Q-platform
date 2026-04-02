import { useState, useMemo } from "react";
import { deleteAssessment } from "../../services/assessmentService";
import ConfirmModal from "../../components/common/ConfirmModal";

const AssessmentList = ({ assessments, loadAssessments, setEditing }) => {
  const [deleteId, setDeleteId] = useState(null);

  // SUBJECT FILTER
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

  // STATS CALCULATION (REAL-TIME)
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
    <div className="bg-white p-5 rounded-xl shadow">

      {/*FILTER */}
      <div className="flex gap-3 mb-4">
        <select
          className="border px-3 py-1 rounded-md"
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

      {/*STATS PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-xs text-gray-500">Total</p>
          <h2 className="text-lg font-bold text-blue-600">{stats.total}</h2>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <p className="text-xs text-gray-500">EXAM</p>
          <h2 className="text-lg font-bold text-purple-600">{stats.EXAM}</h2>
        </div>

        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-xs text-gray-500">LAB</p>
          <h2 className="text-lg font-bold text-green-600">{stats.LAB}</h2>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <p className="text-xs text-gray-500">REPORT</p>
          <h2 className="text-lg font-bold text-yellow-600">{stats.REPORT}</h2>
        </div>

      </div>

      {/* TABLE */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-600 text-center">
            <th className="py-2">ID</th>
            <th>Subject</th>
            <th>Title</th>
            <th>Type</th>
            <th>Marks</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedAssessments.map((a, index) => (
            <tr
              key={a.assessment_id}
              className={`text-center border-t ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-gray-100 transition`}
            >
              <td className="font-bold py-2">{a.assessment_id}</td>
              <td>{a.subject_name}</td>
              <td>{a.assessment_title}</td>
              <td>{a.assessment_type}</td>
              <td className="font-semibold">{a.total_marks}</td>

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
      <div className="flex justify-between items-center mt-4">
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