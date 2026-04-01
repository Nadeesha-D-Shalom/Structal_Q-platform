import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const NAV_ITEMS = ["Dashboard", "Submissions", "Grades & Marks", "Timetable", "Concerns"];

const StudentNavbar = ({ activePage = "Dashboard" }) => {
  const navigate = useNavigate();

  const handleNavigation = (item) => {
    const routeMap = {
      "Dashboard":     "/student",
      "Submissions":   "/student/submissions",
      "Grades & Marks": "/student/marks",
      "Timetable":     "/student/timetable",
      "Concerns":      "/student/concerns"
    };
    navigate(routeMap[item]);
  };

  return (
    <header className="h-[75px] bg-white border-b border-[#e6ebf2] flex items-center justify-between px-8">

      {/* Left */}
      <div className="flex items-center gap-10">

        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/student")}>
          <img src={logo} alt="logo" className="w-[50px] h-[38px]" />
          <h1 className="text-[18px] font-bold text-[#0f2f66]">
            Structal<span className="text-[#f28b22]">Q</span>
          </h1>
        </div>

        <nav className="flex items-center gap-8 text-[12px] text-[#5c6b80]">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item;
            const iconMap = {
              "Dashboard":     "fas fa-border-all",
              "Submissions":   "fas fa-file-alt",
              "Grades & Marks": "fas fa-star",
              "Timetable":     "fas fa-calendar",
              "Concerns":      "fas fa-question-circle"
            };

            return (
              <div
                key={item}
                onClick={() => handleNavigation(item)}
                className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "text-black font-semibold"
                    : "text-[#5c6b80] hover:text-[#0f2f66]"
                }`}
                style={{
                  borderBottom: isActive ? "2px solid #f28b22" : "2px solid transparent",
                  paddingBottom: "4px",
                  marginBottom: "-4px"
                }}
              >
                <i className={`${iconMap[item]} text-[12px]`}></i>
                {item}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <i className="fas fa-sign-out-alt text-red-500 text-[12px]"></i>
        </div>

        <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <i className="fas fa-bell text-gray-500 text-[12px]"></i>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[12px] font-semibold">Nadeesha S.</p>
            <p className="text-[10px] text-gray-400">Student ID: 202401</p>
          </div>
          <div className="w-[32px] h-[32px] bg-[#f4b37a] rounded-full cursor-pointer"></div>
        </div>

      </div>
    </header>
  );
};

export default StudentNavbar;
