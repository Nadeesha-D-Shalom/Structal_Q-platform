const GuideHeader = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow mb-6">

      <div className="grid grid-cols-4 gap-4">

        <div>
          <label className="text-sm text-gray-500">Academic Year</label>
          <select className="w-full border p-2 rounded">
            <option>2023 / 2024</option>
            <option>2024 / 2025</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500">Semester</label>
          <select className="w-full border p-2 rounded">
            <option>Semester 1</option>
            <option>Semester 2</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500">Subject</label>
          <select className="w-full border p-2 rounded">
            <option>Software Engineering</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500">Assessment</label>
          <select className="w-full border p-2 rounded">
            <option>Final Exam</option>
          </select>
        </div>

      </div>

    </div>
  );
};

export default GuideHeader;