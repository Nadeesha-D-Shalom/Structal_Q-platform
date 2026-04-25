import { useEffect, useMemo, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import LecturerNavbar from "../lecturer/LecturerNavbar";
import StudentNavbar from "../student/StudentNavbar";
import { getApiBaseUrl } from "../../utils/apiBase";
import { formatRoleLabel, normalizeRole } from "../../utils/authValidation";
import { appToast } from "../../components/UIFeedback/appNotify";

const API_BASE = getApiBaseUrl();

const initialPasswordState = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

const initialCreateUserState = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "student",
  registration_no: "",
  program_id: "",
};

function authHeaders(json = true) {
  const token = localStorage.getItem("auth_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function ReadonlyField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <input
        value={value || "—"}
        readOnly
        className="w-full rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 cursor-default focus:outline-none"
      />
    </div>
  );
}

function FormField({ label, children, span2 = false }) {
  return (
    <div className={`space-y-1.5 ${span2 ? "md:col-span-2" : ""}`}>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f2f66]/20 focus:border-[#0f2f66]/40 transition";

const NAV_SECTIONS = [
  { id: "profile", label: "My Profile", icon: "fa-regular fa-user" },
  { id: "modules", label: "Modules", icon: "fa-solid fa-book-open" },
  { id: "password", label: "Change Password", icon: "fa-solid fa-lock" },
  { id: "create-user", label: "Add User", icon: "fa-solid fa-user-plus", lecturerOnly: true },
];

function SectionAnchor({ id }) {
  return <div id={id} className="scroll-mt-8" />;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }

  .up-avatar-ring {
    background: linear-gradient(135deg, #0f2f66, #3b72d9, #f28b22);
    padding: 3px;
    border-radius: 50%;
  }
  .up-avatar-inner {
    background: white;
    border-radius: 50%;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .up-sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13.5px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
  }
  .up-sidebar-link:hover { background: #eff2f8; color: #1e3a6e; }
  .up-sidebar-link.active {
    background: linear-gradient(135deg, #0f2f66 0%, #1a4da0 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(15,47,102,0.25);
  }
  .up-sidebar-link .up-icon {
    font-size: 16px;
    line-height: 1;
    width: 20px;
    text-align: center;
  }

  .up-card {
    background: white;
    border-radius: 20px;
    border: 1px solid #edf0f7;
    box-shadow: 0 1px 6px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.03);
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }
  .up-card:hover {
    box-shadow: 0 2px 10px rgba(0,0,0,0.06), 0 8px 30px rgba(0,0,0,0.05);
  }

  .up-card-header {
    padding: 22px 28px 18px;
    border-bottom: 1px solid #f1f4fb;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .up-card-header-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .up-card-body { padding: 24px 28px; }

  .up-role-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .up-role-badge.lecturer {
    background: linear-gradient(135deg, #fff4e5, #ffe8c2);
    color: #b45309;
    border: 1px solid #fcd34d40;
  }
  .up-role-badge.student {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    color: #1d4ed8;
    border: 1px solid #93c5fd40;
  }

  .up-stat-pill {
    background: linear-gradient(135deg, #f0f4ff, #e8eeff);
    border: 1px solid #d4dcf7;
    border-radius: 12px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .up-module-row {
    display: grid;
    grid-template-columns: 100px 1fr 130px 90px;
    gap: 12px;
    padding: 13px 0;
    border-bottom: 1px solid #f1f4fb;
    align-items: center;
    font-size: 13px;
  }
  .up-module-row:last-child { border-bottom: none; }
  .up-module-row.header {
    padding: 0 0 10px;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .up-module-badge {
    display: inline-block;
    background: #eff2f8;
    color: #374b73;
    border-radius: 7px;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
  }

  .up-pw-wrap { position: relative; }
  .up-pw-toggle {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    font-size: 14px;
    padding: 2px;
  }
  .up-pw-toggle:hover { color: #475569; }

  .up-btn-primary {
    background: linear-gradient(135deg, #0f2f66, #1a4da0);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 11px 24px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 12px rgba(15,47,102,0.22);
    font-family: inherit;
  }
  .up-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(15,47,102,0.3);
  }
  .up-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

  .up-btn-accent {
    background: linear-gradient(135deg, #f28b22, #e07b12);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 11px 24px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 12px rgba(242,139,34,0.28);
    font-family: inherit;
  }
  .up-btn-accent:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(242,139,34,0.38);
  }
  .up-btn-accent:disabled { opacity: 0.55; cursor: not-allowed; }

  .up-skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e8edf5 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: up-shimmer 1.4s infinite;
    border-radius: 12px;
  }
  @keyframes up-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .up-sidebar { position: sticky; top: 24px; height: fit-content; }

  select.up-select-field {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }

  @media (max-width: 640px) {
    .up-card-body { padding: 18px 18px; }
    .up-card-header { padding: 16px 18px 14px; }
    .up-module-row { grid-template-columns: 90px 1fr; gap: 8px; }
    .up-module-row .up-year, .up-module-row .up-sem { display: none; }
  }
`;

export default function UserProfilePage() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [passwordForm, setPasswordForm] = useState(initialPasswordState);
  const [createUserForm, setCreateUserForm] = useState(initialCreateUserState);
  const [activeSection, setActiveSection] = useState("profile");
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, modulesRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/me`, { headers: authHeaders(false) }),
          fetch(`${API_BASE}/api/users/me/modules`, { headers: authHeaders(false) }),
        ]);
        const profileData = await profileRes.json();
        const modulesData = await modulesRes.json();
        if (!profileRes.ok || !profileData?.success)
          throw new Error(profileData?.error || "Failed to load profile");
        setProfile(profileData.data || null);
        setModules(Array.isArray(modulesData?.data) ? modulesData.data : []);
      } catch (err) {
        appToast(err.message || "Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const sections = ["profile", "modules", "password", "create-user"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading]);

  const role = normalizeRole(profile?.role);
  const isLecturer = role === "lecturer";
  const roleSpecificTitle = useMemo(() => (isLecturer ? "Continuing Modules" : "Enrolled Modules"), [isLecturer]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      appToast("Please fill all password fields.", "warning"); return;
    }
    if (passwordForm.new_password.length < 6) { appToast("New password must be at least 6 characters.", "warning"); return; }
    if (passwordForm.new_password !== passwordForm.confirm_password) { appToast("Passwords do not match.", "warning"); return; }

    setSavingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/me/password`, {
        method: "PUT", headers: authHeaders(true), body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to update password");
      setPasswordForm(initialPasswordState);
      appToast("Password changed successfully.", "success");
    } catch (err) {
      appToast(err.message || "Failed to update password", "error");
    } finally { setSavingPassword(false); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isLecturer) return;
    const payload = { ...createUserForm, program_id: createUserForm.program_id ? Number(createUserForm.program_id) : null };
    if (!payload.first_name || !payload.last_name || !payload.email || !payload.password || !payload.registration_no) {
      appToast("Please fill all required fields.", "warning"); return;
    }
    setCreatingUser(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST", headers: authHeaders(true), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to create user");
      setCreateUserForm(initialCreateUserState);
      appToast("New user added successfully.", "success");
    } catch (err) {
      appToast(err.message || "Failed to create user", "error");
    } finally { setCreatingUser(false); }
  };

  const initials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase()
    : "??";

  const visibleSections = NAV_SECTIONS.filter((s) => !s.lecturerOnly || isLecturer);

  const pwStrength = (() => {
    const l = passwordForm.new_password.length;
    if (!l) return 0;
    if (l < 6) return 1;
    if (l < 9) return 2;
    if (l < 12) return 3;
    return 4;
  })();
  const pwStrengthLabels = ["", "Too short", "Weak", "Good", "Strong"];
  const pwStrengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fa", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{styles}</style>

      {isLecturer ? <LecturerNavbar /> : <StudentNavbar activePage="Profile" />}

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>

          {/* ── SIDEBAR ── */}
          <aside className="up-sidebar" style={{ width: 232, flexShrink: 0 }}>

            {/* Avatar + Identity Card */}
            <div className="up-card" style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
                <div className="up-avatar-ring" style={{ width: 70, height: 70 }}>
                  <div className="up-avatar-inner">
                    {loading ? (
                      <div className="up-skeleton" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                    ) : (
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 22,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #0f2f66, #f28b22)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}>
                        {initials}
                      </span>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", alignItems: "center" }}>
                    <div className="up-skeleton" style={{ height: 14, width: 110, borderRadius: 4 }} />
                    <div className="up-skeleton" style={{ height: 11, width: 80, borderRadius: 4 }} />
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", lineHeight: 1.3, margin: 0 }}>
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
                      {profile?.registration_no || "—"}
                    </p>
                    <div style={{ marginTop: 10 }}>
                      <span className={`up-role-badge ${isLecturer ? "lecturer" : "student"}`}>
                        {formatRoleLabel(role)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!loading && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f4fb" }}>
                  <div className="up-stat-pill">
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      {roleSpecificTitle}
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#0f2f66", lineHeight: 1.2 }}>
                      {modules.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <div className="up-card" style={{ padding: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#c0c9de", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 10px 4px", margin: 0 }}>
                Navigation
              </p>
              <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {visibleSections.map((s, i) => (
                  <div key={s.id}>
                    {s.lecturerOnly && i > 0 && (
                      <div style={{ height: 1, background: "linear-gradient(to right, transparent, #e2e8f0, transparent)", margin: "6px 0" }} />
                    )}
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                        setActiveSection(s.id);
                      }}
                      className={`up-sidebar-link${activeSection === s.id ? " active" : ""}`}
                    >
                      <span className="up-icon"><i className={s.icon} /></span>
                      {s.label}
                    </a>
                  </div>
                ))}
              </nav>
            </div>

            {/* Status Dot */}
            {!loading && profile?.status && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingLeft: 4 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: profile.status === "active" ? "#22c55e" : "#f59e0b",
                  boxShadow: profile.status === "active" ? "0 0 0 3px #bbf7d0" : "0 0 0 3px #fef3c7",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, textTransform: "capitalize" }}>
                  Account {profile.status}
                </span>
              </div>
            )}
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* PROFILE SECTION */}
            <SectionAnchor id="profile" />
            <div className="up-card">
              <div className="up-card-header">
                <div className="up-card-header-icon" style={{ background: "linear-gradient(135deg, #eff4ff, #dce8ff)", color: "#1d4ed8" }}>
                  <i className="fa-regular fa-user" />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", margin: 0 }}>My Profile</h2>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Account details and identity information</p>
                </div>
                {!loading && (
                  <span className={`up-role-badge ${isLecturer ? "lecturer" : "student"}`}>
                    {formatRoleLabel(role)}
                  </span>
                )}
              </div>
              <div className="up-card-body">
                {loading ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div className="up-skeleton" style={{ height: 11, width: 80, borderRadius: 4 }} />
                        <div className="up-skeleton" style={{ height: 44, borderRadius: 12 }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                    <ReadonlyField label="First Name" value={profile?.first_name} />
                    <ReadonlyField label="Last Name" value={profile?.last_name} />
                    <ReadonlyField label="Email Address" value={profile?.email} />
                    <ReadonlyField label="Registration No." value={profile?.registration_no} />
                    <ReadonlyField label="Account Status" value={profile?.status} />
                    {/* <ReadonlyField label="Program ID" value={profile?.program_id != null ? String(profile.program_id) : "—"} /> */}
                  </div>
                )}
                <p style={{ fontSize: 11.5, color: "#b0bec5", marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="fa-solid fa-lock text-slate-400" /> Names and registration number are read-only to preserve identity records.
                </p>
              </div>
            </div>

            {/* MODULES SECTION */}
            <SectionAnchor id="modules" />
            <div className="up-card">
              <div className="up-card-header">
                <div className="up-card-header-icon" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", color: "#15803d" }}>
                  <i className="fa-solid fa-book-open" />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", margin: 0 }}>{roleSpecificTitle}</h2>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                    {modules.length} module{modules.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                {modules.length > 0 && (
                  <span style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", color: "#15803d", borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>
                    {modules.length}
                  </span>
                )}
              </div>
              <div className="up-card-body" style={{ paddingTop: 16 }}>
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[...Array(3)].map((_, i) => <div key={i} className="up-skeleton" style={{ height: 44, borderRadius: 12 }} />)}
                  </div>
                ) : modules.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                    <div style={{ fontSize: 28, marginBottom: 8, color: "#94a3b8" }}><i className="fa-regular fa-folder-open" /></div>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No module records found yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="up-module-row header">
                      <div>Code</div>
                      <div>Module Name</div>
                      <div className="up-year">Academic Year</div>
                      <div className="up-sem">Semester</div>
                    </div>
                    {modules.map((m, idx) => (
                      <div key={`${m.subject_id}-${idx}`} className="up-module-row">
                        <div><span className="up-module-badge">{m.subject_code || "—"}</span></div>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13.5 }}>{m.subject_name || "—"}</div>
                        <div className="up-year" style={{ color: "#64748b" }}>{m.academic_year || "—"}</div>
                        <div className="up-sem">
                          {m.semester ? (
                            <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#475569" }}>
                              {m.semester}
                            </span>
                          ) : "—"}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* CHANGE PASSWORD SECTION */}
            <SectionAnchor id="password" />
            <div className="up-card">
              <div className="up-card-header">
                <div className="up-card-header-icon" style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", color: "#b45309" }}>
                  <i className="fa-solid fa-lock" />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", margin: 0 }}>Change Password</h2>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Update your account security credentials</p>
                </div>
              </div>
              <div className="up-card-body">
                <form onSubmit={handlePasswordChange}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                    {[
                      { key: "current", label: "Current Password", field: "current_password" },
                      { key: "new", label: "New Password", field: "new_password" },
                      { key: "confirm", label: "Confirm New Password", field: "confirm_password" },
                    ].map(({ key, label, field }) => (
                      <FormField key={key} label={label}>
                        <div className="up-pw-wrap">
                          <input
                            type={showPassword[key] ? "text" : "password"}
                            value={passwordForm[field]}
                            onChange={(e) => setPasswordForm((p) => ({ ...p, [field]: e.target.value }))}
                            className={inputCls}
                            style={{ paddingRight: 44 }}
                            placeholder="••••••••"
                          />
                          <button type="button" className="up-pw-toggle"
                            onClick={() => setShowPassword((p) => ({ ...p, [key]: !p[key] }))}>
                            <i className={showPassword[key] ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} />
                          </button>
                        </div>
                      </FormField>
                    ))}
                  </div>

                  {passwordForm.new_password && (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 16 }}>
                      {[1, 2, 3, 4].map((lvl) => (
                        <div key={lvl} style={{
                          height: 4, flex: 1, borderRadius: 2,
                          background: lvl <= pwStrength ? pwStrengthColors[pwStrength] : "#e2e8f0",
                          transition: "background 0.3s",
                        }} />
                      ))}
                      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {pwStrengthLabels[pwStrength]}
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" disabled={savingPassword} className="up-btn-primary">
                      {savingPassword ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ADD USER SECTION (Lecturer only) */}
            {isLecturer && (
              <>
                <SectionAnchor id="create-user" />
                <div className="up-card">
                  <div className="up-card-header">
                    <div className="up-card-header-icon" style={{ background: "linear-gradient(135deg, #fdf4ff, #f3e8ff)", color: "#7e22ce" }}>
                      <i className="fa-solid fa-user-plus" />
                    </div>
                    <div>
                      <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", margin: 0 }}>Add New User</h2>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Create a student or lecturer account</p>
                    </div>
                  </div>
                  <div className="up-card-body">
                    <form onSubmit={handleCreateUser}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 20 }}>
                        <FormField label="First Name *">
                          <input value={createUserForm.first_name}
                            onChange={(e) => setCreateUserForm((p) => ({ ...p, first_name: e.target.value }))}
                            className={inputCls} placeholder="e.g. John" />
                        </FormField>
                        <FormField label="Last Name *">
                          <input value={createUserForm.last_name}
                            onChange={(e) => setCreateUserForm((p) => ({ ...p, last_name: e.target.value }))}
                            className={inputCls} placeholder="e.g. Doe" />
                        </FormField>
                        <FormField label="Email Address *">
                          <input type="email" value={createUserForm.email}
                            onChange={(e) => setCreateUserForm((p) => ({ ...p, email: e.target.value }))}
                            className={inputCls} placeholder="user@university.edu" />
                        </FormField>
                        <FormField label="Registration Number *">
                          <input value={createUserForm.registration_no}
                            onChange={(e) => setCreateUserForm((p) => ({ ...p, registration_no: e.target.value }))}
                            className={inputCls} placeholder="e.g. REG2024001" />
                        </FormField>
                        <FormField label="Password *">
                          <input type="password" value={createUserForm.password}
                            onChange={(e) => setCreateUserForm((p) => ({ ...p, password: e.target.value }))}
                            className={inputCls} placeholder="Min. 6 characters" />
                        </FormField>
                        <FormField label="Role *">
                          <select value={createUserForm.role}
                            onChange={(e) => setCreateUserForm((p) => ({ ...p, role: e.target.value }))}
                            className={`${inputCls} up-select-field`}>
                            <option value="student">Student</option>
                            <option value="lecturer">Lecturer</option>
                          </select>
                        </FormField>
                        <FormField label="Program ID (optional)" span2>
                          <input value={createUserForm.program_id}
                            onChange={(e) => setCreateUserForm((p) => ({ ...p, program_id: e.target.value }))}
                            className={inputCls} placeholder="Leave blank if not applicable" />
                        </FormField>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #f1f4fb" }}>
                        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                          Fields marked <span style={{ color: "#ef4444" }}>*</span> are required.
                        </p>
                        <button type="submit" disabled={creatingUser} className="up-btn-accent">
                          {creatingUser ? "Creating…" : "Add User"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}