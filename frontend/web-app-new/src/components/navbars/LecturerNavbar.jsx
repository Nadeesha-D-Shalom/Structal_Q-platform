import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  "Dashboard", 
  "Subjects", 
  "Mark Revision", 
  "Publish Marks", 
  "Review Concerns", 
  "Timetable", 
  "Submissions", 
  "Evaluation"
];

const LecturerNavbar = ({ activePage = "Dashboard" }) => {
<<<<<<< HEAD
  const navigate = useNavigate();

  const handleNavigation = (item) => {
    // Convert navigation items to routes
    const routeMap = {
      "Dashboard": "/lecturer",
      "Subjects": "/lecturer/subjects",
      "Mark Revision": "/lecturer/marks",
      "Publish Marks": "/lecturer/publish-marks",
      "Review Concerns": "/lecturer/review-concerns",
      "Timetable": "/lecturer/timetable",
      "Submissions": "/lecturer/submissions",
      "Evaluation": "/lecturer/evaluation"
    };
    
    navigate(routeMap[item]);
  };

  return (
    <header className="h-[75px] bg-white border-b border-[#e6ebf2] flex items-center justify-between px-8">
=======

  const getItemStyle = (itemName) =>
    `flex items-center gap-2 cursor-pointer transition-colors ${
      activePage === itemName
        ? "text-[#2f3a4d] font-bold"
        : "text-[#4c5b70] hover:text-[#2f3a4d]"
    }`;

  return (
    <header className="h-[78px] bg-white border-b border-[#e7ebf1] flex items-center justify-between px-8">

      {/* Left side */}
      <div className="flex items-center">
>>>>>>> 728836d (this is backend part)

      {/* Left */}
      <div className="flex items-center gap-10">

        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/lecturer")}>
          <img src={logo} alt="logo" className="w-[50px] h-[38px]" />
          <h1 className="text-[18px] font-bold text-[#0f2f66]">
            Structal<span className="text-[#f28b22]">Q</span>
          </h1>
        </div>

<<<<<<< HEAD
        <nav className="flex items-center gap-6 text-[12px] text-[#5c6b80]">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item;
            const iconMap = {
              "Dashboard": "fas fa-border-all",
              "Subjects": "far fa-clipboard",
              "Mark Revision": "fas fa-star",
              "Publish Marks": "fas fa-check-double",
              "Review Concerns": "fas fa-question-circle",
              "Timetable": "far fa-calendar-alt",
              "Submissions": "far fa-file-alt",
              "Evaluation": "fas fa-poll-h"
            };
            
            return (
              <div 
                key={item}
                onClick={() => handleNavigation(item)}
                className={`flex items-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap ${
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
                <span>{item}</span>
              </div>
            );
          })}
=======
        {/* Navigation */}
        <nav className="flex items-center gap-9 text-[12px] font-medium">

          <Link to="/lecturer" className={getItemStyle("Dashboard")}>
            <i className="fas fa-border-all text-[12px]"></i>
            <span>Dashboard</span>
          </Link>

          <Link to="/subjects" className={getItemStyle("Subjects")}>
            <i className="far fa-clipboard text-[12px]"></i>
            <span>Subjects</span>
          </Link>

          <Link to="/grades" className={getItemStyle("Grades & Marks")}>
            <i className="fas fa-star text-[12px]"></i>
            <span>Grades & Marks</span>
          </Link>

          <Link to="/publish-marks" className={getItemStyle("Publish Marks")}>
            <i className="fas fa-check-double text-[12px]"></i>
            <span>Publish Marks</span>
          </Link>

          <Link to="/timetable" className={getItemStyle("Timetable")}>
            <i className="far fa-calendar-alt text-[12px]"></i>
            <span>Timetable</span>
          </Link>

          <Link to="/submissions" className={getItemStyle("Submissions")}>
            <i className="far fa-file-alt text-[12px]"></i>
            <span>Submissions</span>
          </Link>

          <Link to="/evaluation" className={getItemStyle("Evaluation")}>
            <i className="fas fa-poll-h text-[12px]"></i>
            <span>Evaluation</span>
          </Link>

>>>>>>> 728836d (this is backend part)
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

<<<<<<< HEAD
        <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <i className="fas fa-sign-out-alt text-red-500 text-[12px]"></i>
=======
        <div className="w-[34px] h-[34px] rounded-full border border-[#e4e8ee] flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50">
          <i className="fas fa-sign-out-alt text-[13px] text-[#ff6b63]"></i>
>>>>>>> 728836d (this is backend part)
        </div>

        <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <i className="fas fa-bell text-gray-500 text-[12px]"></i>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[12px] font-semibold">Dr. Robert Fox</p>
            <p className="text-[10px] text-gray-400">Lecturer ID: 202401</p>
          </div>
          <div className="w-[32px] h-[32px] bg-[#f4b37a] rounded-full cursor-pointer"></div>
        </div>
<<<<<<< HEAD

      </div>
=======
>>>>>>> 728836d (this is backend part)

      </div>
    </header>
  );
};

export default LecturerNavbar;