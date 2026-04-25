import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import logo from "../../assets/logo.png";
import { formatRoleLabel } from "../../utils/authValidation";

const API_BASE = process.env.REACT_APP_API_URL || "";

const NAV_ITEMS = [
  { name: "Dashboard",       path: "/lecturer",                  icon: "fas fa-border-all" },
  { name: "Subjects",        path: "/lecturer/subjects",         icon: "fas fa-layer-group" },
  { name: "Assignments",     path: "/lecturer/assignments",      icon: "fas fa-tasks" },
  { name: "Groups",          path: "/lecturer/groups",           icon: "fas fa-users" },
  { name: "Marking Guide",   path: "/lecturer/marking-guides",   icon: "fas fa-book-open" },
  { name: "Mark Revision",   path: "/lecturer/marks",            icon: "fas fa-star" },
  { name: "Publish Marks",   path: "/lecturer/publish-marks",    icon: "fas fa-check-double" },
  { name: "Review Concerns", path: "/lecturer/review-concerns",  icon: "fas fa-question-circle" },
  { name: "Timetable",       path: "/lecturer/timetable",        icon: "far fa-calendar-alt" },
  { name: "Submissions",     path: "/lecturer/submissions",      icon: "far fa-file-alt" },
  { name: "Evaluation",      path: "/lecturer/evaluation",       icon: "fas fa-poll-h" },
  { name: "Profile",         path: "/lecturer/profile",          icon: "fas fa-user-circle" },
];

// First 7 items shown in the bar; the rest collapse into "More"
const VISIBLE_COUNT = 7;
const PRIMARY_ITEMS  = NAV_ITEMS.slice(0, VISIBLE_COUNT);
const OVERFLOW_ITEMS = NAV_ITEMS.slice(VISIBLE_COUNT);

