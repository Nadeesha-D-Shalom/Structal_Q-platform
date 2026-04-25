import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useEffect, useRef, useState } from "react";

import { formatRoleLabel, normalizeRole } from "../../utils/authValidation";

const API_BASE = process.env.REACT_APP_API_URL || "";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/student", icon: "fas fa-border-all" },
  { name: "Submissions", path: "/student/submissions", icon: "fas fa-file-alt" },
  { name: "Grades & Marks", path: "/student/marks", icon: "fas fa-star" },
  { name: "Timetable", path: "/student/timetable", icon: "fas fa-calendar" },
  { name: "Concerns", path: "/student/concerns", icon: "fas fa-question-circle" }
];

const StudentNavbar = ({ activePage = "Dashboard" }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifItems, setNotifItems] = useState([]);
  const notifRef = useRef(null);

  const authHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE}/api/auth/logout`, {
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

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem("auth_user") || "null");
    } catch {
      cached = null;
    }
    if (!token) {
      if (cached) setUser(cached);
      return;
    }

    fetch(`${API_BASE}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setUser(cached);
          return;
        }
        const roleFromLogin = cached?.role;
        const roleFromSession = d.role;
        const role =
          roleFromLogin != null &&
          roleFromLogin !== "" &&
          normalizeRole(roleFromLogin) === "student" &&
          normalizeRole(roleFromSession) !== "student"
            ? roleFromLogin
            : roleFromSession ?? roleFromLogin;
        setUser({ ...cached, ...d, role: role ?? d.role });
      })
      .catch(() => setUser(cached));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const load = () => {
      fetch(`${API_BASE}/api/notifications/unread-count`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.success) setNotifUnread(Number(d.unread_count) || 0);
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    fetch(`${API_BASE}/api/notifications?limit=20`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.success && Array.isArray(d.data)) setNotifItems(d.data);
      })
      .catch(() => setNotifItems([]));
  }, [notifOpen]);

  useEffect(() => {
    const onDoc = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

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
        <div
          onClick={handleLogout}
          title="Logout"
          className="w-[34px] h-[34px] rounded-full border border-[#e4e8ee] flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50"
        >
          <i className="fas fa-sign-out-alt text-[13px] text-[#ff6b63]"></i>
        </div>

        {/* NOTIFICATION */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            title="Notifications"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-[34px] h-[34px] border rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50"
          >
            <i className="fas fa-bell text-gray-500 text-[12px]"></i>
            {notifUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-[4px] rounded-full bg-[#e11d48] text-white text-[9px] font-bold flex items-center justify-center">
                {notifUnread > 99 ? "99+" : notifUnread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[min(100vw-2rem,320px)] rounded-xl border border-[#e7ebf1] bg-white shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-[#e7ebf1] flex justify-between items-center">
                <span className="text-[12px] font-semibold text-[#0f2f66]">Notifications</span>
                <button
                  type="button"
                  className="text-[10px] text-[#3d6df2] font-semibold"
                  onClick={() =>
                    fetch(`${API_BASE}/api/notifications/read-all`, {
                      method: "POST",
                      headers: authHeaders(),
                    }).then(() => {
                      setNotifUnread(0);
                      setNotifItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
                    })
                  }
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {notifItems.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[12px] text-[#74839a]">No notifications yet</p>
                ) : (
                  notifItems.map((n) => (
                    <button
                      key={n.notification_id}
                      type="button"
                      className={`w-full text-left px-3 py-2 border-b border-[#f0f3f7] hover:bg-[#f8fafc] ${
                        n.is_read ? "opacity-75" : ""
                      }`}
                      onClick={() => {
                        if (!n.is_read) {
                          fetch(`${API_BASE}/api/notifications/${n.notification_id}/read`, {
                            method: "PATCH",
                            headers: authHeaders(),
                          }).then(() => {
                            setNotifUnread((c) => Math.max(0, c - 1));
                            setNotifItems((prev) =>
                              prev.map((x) =>
                                x.notification_id === n.notification_id ? { ...x, is_read: true } : x
                              )
                            );
                          });
                        }
                      }}
                    >
                      <p className="text-[12px] font-semibold text-[#18243d]">{n.title}</p>
                      <p className="text-[11px] text-[#5c6b80] mt-0.5 break-words">{n.message}</p>
                      <p className="text-[9px] text-[#9aa8bb] mt-1">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* USER */}
        <button
          type="button"
          onClick={() => navigate("/student/profile")}
          className="flex items-center gap-3 rounded-xl border border-transparent hover:border-[#e7ebf1] hover:bg-[#f8fafc] px-2 py-1 -mr-2 transition-colors text-left"
          title="Open profile"
        >
          <div className="text-right">
          <p className="text-[12px] font-semibold">
            {user?.student_name || user?.name || user?.first_name || "—"}
          </p>
          <p className="text-[10px] text-gray-400">
            <span className="text-[#74839a]">Role:</span> {formatRoleLabel(user?.role || "student")}
            {user?.registration_no ? ` · Student ID: ${user.registration_no}` : ""}
          </p>
          </div>
          <div className="w-[32px] h-[32px] bg-[#f4b37a] rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-user text-white text-[12px]" aria-hidden />
          </div>
        </button>

      </div>
    </header>
  );
};

export default StudentNavbar;
