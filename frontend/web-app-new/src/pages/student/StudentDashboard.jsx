import logo from "../../assets/logo.png";

const StudentDashboard = () => {
  return (
    <div className="min-h-screen bg-[#f4f6f9]">

      {/* Navbar */}
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">

        {/* Left */}
        <div className="flex items-center gap-10">

          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="logo" className="w-10 h-10 object-contain" />
            <h1 className="text-lg font-bold text-[#1e3a5f]">
              Structal<span className="text-orange-500">Q</span>
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-8 text-gray-600 text-sm">

            <div className="flex items-center gap-2 font-semibold text-black">
              <i className="fas fa-th-large"></i>
              Dashboard
            </div>

            <div className="flex items-center gap-2 hover:text-black cursor-pointer">
              <i className="fas fa-file-alt"></i>
              Submissions
            </div>

            <div className="flex items-center gap-2 hover:text-black cursor-pointer">
              <i className="fas fa-star"></i>
              Grades & Marks
            </div>

            <div className="flex items-center gap-2 hover:text-black cursor-pointer">
              <i className="fas fa-calendar"></i>
              Timetable
            </div>

            <div className="flex items-center gap-2 hover:text-black cursor-pointer">
              <i className="fas fa-question-circle"></i>
              Concerns
            </div>

          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">

          <div className="w-9 h-9 flex items-center justify-center border rounded-full">
            <i className="fas fa-sign-out-alt text-red-500"></i>
          </div>

          <div className="w-9 h-9 flex items-center justify-center border rounded-full">
            <i className="fas fa-bell text-gray-500"></i>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">Nadeesha S.</p>
              <p className="text-xs text-gray-400">Student ID: 202401</p>
            </div>
            <div className="w-10 h-10 bg-orange-300 rounded-full"></div>
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="px-10 py-6">

        {/* Header */}
        <h1 className="text-xl font-semibold text-gray-800">
          Welcome, Nadeesha Shalom
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Year 2 • Semester 1 • Student Portal
        </p>

        {/* Top Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">

          <div className="bg-white border rounded-xl p-5 shadow-sm relative">
            <div className="absolute top-4 right-4 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              Updated
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-500 flex items-center justify-center rounded-lg">
                <i className="fas fa-file"></i>
              </div>
              <p className="text-sm text-gray-500">My Submissions</p>
            </div>

            <h2 className="text-2xl font-bold">4</h2>
            <p className="text-xs text-orange-500 mt-1">
              1 Pending Review
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-500 flex items-center justify-center rounded-lg">
                <i className="fas fa-book"></i>
              </div>
              <p className="text-sm text-gray-500">Published Marks</p>
            </div>

            <h2 className="text-2xl font-bold">2</h2>
            <p className="text-xs text-gray-500 mt-1">
              Highest: <span className="text-blue-500">82%</span>
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 text-red-500 flex items-center justify-center rounded-lg">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <p className="text-sm text-gray-500">Active Concerns</p>
            </div>

            <h2 className="text-2xl font-bold">1</h2>
            <p className="text-xs text-gray-500 mt-1">
              Subject: Software Engineering
            </p>
          </div>

        </div>

        {/* Bottom */}
        <div className="grid grid-cols-3 gap-6">

          {/* Activity */}
          <div className="col-span-2 bg-white border rounded-xl shadow-sm">

            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <i className="fas fa-clock text-blue-500"></i>
                Recent Activity
              </h2>
              <span className="text-sm text-blue-500 cursor-pointer">
                View All
              </span>
            </div>

            <div className="p-5 space-y-4 text-sm">

              {["2 mins ago","1 hour ago","5 hours ago","Yesterday"].map((time, i) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <p className="font-medium">
                      {["Assignment submitted","Grade updated","Course material downloaded","Message from Lecturer"][i]}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {[
                        "Software Engineering - SE201 Report",
                        "Database Systems Lab - 85/100",
                        "Data Structures - Lecture 08 Slides",
                        "Please check your feedback..."
                      ][i]}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{time}</span>
                </div>
              ))}

            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-bolt text-orange-500"></i>
              Quick Actions
            </h2>

            <div className="space-y-4">

              {[
                { icon: "fa-upload", text: "Upload Submission" },
                { icon: "fa-eye", text: "View Marks" },
                { icon: "fa-exclamation", text: "Raise Concern" }
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-xl p-6 flex flex-col items-center shadow-sm hover:shadow-md cursor-pointer"
                >
                  <i className={`fas ${item.icon} text-blue-500 text-xl mb-2`}></i>
                  <p className="text-sm">{item.text}</p>
                </div>
              ))}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