const LecturerNavbar = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [moreOpen,    setMoreOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user,        setUser]        = useState(null);
  const moreRef    = useRef(null);
  const profileRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setMoreOpen(false); }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current    && !moreRef.current.contains(e.target))    setMoreOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { /* swallow */ } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      navigate("/", { replace: true });
    }
  };

  const getActivePage = () => {
    const p = location.pathname;
    if (
      p.startsWith("/lecturer/submissions") || p.startsWith("/analysis") ||
      p.startsWith("/lecturer/analysis")    || p.startsWith("/lecturer/view-submission") ||
      p.startsWith("/lecturer/ml-portal")   || p.startsWith("/lecturer/ml-analysis")
    ) return "Submissions";
    if (p.startsWith("/lecturer/subjects"))        return "Subjects";
    if (p.startsWith("/lecturer/assignments"))     return "Assignments";
    if (p.startsWith("/lecturer/groups"))          return "Groups";
    if (p.startsWith("/lecturer/marking-guides"))  return "Marking Guide";
    if (p.startsWith("/lecturer/marks"))           return "Mark Revision";
    if (p.startsWith("/lecturer/publish-marks"))   return "Publish Marks";
    if (p.startsWith("/lecturer/review-concerns")) return "Review Concerns";
    if (p.startsWith("/lecturer/timetable"))       return "Timetable";
    if (p.startsWith("/lecturer/evaluation"))      return "Evaluation";
    if (p.startsWith("/lecturer/profile"))         return "Profile";
    return "Dashboard";
  };

  const currentPage    = getActivePage();
  const overflowActive = OVERFLOW_ITEMS.some((i) => i.name === currentPage);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    fetch(`${API_BASE}/api/auth/session`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setUser(null);
          return;
        }
        try {
          const raw = localStorage.getItem("auth_user");
          if (raw) {
            const cached = JSON.parse(raw);
            setUser({
              ...cached,
              ...d,
              role: d.role ?? cached.role,
              registration_no: d.registration_no ?? cached.registration_no,
            });
            return;
          }
        } catch {
          /* ignore */
        }
        setUser(d);
      })
      .catch(() => setUser(null));
  }, []);

  const displayName =
    user?.name || user?.student_name || [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || "User";
  const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  /** Same pattern as StudentNavbar: label role, optional staff/student ID */
  const roleLine = (
    <>
      <span className="text-[#74839a]">Role:</span> {formatRoleLabel(user?.role)}
      {user?.registration_no ? (
        <span className="text-gray-400"> · ID: {user.registration_no}</span>
      ) : null}
    </>
  );
  /* ── class helpers ── */
  const desktopLinkClass = (name) => {
    const active = currentPage === name;
    return [
      "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium",
      "whitespace-nowrap transition-colors duration-150",
      active
        ? "text-[#f28b22]"
        : "text-[#5c6b80] hover:text-[#0f2f66] hover:bg-gray-50",
    ].join(" ");
  };

  const mobileLinkClass = (name) => {
    const active = currentPage === name;
    return [
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150",
      active
        ? "bg-[#fff5eb] text-[#f28b22] font-semibold"
        : "text-[#5c6b80] hover:bg-gray-50 hover:text-[#0f2f66]",
    ].join(" ");
  };

  /* ── render ── */
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e7ebf1] shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-between h-[64px] gap-3">

        {/* Hamburger — mobile only */}
        <button
          type="button"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-[#e4e8ee] text-[#0f2f66] hover:bg-gray-50 flex-shrink-0"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"} text-[15px]`} />
        </button>

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          onClick={() => navigate("/lecturer")}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate("/lecturer"); }}
        >
          <img src={logo} alt="StructalQ" className="w-[42px] h-[32px]" />
          <span className="hidden sm:block text-[17px] font-bold text-[#0f2f66]">
            Structal<span className="text-[#f28b22]">Q</span>
          </span>
        </div>

        {/* Thin divider */}
        <div className="hidden lg:block w-px h-6 bg-[#e4e8ee] flex-shrink-0" />

        {/* Desktop nav — single row */}
        <nav className="hidden lg:flex flex-1 items-center gap-0.5 min-w-0" aria-label="Main">
          {PRIMARY_ITEMS.map((item) => (
            <Link key={item.name} to={item.path} className={desktopLinkClass(item.name)}>
              {/* Orange underline for active */}
              {currentPage === item.name && (
                <span className="absolute bottom-[-18px] left-1 right-1 h-[2px] bg-[#f28b22] rounded-full" />
              )}
              <i className={`${item.icon} text-[11px] opacity-75`} />
              {item.name}
            </Link>
          ))}

          {/* "More" overflow dropdown */}
          {OVERFLOW_ITEMS.length > 0 && (
            <div className="relative ml-0.5" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className={[
                  "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium",
                  "whitespace-nowrap transition-colors duration-150",
                  overflowActive || moreOpen
                    ? "text-[#f28b22]"
                    : "text-[#5c6b80] hover:text-[#0f2f66] hover:bg-gray-50",
                ].join(" ")}
              >
                {(overflowActive || moreOpen) && (
                  <span className="absolute bottom-[-18px] left-1 right-1 h-[2px] bg-[#f28b22] rounded-full" />
                )}
                More
                <i className={`fas fa-chevron-down text-[9px] transition-transform duration-150 ${moreOpen ? "rotate-180" : ""}`} />
              </button>

              {moreOpen && (
                <div className="absolute top-[calc(100%+12px)] left-0 w-52 bg-white border border-[#e7ebf1] rounded-xl shadow-lg py-1.5 z-50">
                  {OVERFLOW_ITEMS.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={[
                        "flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors",
                        currentPage === item.name
                          ? "text-[#f28b22] bg-[#fff5eb]"
                          : "text-[#5c6b80] hover:bg-gray-50 hover:text-[#0f2f66]",
                      ].join(" ")}
                    >
                      <i className={`${item.icon} w-4 text-center text-[12px] opacity-75`} />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right: logout + profile */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Logout icon button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="w-8 h-8 rounded-full border border-[#e4e8ee] flex items-center justify-center
                       bg-white hover:bg-[#fff0ef] transition-colors"
          >
            <i className="fas fa-sign-out-alt text-[12px] text-[#ff6b63]" />
          </button>

          {/* Profile pill */}
          <div className="hidden sm:block relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-full border border-[#e4e8ee]
                         hover:border-[#d0d7e2] bg-white transition-colors"
            >
              <div className="text-right leading-tight">
                <p className="text-[12px] font-semibold text-[#1b2b44] max-w-[130px] truncate">{displayName}</p>
                <p className="text-[10px] text-gray-400">{roleLine}</p>
              </div>
              {/* Avatar */}
              <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#f4b37a] to-[#f28b22]
                              flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <i className={`fas fa-chevron-down text-[9px] text-gray-400 transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-white border border-[#e7ebf1] rounded-xl shadow-lg py-1 z-50">
                <div className="px-4 py-3 border-b border-[#f0f3f7]">
                  <p className="text-[13px] font-semibold text-[#1b2b44] truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-400">{roleLine}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/lecturer/profile");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#1b2b44]
                             hover:bg-gray-50 transition-colors font-medium"
                >
                  <i className="fas fa-user text-[12px]" />
                  My profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#ff6b63]
                             hover:bg-[#fff0ef] transition-colors font-medium"
                >
                  <i className="fas fa-sign-out-alt text-[12px]" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[#e7ebf1] bg-white shadow-inner max-h-[min(70vh,calc(100dvh-64px))] overflow-y-auto">
          <nav className="px-3 py-3 flex flex-col gap-0.5" aria-label="Mobile main">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={mobileLinkClass(item.name)}
                onClick={() => setMenuOpen(false)}
              >
                <i className={`${item.icon} w-5 text-center text-[13px]`} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile user info row */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 sm:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f4b37a] to-[#f28b22]
                              flex items-center justify-center flex-shrink-0">
                <span className="text-[12px] font-bold text-white">{initials}</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1b2b44]">{displayName}</p>
                <p className="text-[11px] text-gray-400">{roleLine}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default LecturerNavbar;