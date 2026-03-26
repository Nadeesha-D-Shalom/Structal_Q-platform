import logo from "../../assets/logo.png";

const StudentDashboard = () => {
  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* Navbar */}
      <header className="h-[75px] bg-white border-b border-[#e6ebf2] flex items-center justify-between px-8">

        {/* Left */}
        <div className="flex items-center gap-10">

          <div className="flex items-center gap-3">
            <img src={logo} alt="logo" className="w-[50px] h-[38px]" />
            <h1 className="text-[18px] font-bold text-[#0f2f66]">
              Structal<span className="text-[#f28b22]">Q</span>
            </h1>
          </div>

          <nav className="flex items-center gap-8 text-[12px] text-[#5c6b80]">

            <div className="flex items-center gap-2 text-black font-semibold">
              <i className="fas fa-border-all text-[12px]"></i>
              Dashboard
            </div>

            <div className="flex items-center gap-2">
              <i className="fas fa-file-alt text-[12px]"></i>
              Submissions
            </div>

            <div className="flex items-center gap-2">
              <i className="fas fa-star text-[12px]"></i>
              Grades & Marks
            </div>

            <div className="flex items-center gap-2">
              <i className="fas fa-calendar text-[12px]"></i>
              Timetable
            </div>

            <div className="flex items-center gap-2">
              <i className="fas fa-question-circle text-[12px]"></i>
              Concerns
            </div>

          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">

          <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center">
            <i className="fas fa-sign-out-alt text-red-500 text-[12px]"></i>
          </div>

          <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center">
            <i className="fas fa-bell text-gray-500 text-[12px]"></i>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12px] font-semibold">Nadeesha S.</p>
              <p className="text-[10px] text-gray-400">Student ID: 202401</p>
            </div>
            <div className="w-[32px] h-[32px] bg-[#f4b37a] rounded-full"></div>
          </div>

        </div>
      </header>

      {/* Content */}
      <main className="px-[45px] pt-[30px]">

        {/* Header */}
        <h1 className="text-[22px] font-bold text-[#1b2b44]">
          Welcome, Nadeesha Shalom
        </h1>
        <p className="text-[12px] text-[#7a8aa0] mb-5">
          Year 2 • Semester 1 • Student Portal
        </p>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-[18px] mb-5">

          {/* Card 1 */}
          <div className="bg-white border rounded-[14px] px-[18px] py-[14px] shadow-sm relative">

            <div className="absolute top-3 right-3 text-[10px] bg-green-100 text-green-600 px-2 py-[2px] rounded-full">
              Updated
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-[34px] h-[34px] bg-blue-100 text-blue-500 flex items-center justify-center rounded-md">
                <i className="fas fa-file text-[12px]"></i>
              </div>
              <p className="text-[12px] text-gray-500">My Submissions</p>
            </div>

            <h2 className="text-[20px] font-bold">4</h2>
            <p className="text-[11px] text-orange-500">
              1 Pending Review
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border rounded-[14px] px-[18px] py-[14px] shadow-sm">

            <div className="flex items-center gap-3 mb-2">
              <div className="w-[34px] h-[34px] bg-purple-100 text-purple-500 flex items-center justify-center rounded-md">
                <i className="fas fa-book text-[12px]"></i>
              </div>
              <p className="text-[12px] text-gray-500">Published Marks</p>
            </div>

            <h2 className="text-[20px] font-bold">2</h2>
            <p className="text-[11px] text-gray-500">
              Highest: <span className="text-blue-500">82%</span>
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border rounded-[14px] px-[18px] py-[14px] shadow-sm">

            <div className="flex items-center gap-3 mb-2">
              <div className="w-[34px] h-[34px] bg-red-100 text-red-500 flex items-center justify-center rounded-md">
                <i className="fas fa-exclamation-circle text-[12px]"></i>
              </div>
              <p className="text-[12px] text-gray-500">Active Concerns</p>
            </div>

            <h2 className="text-[20px] font-bold">1</h2>
            <p className="text-[11px] text-gray-500">
              Subject: Software Engineering
            </p>
          </div>

        </div>

        {/* Bottom */}
        <div className="grid grid-cols-3 gap-[18px]">

          {/* Activity */}
          <div className="col-span-2 bg-white border rounded-[14px]">

            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="text-[13px] font-semibold flex items-center gap-2">
                <i className="fas fa-clock text-blue-500 text-[12px]"></i>
                Recent Activity
              </h2>
              <span className="text-[12px] text-blue-500">View All</span>
            </div>

            <div className="p-4 space-y-3 text-[12px]">

              {[
                ["Assignment submitted", "Software Engineering - SE201 Report", "2 mins ago"],
                ["Grade updated", "Database Systems Lab - 85/100", "1 hour ago"],
                ["Course material downloaded", "Data Structures - Lecture 08 Slides", "5 hours ago"],
                ["Message from Lecturer", "Please check your feedback...", "Yesterday"],
              ].map((item, i) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item[0]}</p>
                    <p className="text-gray-400 text-[11px]">{item[1]}</p>
                  </div>
                  <span className="text-gray-400 text-[10px]">{item[2]}</span>
                </div>
              ))}

            </div>
          </div>

          {/* Quick Actions */}
          <div>

            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2">
              <i className="fas fa-bolt text-orange-500 text-[12px]"></i>
              Quick Actions
            </h2>

            <div className="space-y-3">

              {[
                ["fa-upload", "Upload Submission"],
                ["fa-eye", "View Marks"],
                ["fa-exclamation", "Raise Concern"],
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-[12px] py-4 flex flex-col items-center text-[12px] shadow-sm"
                >
                  <i className={`fas ${item[0]} text-blue-500 mb-1 text-[14px]`}></i>
                  {item[1]}
                </div>
              ))}

            </div>

          </div>

        </div>

      </main>
    </div>
  );
};

export default StudentDashboard;