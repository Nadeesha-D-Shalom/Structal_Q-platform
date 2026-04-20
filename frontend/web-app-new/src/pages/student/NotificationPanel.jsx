import { useState, useEffect, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "";
const apiUrl = (path) => `${API_BASE}${path}`;

const getAuthHeaders = (json = true) => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

const getStudentId = () => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u.user_id ?? u.student_id ?? null;
  } catch {
    return null;
  }
};

// ── Notification type config ────────────────────────────────────────────────
const NOTIFICATION_CONFIG = {
  concern_response: {
    icon: "💬",
    color: "#3c74ff",
    bg: "#eef2ff",
    label: "Concern Response"
  },
  mark_published: {
    icon: "📊",
    color: "#10b981",
    bg: "#d1fae5",
    label: "Marks Published"
  },
  mark_revised: {
    icon: "✏️",
    color: "#f59e0b",
    bg: "#fef3c7",
    label: "Mark Revised"
  },
  general: {
    icon: "🔔",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    label: "Notification"
  }
};

// ── Time ago helper ──────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
};

// ── Main NotificationPanel Component ────────────────────────────────────────
export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const panelRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Fetch notifications ────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    const studentId = getStudentId();
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/notifications/student/${studentId}`), {
        headers: getAuthHeaders(false)
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ── Mark single notification as read ──────────────────────────────────────
  const handleMarkRead = async (notificationId) => {
    // Optimistically update UI immediately
    setNotifications(prev =>
      prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
    );
    try {
      await fetch(apiUrl(`/api/notifications/${notificationId}/read`), {
        method: "PUT",
        headers: getAuthHeaders(false)
      });
    } catch (err) {
      console.error("Error marking notification as read:", err);
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: false } : n)
      );
    }
  };

  // ── Mark all as read ───────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    const studentId = getStudentId();
    if (!studentId) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await fetch(apiUrl(`/api/notifications/student/${studentId}/read-all`), {
        method: "PUT",
        headers: getAuthHeaders(false)
      });
    } catch (err) {
      console.error("Error marking all as read:", err);
      fetchNotifications();
    }
  };

  const filtered = filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const cfg = (type) => NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.general;

  return (
    <div style={wrapperStyle} ref={panelRef}>
      {/* ── Bell Button ── */}
      <button
        onClick={() => { setOpen(prev => !prev); if (!open) fetchNotifications(); }}
        style={bellBtnStyle}
        title="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={badgeStyle}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div style={panelStyle}>
          {/* Panel Header */}
          <div style={panelHeaderStyle}>
            <div style={panelTitleGroupStyle}>
              <h3 style={panelTitleStyle}>Notifications</h3>
              {unreadCount > 0 && (
                <span style={unreadPillStyle}>{unreadCount} new</span>
              )}
            </div>
            <div style={panelActionsStyle}>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} style={markAllBtnStyle}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={closePanelBtnStyle}>✕</button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={tabsStyle}>
            <button
              onClick={() => setFilter("all")}
              style={tabBtnStyle(filter === "all")}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              style={tabBtnStyle(filter === "unread")}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div style={listStyle}>
            {loading ? (
              <div style={centerMsgStyle}>
                <div style={miniSpinnerStyle} />
                <p style={mutedTextStyle}>Loading...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={centerMsgStyle}>
                <span style={{ fontSize: "36px" }}>
                  {filter === "unread" ? "✅" : "🔔"}
                </span>
                <p style={emptyTitleStyle}>
                  {filter === "unread" ? "All caught up!" : "No notifications yet"}
                </p>
                <p style={mutedTextStyle}>
                  {filter === "unread"
                    ? "You have no unread notifications."
                    : "Notifications about your marks and concerns will appear here."}
                </p>
              </div>
            ) : (
              filtered.map(notification => {
                const c = cfg(notification.notification_type);
                const isRead = notification.is_read;
                return (
                  <div
                    key={notification.notification_id}
                    onClick={() => !isRead && handleMarkRead(notification.notification_id)}
                    style={notifItemStyle(isRead)}
                    title={isRead ? "" : "Click to mark as read"}
                  >
                    {/* Unread indicator dot */}
                    {!isRead && <div style={unreadDotStyle(c.color)} />}

                    {/* Icon */}
                    <div style={notifIconStyle(c.bg)}>
                      <span style={{ fontSize: "18px" }}>{c.icon}</span>
                    </div>

                    {/* Content */}
                    <div style={notifContentStyle}>
                      <div style={notifTopRowStyle}>
                        <span style={notifTypeLabelStyle(c.color, c.bg)}>
                          {c.label}
                        </span>
                        <span style={notifTimeStyle}>{timeAgo(notification.created_at)}</span>
                      </div>
                      <p style={notifTitleStyle(isRead)}>{notification.title}</p>
                      <p style={notifMessageStyle(isRead)}>{notification.message}</p>
                      {notification.concern_id && (
                        <span style={notifMetaStyle}>
                          Concern: {notification.concern_id}
                        </span>
                      )}
                      {notification.assignment_name && (
                        <span style={notifMetaStyle}>
                          {notification.assignment_name}
                        </span>
                      )}
                    </div>

                    {/* Read indicator */}
                    {isRead && (
                      <div style={readCheckStyle} title="Read">✓</div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          {notifications.length > 0 && (
            <div style={panelFooterStyle}>
              <button onClick={fetchNotifications} style={refreshBtnStyle}>
                🔄 Refresh
              </button>
              <span style={footerCountStyle}>
                {notifications.length} total notification{notifications.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const wrapperStyle = {
  position: "relative",
  display: "inline-block"
};

const bellBtnStyle = {
  position: "relative",
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  border: "1px solid #e4e8ee",
  backgroundColor: "#fff",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s",
  padding: 0
};

const badgeStyle = {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  backgroundColor: "#ef4444",
  color: "#fff",
  fontSize: "10px",
  fontWeight: "700",
  minWidth: "18px",
  height: "18px",
  borderRadius: "9px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 4px",
  border: "2px solid #fff",
  lineHeight: 1
};

const panelStyle = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  width: "380px",
  maxHeight: "560px",
  backgroundColor: "#fff",
  borderRadius: "16px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  animation: "slideDown 0.2s ease-out"
};

const panelHeaderStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid #f1f5f9",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#fafbfc",
  flexShrink: 0
};

const panelTitleGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const panelTitleStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#0f172a",
  margin: 0
};

const unreadPillStyle = {
  backgroundColor: "#ef4444",
  color: "#fff",
  fontSize: "11px",
  fontWeight: "700",
  padding: "2px 8px",
  borderRadius: "20px"
};

const panelActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const markAllBtnStyle = {
  fontSize: "11px",
  color: "#3c74ff",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  padding: "4px 8px",
  borderRadius: "6px",
  transition: "background 0.2s"
};

const closePanelBtnStyle = {
  fontSize: "14px",
  color: "#94a3b8",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 6px",
  borderRadius: "6px",
  lineHeight: 1
};

const tabsStyle = {
  display: "flex",
  padding: "8px 16px",
  gap: "4px",
  borderBottom: "1px solid #f1f5f9",
  backgroundColor: "#fafbfc",
  flexShrink: 0
};

const tabBtnStyle = (active) => ({
  padding: "6px 14px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: active ? "#eef2ff" : "transparent",
  color: active ? "#3c74ff" : "#64748b",
  fontSize: "12px",
  fontWeight: active ? "700" : "500",
  cursor: "pointer",
  transition: "all 0.2s"
});

const listStyle = {
  overflowY: "auto",
  flex: 1,
  padding: "8px 0"
};

const centerMsgStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
  gap: "8px",
  textAlign: "center"
};

const emptyTitleStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#334155",
  margin: 0
};

const mutedTextStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: 0
};

const miniSpinnerStyle = {
  width: "28px",
  height: "28px",
  border: "3px solid #e2e8f0",
  borderTopColor: "#3c74ff",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite"
};

const notifItemStyle = (isRead) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "14px 20px",
  cursor: isRead ? "default" : "pointer",
  backgroundColor: isRead ? "#fafbfc" : "#fff",
  borderBottom: "1px solid #f8fafc",
  transition: "background 0.15s",
  opacity: isRead ? 0.72 : 1,
  position: "relative"
});

const unreadDotStyle = (color) => ({
  position: "absolute",
  left: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: color,
  flexShrink: 0
});

const notifIconStyle = (bg) => ({
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  backgroundColor: bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
});

const notifContentStyle = {
  flex: 1,
  minWidth: 0
};

const notifTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "4px"
};

const notifTypeLabelStyle = (color, bg) => ({
  fontSize: "10px",
  fontWeight: "700",
  color: color,
  backgroundColor: bg,
  padding: "2px 8px",
  borderRadius: "20px",
  textTransform: "uppercase",
  letterSpacing: "0.4px"
});

const notifTimeStyle = {
  fontSize: "11px",
  color: "#94a3b8"
};

const notifTitleStyle = (isRead) => ({
  fontSize: "13px",
  fontWeight: isRead ? "500" : "700",
  color: isRead ? "#475569" : "#0f172a",
  margin: "0 0 2px 0",
  lineHeight: "1.4"
});

const notifMessageStyle = (isRead) => ({
  fontSize: "12px",
  color: isRead ? "#94a3b8" : "#64748b",
  margin: "0 0 4px 0",
  lineHeight: "1.5",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden"
});

const notifMetaStyle = {
  fontSize: "10px",
  color: "#94a3b8",
  fontFamily: "monospace",
  backgroundColor: "#f1f5f9",
  padding: "2px 6px",
  borderRadius: "4px"
};

const readCheckStyle = {
  fontSize: "12px",
  color: "#10b981",
  fontWeight: "700",
  flexShrink: 0,
  marginLeft: "4px"
};

const panelFooterStyle = {
  padding: "12px 20px",
  borderTop: "1px solid #f1f5f9",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#fafbfc",
  flexShrink: 0
};

const refreshBtnStyle = {
  fontSize: "12px",
  color: "#3c74ff",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: "500",
  padding: "4px 8px",
  borderRadius: "6px"
};

const footerCountStyle = {
  fontSize: "11px",
  color: "#94a3b8"
};

// Inject animation
if (typeof document !== "undefined") {
  const existing = document.getElementById("notif-panel-styles");
  if (!existing) {
    const s = document.createElement("style");
    s.id = "notif-panel-styles";
    s.textContent = `
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(s);
  }
}