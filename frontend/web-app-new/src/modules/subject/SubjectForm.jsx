import { useState, useEffect } from "react";
import { createSubject, updateSubject } from "../../services/subjectService";

const SubjectForm = ({ loadSubjects, editing, close, subjects = [] }) => {

  const [form, setForm] = useState({
    subject_code: "",
    subject_name: "",
    program_id: "",
    term_id: "",
    credit_value: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) setForm(editing);
  }, [editing]);

  // VALIDATION
  const validate = () => {
    let newErrors = {};



    // NUMBER VALIDATION
    if (form.credit_value && isNaN(form.credit_value)) {
      newErrors.credit_value = "Must be a number";
    }

    // RANGE
    if (form.credit_value && (form.credit_value <= 0 || form.credit_value > 10)) {
      newErrors.credit_value = "1 - 10 only";
    }

    // DUPLICATE CHECK
    const duplicate = subjects.find(
      (s) =>
        s.subject_code === form.subject_code &&
        s.subject_id !== editing?.subject_id
    );

    if (duplicate) {
      newErrors.subject_code = "Subject code already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validate();
  }, [form]);

  const isValid =
    Object.keys(errors).length === 0 &&
    form.subject_code &&
    form.subject_name &&
    form.program_id &&
    form.term_id &&
    form.credit_value;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        ...form,
        program_id: Number(form.program_id),
        term_id: Number(form.term_id),
        credit_value: Number(form.credit_value),
      };

      if (editing) {
        await updateSubject(editing.subject_id, payload);
      } else {
        await createSubject(payload);
      }

      loadSubjects();
      close();

    } catch (err) {
      // backend duplicate fallback
      if (err.response?.data?.message?.includes("exists")) {
        setErrors(prev => ({
          ...prev,
          subject_code: "Subject code already exists"
        }));
      }
    }
  };

  const allFieldsFilled =
    form.subject_code &&
    form.subject_name &&
    form.program_id &&
    form.term_id &&
    form.credit_value;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">

      <div className="bg-white w-[500px] rounded-xl p-6 shadow-lg relative">

        {/* CLOSE */}
        <button onClick={close} className="absolute top-4 right-4 text-gray-400">
          ✖
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {editing ? "Edit Subject" : "Add New Subject"}
        </h2>

        {/* YEAR + SEM */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          <div>
            <select
              className="border p-2 rounded-lg w-full"
              value={form.program_id}
              onChange={(e) => setForm({...form, program_id: e.target.value})}
            >
              <option value="">Year</option>
              <option value="1">Y1</option>
              <option value="2">Y2</option>
              <option value="3">Y3</option>
              <option value="4">Y4</option>
            </select>
            {errors.program_id && <p className="text-red-500 text-xs">{errors.program_id}</p>}
          </div>

          <div>
            <select
              className="border p-2 rounded-lg w-full"
              value={form.term_id}
              onChange={(e) => setForm({...form, term_id: e.target.value})}
            >
              <option value="">Semester</option>
              <option value="1">S1</option>
              <option value="2">S2</option>
            </select>
            {errors.term_id && <p className="text-red-500 text-xs">{errors.term_id}</p>}
          </div>

        </div>

        {/* NAME */}
        <div className="mb-3">
          <input
            placeholder="Subject Name"
            className="border w-full p-2 rounded-lg"
            value={form.subject_name}
            onChange={(e) => setForm({...form, subject_name: e.target.value})}
          />
          {errors.subject_name && <p className="text-red-500 text-xs">{errors.subject_name}</p>}
        </div>

        {/* CODE + CREDIT */}
        <div className="grid grid-cols-2 gap-4 mb-3">

          <div>
            <input
              placeholder="Code"
              className="border p-2 rounded-lg w-full"
              value={form.subject_code}
              onChange={(e) => setForm({...form, subject_code: e.target.value.toUpperCase()})}
            />
            {errors.subject_code && <p className="text-red-500 text-xs">{errors.subject_code}</p>}
          </div>

          <div>
            <input
              type="number"
              placeholder="Credits"
              className="border p-2 rounded-lg w-full"
              value={form.credit_value}
              onChange={(e) => setForm({...form, credit_value: e.target.value})}
            />
            {errors.credit_value && <p className="text-red-500 text-xs">{errors.credit_value}</p>}
          </div>

        </div>

        {/* GLOBAL REQUIRED MESSAGE (ONLY IF EMPTY) */}
        {!allFieldsFilled && (
          <div className="text-sm text-red-600 p-2 ">
            All fields are required.
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex justify-end gap-4">

          <button onClick={close} className="text-gray-500">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`px-5 py-2 rounded-lg text-white ${
              isValid
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Save Subject
          </button>

        </div>

      </div>
    </div>
  );
};

export default SubjectForm;