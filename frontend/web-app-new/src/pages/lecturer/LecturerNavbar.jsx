import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const LecturerNavbar = ({ activePage = "Dashboard" }) => {
  const navigate = useNavigate();

  const getItemStyle = (itemName) =>
    `flex items-center gap-2 cursor-pointer transition-colors ${
      activePage === itemName ? "text-[#2f3a4d] font-bold" : "text-[#4c5b70] hover:text-[#2f3a4d]"
    }`;

  const routeMap = {
    "Dashboard":    "/lecturer",
    "Subjects":     "/lecturer/subjects",
    "Grades & Marks": "/lecturer/marks",
    "Publish Marks":  "/lecturer/publish-marks",
    "Timetable":    "/lecturer/timetable",
    "Submissions":  "/lecturer/submissions",
    "Evaluation":   "/lecturer/evaluation",
  };

  return (
    <header className="h-[78px] bg-white border-b border-[#e7ebf1] flex items-center justify-between px-8">

      {/* LEFT */}
      <div className="flex items-center gap-10">

        {/* LOGO */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/lecturer")}
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
          <p className="text-[12px] font-semibold text-[#1f2937] whitespace-nowrap">
            Dr. Robert Fox
          </p>
          <div className="w-[30px] h-[30px] rounded-full bg-[#ead7c2] flex items-center justify-center">
            <i className="fas fa-user text-[12px] text-[#8b6b4a]"></i>
          </div>
        </div>

    </header>
  );
};

export default LecturerNavbar;
