import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../../assets/logo.png";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/lecturer", icon: "fas fa-border-all" },
  { name: "Marking Guide", path: "/lecturer/marking-guides", icon: "fas fa-book-open" },
  { name: "Mark Revision", path: "/lecturer/marks", icon: "fas fa-star" },
  { name: "Publish Marks", path: "/lecturer/publish-marks", icon: "fas fa-check-double" },
  { name: "Review Concerns", path: "/lecturer/review-concerns", icon: "fas fa-question-circle" },
  { name: "Timetable", path: "/lecturer/timetable", icon: "far fa-calendar-alt" },
  { name: "Submissions", path: "/lecturer/submissions", icon: "far fa-file-alt" },
  { name: "Evaluation", path: "/lecturer/evaluation", icon: "fas fa-poll-h" }
];

const LecturerNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // proceed with client-side logout even if server call fails
    } finally {
      localStorage.removeItem("auth_token");
      navigate("/", { replace: true });
    }
  };

  // ================= ACTIVE PAGE DETECTION =================
  const getActivePage = () => {
    const path = location.pathname;

    // FORCE SUBMISSIONS ACTIVE FOR THESE ROUTES
    if (
      path.startsWith("/lecturer/submissions") ||
      path.startsWith("/analysis") ||
      path.startsWith("/lecturer/analysis") ||
      path.startsWith("/lecturer/view-submission")
    ) {
      return "Submissions";
    }
    if (path.startsWith("/lecturer/marking-guides")) return "Marking Guide";
    if (path.startsWith("/lecturer/marks")) return "Mark Revision";
    if (path.startsWith("/lecturer/publish-marks")) return "Publish Marks";
    if (path.startsWith("/lecturer/review-concerns")) return "Review Concerns";
    if (path.startsWith("/lecturer/timetable")) return "Timetable";
    if (path.startsWith("/lecturer/evaluation")) return "Evaluation";

    return "Dashboard";
  };

  const currentPage = getActivePage();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d))
      .catch(() => setUser(null));
  }, []);

  // ================= STYLE =================
  const getItemStyle = (itemName) =>
    `flex items-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap ${
      currentPage === itemName
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
        <div
          onClick={handleLogout}
          title="Logout"
          className="w-[34px] h-[34px] rounded-full border border-[#e4e8ee] flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50"
        >
          <i className="fas fa-sign-out-alt text-[13px] text-[#ff6b63]"></i>
        </div>

        {/* NOTIFICATION */}
        <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50">
          <i className="fas fa-bell text-gray-500 text-[12px]"></i>
        </div>

        {/* USER */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[12px] font-semibold">
              {user?.student_name || user?.name || user?.first_name || "—"}
            </p>
            <p className="text-[10px] text-gray-400">
              {user?.registration_no ? `ID: ${user.registration_no}` : `Role: ${user?.role || "—"}`}
            </p>
          </div>
          <div className="w-[32px] h-[32px] bg-[#f4b37a] rounded-full cursor-pointer"></div>
        </div>

      </div>
    </header>
  );
};

export default LecturerNavbar;