import { useState, useMemo } from "react";
import { deleteSubject } from "../../services/subjectService";
import ConfirmModal from "../../components/common/ConfirmModal";

const SubjectList = ({ subjects, loadSubjects, setEditing }) => {
  const [deleteId, setDeleteId] = useState(null);

  // FILTER STATES
  const [yearFilter, setYearFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleDelete = async () => {
    await deleteSubject(deleteId);
    setDeleteId(null);
    loadSubjects();
  };

  // FILTER LOGIC
  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      const matchYear =
        yearFilter === "ALL" || sub.program_id === parseInt(yearFilter);

      const matchSemester =
        semesterFilter === "ALL" || sub.term_id === parseInt(semesterFilter);

      return matchYear && matchSemester;
    });
  }, [subjects, yearFilter, semesterFilter]);

  // STATS CALCULATION
const stats = useMemo(() => {
  const counts = {
    total: filteredSubjects.length,
    y1: 0,
    y2: 0,
    y3: 0,
    y4: 0,
  };

  filteredSubjects.forEach((sub) => {
    if (sub.program_id === 1) counts.y1++;
    if (sub.program_id === 2) counts.y2++;
    if (sub.program_id === 3) counts.y3++;
    if (sub.program_id === 4) counts.y4++;
  });

  return counts;
}, [filteredSubjects]);

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

  const paginatedSubjects = filteredSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-xl shadow p-5">

      {/*STATS PANEL */}
<div className="mt-2 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">

  {/* Y1 */}
  <div className="bg-green-50 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-500">Year 1</p>
    <h2 className="text-xl font-bold text-green-600">{stats.y1}</h2>
  </div>

  {/* Y2 */}
  <div className="bg-yellow-50 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-500">Year 2</p>
    <h2 className="text-xl font-bold text-yellow-600">{stats.y2}</h2>
  </div>

  {/* Y3 */}
  <div className="bg-purple-50 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-500">Year 3</p>
    <h2 className="text-xl font-bold text-purple-600">{stats.y3}</h2>
  </div>

  {/* Y4 */}
  <div className="bg-red-50 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-500">Year 4</p>
    <h2 className="text-xl font-bold text-red-600">{stats.y4}</h2>
  </div>

</div>

      {/*FILTERS */}
      <div className="flex gap-3 mb-4">

        <select
          className="border px-3 py-1 rounded-md"
          onChange={(e) => {
            setYearFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Years</option>
          <option value="1">Y1</option>
          <option value="2">Y2</option>
          <option value="3">Y3</option>
          <option value="4">Y4</option>
        </select>

        <select
          className="border px-3 py-1 rounded-md"
          onChange={(e) => {
            setSemesterFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Semesters</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
        </select>

      </div>

      {/* TABLE */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-600 text-center">
            <th className="py-2">ID</th>
            <th>Code</th>
            <th>Name</th>
            <th>Year</th>
            <th>Semester</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedSubjects.map((sub, index) => (
            <tr
              key={sub.subject_id}
              className={`text-center border-t ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-blue-50 transition`}
            >
              <td className="font-bold py-2">{sub.subject_id}</td>
              <td>{sub.subject_code}</td>
              <td>{sub.subject_name}</td>
              <td>
                <span >
                  Y{sub.program_id}
                </span>
              </td>
              <td>
                <span >
                  S{sub.term_id}
                </span>
              </td>

              {/* ACTIONS */}
              <td>
                <div className="flex justify-center gap-2">

                  <button
                    onClick={() => setEditing(sub)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteId(sub.subject_id)}
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
          Showing {paginatedSubjects.length} of {filteredSubjects.length}
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
          title="Delete Subject"
          message="Are you sure you want to delete this subject?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

    </div>
  );
};

export default SubjectList;