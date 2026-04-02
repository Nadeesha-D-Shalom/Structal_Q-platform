import { useState, useEffect } from "react";
import { createSubject, updateSubject } from "../../services/subjectService";

const SubjectForm = ({ loadSubjects, editing, setEditing, close }) => {

  const [form, setForm] = useState({
    subject_code: "",
    subject_name: "",
    program_id: "",
    term_id: "",
    credit_value: "",
  });

  useEffect(() => {
    if (editing) setForm(editing);
  }, [editing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editing) {
      await updateSubject(editing.subject_id, form);
    } else {
      await createSubject(form);
    }

    loadSubjects();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">

      <div className="bg-white w-[500px] rounded-xl p-6 shadow-lg relative">

        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-400"
        >
          ✖
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {editing ? "Edit Subject" : "Add New Subject"}
        </h2>

        {/* Year + Semester */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          <select
            className="border p-2 rounded-lg"
            onChange={(e) => setForm({...form, program_id: e.target.value})}
            value={form.program_id}
          >
            <option value="">Select Year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          <select
            className="border p-2 rounded-lg"
            onChange={(e) => setForm({...form, term_id: e.target.value})}
            value={form.term_id}
          >
            <option value="">Select Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>

        </div>

        {/* Subject Name */}
        <input
          placeholder="Subject Name"
          className="border w-full p-2 rounded-lg mb-4"
          value={form.subject_name}
          onChange={(e) => setForm({...form, subject_name: e.target.value})}
        />

        {/* Extra fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          <input
            placeholder="Code"
            className="border p-2 rounded-lg"
            value={form.subject_code}
            onChange={(e) => setForm({...form, subject_code: e.target.value})}
          />

          <input
            placeholder="Credits"
            className="border p-2 rounded-lg"
            value={form.credit_value}
            onChange={(e) => setForm({...form, credit_value: e.target.value})}
          />

        </div>

        {/* Info box */}
        <div className="bg-blue-50 text-sm text-blue-600 p-3 rounded-lg mb-4">
          Adding a subject will generate syllabus placeholder automatically.
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">

          <button onClick={close} className="text-gray-500">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg"
          >
            Save Subject
          </button>

        </div>

      </div>
    </div>
  );
};

export default SubjectForm;