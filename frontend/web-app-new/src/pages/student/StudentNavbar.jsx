import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/student", icon: "fas fa-border-all" },
  { name: "Submissions", path: "/student/submissions", icon: "fas fa-file-alt" },
  { name: "Grades & Marks", path: "/student/marks", icon: "fas fa-star" },
  { name: "Timetable", path: "/student/timetable", icon: "fas fa-calendar" },
  { name: "Concerns", path: "/student/concerns", icon: "fas fa-question-circle" }
];

const StudentNavbar = ({ activePage = "Dashboard" }) => {
  const navigate = useNavigate();

  const getItemStyle = (itemName) =>
    `flex items-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap ${
      activePage === itemName
        ? "text-black font-semibold border-b-2 border-[#f28b22] pb-1"
        : "text-[#5c6b80] hover:text-[#0f2f66]"
    }`;

  return (
    <header className="h-[78px] bg-white border-b border-[#e7ebf1] flex items-center justify-between px-8">

      {/* LEFT */}
      <div className="flex items-center gap-10">

        {/* LOGO */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/student")}
        >
          <img src={logo} alt="logo" className="w-[50px] h-[38px]" />
          <h1 className="text-[18px] font-bold text-[#0f2f66]">
            Structal<span className="text-[#f28b22]">Q</span>
          </h1>
        </div>

        {/* NAVIGATION */}
        <nav className="flex items-center gap-8 text-[12px] font-medium">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={getItemStyle(item.name)}
            >
              <i className={`${item.icon} text-[12px]`}></i>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* LOGOUT */}
        <div className="w-[34px] h-[34px] rounded-full border border-[#e4e8ee] flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50">
          <i className="fas fa-sign-out-alt text-[13px] text-[#ff6b63]"></i>
        </div>

        {/* NOTIFICATION */}
        <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50">
          <i className="fas fa-bell text-gray-500 text-[12px]"></i>
        </div>

        {/* USER */}
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
