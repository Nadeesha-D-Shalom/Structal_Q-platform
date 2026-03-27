import logo from "../../assets/logo.png";

const LecturerNavbar = () => {
  return (
    <header className="h-[78px] bg-white border-b border-[#e7ebf1] flex items-center justify-between px-8">
      
      {/* Left side */}
      <div className="flex items-center">

        {/* Brand */}
        <div className="flex items-center mr-14">
          <img
            src={logo}
            alt="StructalQ Logo"
            className="w-[55px] h-[40px] object-contain"
          />
          <h1 className="ml-3 text-[18px] leading-none font-bold text-[#0f2f66]">
            Structal<span className="text-[#f28b22]">Q</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-9 text-[12px] text-[#4c5b70] font-medium">
          <div className="flex items-center gap-2 text-[#2f3a4d]">
            <i className="fas fa-border-all text-[12px]"></i>
            <span>Dashboard</span>
          </div>

          <div className="flex items-center gap-2">
            <i className="far fa-clipboard text-[12px]"></i>
            <span>Subjects</span>
          </div>

          <div className="flex items-center gap-2">
            <i className="fas fa-star text-[12px]"></i>
            <span>Grades & Marks</span>
          </div>

          <div className="flex items-center gap-2">
            <i className="far fa-calendar-alt text-[12px]"></i>
            <span>Timetable</span>
          </div>

          <div className="flex items-center gap-2">
            <i className="far fa-file-alt text-[12px]"></i>
            <span>Submissions</span>
          </div>

          <div className="flex items-center gap-2">
            <i className="far fa-image text-[12px]"></i>
            <span>Reviews</span>
          </div>
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="w-[34px] h-[34px] rounded-full border border-[#e4e8ee] flex items-center justify-center bg-white">
          <i className="fas fa-sign-out-alt text-[13px] text-[#ff6b63]"></i>
        </div>

        <div className="w-[34px] h-[34px] rounded-full border border-[#e4e8ee] flex items-center justify-center bg-white">
          <i className="fas fa-bell text-[12px] text-[#667085]"></i>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-[12px] font-semibold text-[#1f2937] whitespace-nowrap">
            Dr. Robert Fox
          </p>
          <div className="w-[30px] h-[30px] rounded-full bg-[#ead7c2] flex items-center justify-center">
            <i className="fas fa-user text-[12px] text-[#8b6b4a]"></i>
          </div>
        </div>
      </div>

    </header>
  );
};

export default LecturerNavbar;