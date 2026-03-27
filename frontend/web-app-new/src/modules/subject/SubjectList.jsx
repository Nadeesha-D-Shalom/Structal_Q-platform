import { useState } from "react";
import { deleteSubject } from "../../services/subjectService";
import ConfirmModal from "../../components/common/ConfirmModal";

const SubjectList = ({ subjects, loadSubjects, setEditing }) => {
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async () => {
    await deleteSubject(deleteId);
    setDeleteId(null);
    loadSubjects();
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">

      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-center">
            <th>ID</th>
            <th>Code</th>
            <th>Name</th>
            <th>Year</th>
            <th>Semester</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {subjects.map((sub) => (
            <tr key={sub.subject_id} className="border-t">
              
              {/* ID */}
              <td>{sub.subject_id}</td>

              {/* CODE */}
              <td className="font-medium text-blue-600">
                {sub.subject_code}
              </td>

              {/* NAME */}
              <td>{sub.subject_name}</td>

              {/* YEAR */}
              <td>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs">
                  Y{sub.program_id}
                </span>
              </td>

              {/* SEMESTER */}
              <td>Semester {sub.term_id}</td>

              {/* ACTIONS */}
              <td className="flex gap-3">
                <button 
                  onClick={() => setEditing(sub)}
                  className="text-blue-500 hover:scale-110"
                >
                  ✏️
                </button>

                <button
                  onClick={() => setDeleteId(sub.subject_id)}
                  className="text-red-500 hover:scale-110"
                >
                  🗑️
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

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