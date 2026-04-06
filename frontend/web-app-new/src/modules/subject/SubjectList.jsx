import { useState, useMemo } from "react";
import { deleteSubject } from "../../services/subjectService";
import ConfirmModal from "../../components/common/ConfirmModal";

const SubjectList = ({ subjects, loadSubjects, setEditing }) => {
  const [deleteId, setDeleteId] = useState(null);

  // FILTERS
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

  // STATS
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

  // PAGINATION
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

  const paginatedSubjects = filteredSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">

      {/* FILTERS */}
      <div className="flex gap-3 p-4 border-b bg-gray-50">

        <select
          className="border px-3 py-2 rounded-md text-sm"
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
          className="border px-3 py-2 rounded-md text-sm"
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

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b">

        <div className="bg-green-50 border border-green-600 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 1</p>
          <h2 className="text-lg font-bold text-green-600">{stats.y1}</h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-600 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 2</p>
          <h2 className="text-lg font-bold text-yellow-600">{stats.y2}</h2>
        </div>

        <div className="bg-purple-50 border border-purple-600 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 3</p>
          <h2 className="text-lg font-bold text-purple-600">{stats.y3}</h2>
        </div>

        <div className="bg-red-50 border border-red-600 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 4</p>
          <h2 className="text-lg font-bold text-red-600">{stats.y4}</h2>
        </div>

      </div>

      {/* TABLE */}
      <table className="w-full text-sm border-collapse">

        <thead className="bg-gray-50 border-b">
          <tr className="text-gray-600 text-center">
            <th className="py-3 ">ID</th>
            <th className="">Code</th>
            <th className="">Name</th>
            <th className="">Year</th>
            <th className="">Semester</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedSubjects.map((sub, index) => (
            <tr
              key={sub.subject_id}
              className={`text-center border-b transition hover:bg-gray-50 ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <td className="py-3 font-bold">
                #{sub.subject_id}
              </td>

              <td className="">
                {sub.subject_code}
              </td>

              <td className="">
                {sub.subject_name}
              </td>

              <td className="">
                Y{sub.program_id}
              </td>

              <td className="">
                S{sub.term_id}
              </td>

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
      <div className="flex justify-between items-center p-4 border-t">

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