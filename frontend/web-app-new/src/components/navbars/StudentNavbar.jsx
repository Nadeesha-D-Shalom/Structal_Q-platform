import logo from "../../assets/logo.png";

const StudentNavbar = () => {
  return (
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
  );
};

export default StudentNavbar;