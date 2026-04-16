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
  { name: "Evaluation", path: "/lecturer/evaluation", icon: "fas fa-poll-h" },
];

const LecturerNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
      localStorage.removeItem("auth_user");
      navigate("/", { replace: true });
    }
  };

  const getActivePage = () => {
    const path = location.pathname;

    if (
      path.startsWith("/lecturer/submissions") ||
      path.startsWith("/analysis") ||
      path.startsWith("/lecturer/analysis") ||
      path.startsWith("/lecturer/view-submission") ||
      path.startsWith("/lecturer/ml-portal") ||
      path.startsWith("/lecturer/ml-analysis")
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

  const linkClass = (itemName, compact = false) => {
    const active = currentPage === itemName;
    return [
      "flex items-center gap-2 rounded-lg transition-colors duration-150",
      compact ? "px-3 py-2.5 text-[13px]" : "text-[11px] xl:text-[12px] px-1.5 py-2",
      active
        ? "text-[#0f2f66] font-semibold bg-[#fff5eb] lg:bg-transparent lg:border-b-2 lg:border-[#f28b22] lg:rounded-none lg:pb-1"
        : "text-[#5c6b80] hover:text-[#0f2f66] hover:bg-gray-50 lg:hover:bg-transparent",
    ].join(" ");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e7ebf1] shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 min-h-[64px] lg:min-h-[72px] py-2 lg:py-0">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-[#e4e8ee] text-[#0f2f66] hover:bg-gray-50"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"} text-[16px]`} />
          </button>

          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0"
            onClick={() => navigate("/lecturer")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/lecturer");
            }}
          >
            <img src={logo} alt="" className="w-[40px] h-[30px] sm:w-[50px] sm:h-[38px] flex-shrink-0" />
            <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0f2f66] truncate">
              Structal<span className="text-[#f28b22]">Q</span>
            </h1>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav
          className="hidden lg:flex flex-1 flex-wrap items-center justify-center gap-x-3 xl:gap-x-5 gap-y-1 font-medium min-w-0 px-2"
          aria-label="Main"
        >
          {NAV_ITEMS.map((item) => (
            <Link key={item.name} to={item.path} className={linkClass(item.name, false)}>
              <i className={`${item.icon} text-[11px] xl:text-[12px]`} />
              <span className="whitespace-nowrap">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Right: user + logout */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto lg:ml-0">
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="w-9 h-9 sm:w-[34px] sm:h-[34px] rounded-full border border-[#e4e8ee] flex items-center justify-center bg-white hover:bg-gray-50"
          >
            <i className="fas fa-sign-out-alt text-[13px] text-[#ff6b63]" />
          </button>

          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <div className="text-right max-w-[140px] xl:max-w-[200px]">
              <p className="text-[11px] sm:text-[12px] font-semibold text-[#1b2b44] truncate">
                {user?.student_name || user?.name || user?.first_name || "—"}
              </p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 truncate">
                {user?.registration_no ? `ID: ${user.registration_no}` : `Role: ${user?.role || "—"}`}
              </p>
            </div>
            <div
              className="w-8 h-8 sm:w-[32px] sm:h-[32px] bg-[#f4b37a] rounded-full flex-shrink-0"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Mobile / tablet slide-down menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[#e7ebf1] bg-white shadow-inner max-h-[min(70vh,calc(100dvh-64px))] overflow-y-auto">
          <nav className="px-4 py-3 flex flex-col gap-0.5" aria-label="Mobile main">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={linkClass(item.name, true)}
                onClick={() => setMenuOpen(false)}
              >
                <i className={`${item.icon} w-5 text-center text-[14px]`} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 sm:hidden">
            <p className="text-[12px] font-semibold text-[#1b2b44] truncate">
              {user?.student_name || user?.name || user?.first_name || "—"}
            </p>
            <p className="text-[10px] text-gray-400">
              {user?.registration_no ? `ID: ${user.registration_no}` : `Role: ${user?.role || "—"}`}
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

export default LecturerNavbar;
