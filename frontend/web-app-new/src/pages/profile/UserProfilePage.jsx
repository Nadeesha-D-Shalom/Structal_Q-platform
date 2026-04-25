import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import LecturerNavbar from "../lecturer/LecturerNavbar";
import StudentNavbar from "../student/StudentNavbar";
import { getApiBaseUrl } from "../../utils/apiBase";
import { formatRoleLabel } from "../../utils/authValidation";
import { appToast } from "../../components/UIFeedback/appNotify";

const API_BASE = getApiBaseUrl();

const PASSWORD_EMPTY = { current_password: "", new_password: "", confirm_password: "" };

const CREATE_USER_EMPTY = {
  role: "STUDENT",
  first_name: "",
  last_name: "",
  email: "",
  registration_no: "",
  program_id: "",
  password: "",
};

function authHeaders(json = true) {
  const token = localStorage.getItem("auth_token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function isActiveStatus(status) {
  return String(status || "").trim().toUpperCase() === "ACTIVE";
}

/** Read-only detail row — avoids misleading editable inputs */
function DetailRow({ label, value, iconClass }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {iconClass ? <i className={`${iconClass} text-[10px] opacity-80`} aria-hidden /> : null}
        <span>{label}</span>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-800 min-h-[44px] flex items-center">
        {value != null && value !== "" ? value : "—"}
      </div>
    </div>
  );
}

function inputClass(extra = "") {
  return [
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800",
    "placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-[#0f2f66]/25 focus:border-[#0f2f66]/35",
    "transition shadow-sm",
    extra,
  ].join(" ");
}

const SECTION_META = {
  profile: { label: "Account", icon: "fa-regular fa-id-card" },
  modules: { label: "Modules", icon: "fa-solid fa-book-open" },
  password: { label: "Password", icon: "fa-solid fa-key" },
  "create-user": { label: "Add user", icon: "fa-solid fa-user-plus", lecturerRouteOnly: true },
};

export default function UserProfilePage() {
  const location = useLocation();
  const isStudentShell = location.pathname.startsWith("/student/");

  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");
  const [passwordForm, setPasswordForm] = useState(PASSWORD_EMPTY);
  const [createUserForm, setCreateUserForm] = useState(CREATE_USER_EMPTY);
  const [savingPassword, setSavingPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  const roleNorm = profile?.role_normalized || "";
  const isLecturer = roleNorm === "lecturer";
  const showLecturerAdminTools = isLecturer && location.pathname.startsWith("/lecturer");

  const navIds = useMemo(() => {
    const base = ["profile", "modules", "password"];
    if (showLecturerAdminTools) base.push("create-user");
    return base;
  }, [showLecturerAdminTools]);

  useEffect(() => {
    if (!navIds.includes(activeSection)) setActiveSection("profile");
  }, [navIds, activeSection]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/profile/me`, { headers: authHeaders(false) });
        const text = await res.text();
        let body = {};
        try {
          body = text ? JSON.parse(text) : {};
        } catch {
          body = {};
        }
        if (!res.ok) {
          throw new Error(
            body.error || body.message || `Could not load profile (${res.status})`
          );
        }
        if (cancelled) return;
        setProfile(body.user || null);
        setModules(Array.isArray(body.modules) ? body.modules : []);
      } catch (e) {
        if (!cancelled) {
          appToast(e.message || "Failed to load profile", "error");
          setProfile(null);
          setModules([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const modulesTitle = isLecturer ? "Continuing modules" : "Enrolled modules";
  const modulesSubtitle = isLecturer
    ? "Subjects linked to assessments you created."
    : "Subjects linked to assessments you have submitted to.";

  const initials = useMemo(() => {
    if (!profile) return "—";
    const a = profile.first_name?.[0] || "";
    const b = profile.last_name?.[0] || "";
    return (a + b).toUpperCase() || "—";
  }, [profile]);

  const submitPassword = async (e) => {
    e.preventDefault();
    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      appToast("Please complete all password fields.", "warning");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      appToast("New password must be at least 6 characters.", "warning");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      appToast("New password and confirmation do not match.", "warning");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/change-password`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Could not update password");
      }
      setPasswordForm(PASSWORD_EMPTY);
      appToast("Password updated.", "success");
    } catch (err) {
      appToast(err.message || "Password update failed", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const submitCreateUser = async (e) => {
    e.preventDefault();
    if (!showLecturerAdminTools) return;
    const { first_name, last_name, email, registration_no, password, role, program_id } =
      createUserForm;
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !registration_no?.trim()) {
      appToast("Please fill all required fields.", "warning");
      return;
    }
    if (!password || password.length < 6) {
      appToast("Password must be at least 6 characters.", "warning");
      return;
    }
    const payload = {
      role: role === "LECTURER" ? "LECTURER" : "STUDENT",
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      registration_no: registration_no.trim(),
      password,
    };
    const pid = String(program_id || "").trim();
    if (payload.role === "STUDENT" && pid !== "") {
      const n = Number(pid);
      if (Number.isFinite(n) && n > 0) payload.program_id = n;
    }
    setCreatingUser(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/users`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Could not create user");
      }
      setCreateUserForm(CREATE_USER_EMPTY);
      appToast("Account created.", "success");
    } catch (err) {
      appToast(err.message || "Create user failed", "error");
    } finally {
      setCreatingUser(false);
    }
  };

  const l = passwordForm.new_password.length;
  const strength = !l ? 0 : l < 6 ? 1 : l < 9 ? 2 : l < 12 ? 3 : 4;
  const strengthLabel = ["", "Too short", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

  const shellNav = isStudentShell ? (
    <StudentNavbar activePage="Profile" />
  ) : (
    <LecturerNavbar />
  );

  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      {shellNav}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#0f2f66] tracking-tight">Profile &amp; settings</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Choose a section to review your account, modules, security, or (lecturers) register a new
            user. Your name and registration number are read-only.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Sidebar / section switcher */}
          <aside
            className="w-full lg:w-60 shrink-0 lg:sticky lg:top-24"
            aria-label="Profile sections"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-3 mb-4">
              <div className="flex items-center gap-3 px-2 py-2">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #0f2f66 0%, #f28b22 100%)",
                  }}
                  aria-hidden
                >
                  {loading ? <i className="fas fa-spinner fa-spin text-[13px]" /> : initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {loading
                      ? "Loading…"
                      : [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
                        "—"}
                  </p>
                  <p className="text-xs text-slate-500 truncate font-mono">
                    {profile?.registration_no || "—"}
                  </p>
                  {!loading && profile?.status != null && (
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                          isActiveStatus(profile.status) ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        aria-hidden
                      />
                      <span className="capitalize">Status: {String(profile.status).toLowerCase()}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1">
              {navIds.map((id) => {
                const meta = SECTION_META[id];
                if (!meta) return null;
                if (meta.lecturerRouteOnly && !showLecturerAdminTools) return null;
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-colors shrink-0 lg:w-full text-left",
                      active
                        ? "bg-[#0f2f66] text-white shadow-md shadow-[#0f2f66]/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#0f2f66]",
                    ].join(" ")}
                  >
                    <i className={`${meta.icon} w-4 text-center text-[13px] opacity-90`} aria-hidden />
                    {meta.label}
                  </button>
                );
              })}
            </nav>

          </aside>

          {/* Single active panel */}
          <section
            className="flex-1 min-w-0 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"
            aria-live="polite"
          >
            {loading && (
              <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-3">
                <i className="fas fa-spinner fa-spin text-2xl text-[#0f2f66]" aria-hidden />
                <p className="text-sm">Loading your profile…</p>
              </div>
            )}

            {!loading && !profile && (
              <div className="p-10 text-center text-red-700 bg-red-50/50 text-sm">
                Profile could not be loaded. Refresh the page or sign in again.
              </div>
            )}

            {!loading && profile && activeSection === "profile" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Account details</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Identity fields are managed by your institution.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {formatRoleLabel(profile.role)}
                  </span>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DetailRow label="First name" value={profile.first_name} iconClass="fa-regular fa-user" />
                  <DetailRow label="Last name" value={profile.last_name} iconClass="fa-regular fa-user" />
                  <DetailRow label="Email" value={profile.email} iconClass="fa-regular fa-envelope" />
                  <DetailRow
                    label="Registration / staff ID"
                    value={profile.registration_no}
                    iconClass="fa-solid fa-hashtag"
                  />
                  {!isStudentShell && (
                    <>
                      <DetailRow
                        label="Program ID"
                        value={profile.program_id != null ? String(profile.program_id) : null}
                        iconClass="fa-solid fa-layer-group"
                      />
                      <DetailRow
                        label="Member since"
                        value={profile.created_at ? new Date(profile.created_at).toLocaleString() : null}
                        iconClass="fa-regular fa-calendar"
                      />
                      <DetailRow
                        label="Last login"
                        value={
                          profile.last_login_at
                            ? new Date(profile.last_login_at).toLocaleString()
                            : null
                        }
                        iconClass="fa-solid fa-right-to-bracket"
                      />
                      <DetailRow
                        label="Account status"
                        value={profile.status}
                        iconClass="fa-regular fa-circle-check"
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {!loading && profile && activeSection === "modules" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">{modulesTitle}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{modulesSubtitle}</p>
                </div>
                <div className="p-6">
                  {modules.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-10">
                      No modules to show yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {modules.map((m, idx) => (
                        <li
                          key={`${m.subject_id}-${m.academic_year}-${m.semester}-${idx}`}
                          className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white hover:bg-slate-50/80 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {m.subject_code ? `${m.subject_code} · ` : ""}
                              {m.subject_name || "Subject"}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {[m.academic_year, m.semester].filter(Boolean).join(" · ")}
                              {m.intake_name ? ` · ${m.intake_name}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {!loading && profile && activeSection === "password" && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    After a successful change, use your new password next time you sign in.
                  </p>
                </div>
                <form onSubmit={submitPassword} className="p-6 space-y-5 max-w-xl">
                  {[
                    { key: "current", label: "Current password", field: "current_password" },
                    { key: "next", label: "New password", field: "new_password" },
                    { key: "confirm", label: "Confirm new password", field: "confirm_password" },
                  ].map(({ key, label, field }) => (
                    <div key={field}>
                      <label htmlFor={`pw-${field}`} className="block text-xs font-semibold text-slate-500 mb-1.5">
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          id={`pw-${field}`}
                          type={showPw[key] ? "text" : "password"}
                          autoComplete={
                            field === "current_password" ? "current-password" : "new-password"
                          }
                          value={passwordForm[field]}
                          onChange={(e) =>
                            setPasswordForm((p) => ({ ...p, [field]: e.target.value }))
                          }
                          className={inputClass("pr-11")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                          onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                          aria-label={showPw[key] ? "Hide password" : "Show password"}
                        >
                          <i className={showPw[key] ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {passwordForm.new_password.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4].map((lvl) => (
                          <div
                            key={lvl}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              background: lvl <= strength ? strengthColor[strength] : "#e2e8f0",
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                        {strengthLabel}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0f2f66] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#0c2560] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {savingPassword ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                        Updating…
                      </>
                    ) : (
                      "Update password"
                    )}
                  </button>
                </form>
              </div>
            )}

            {!loading && profile && activeSection === "create-user" && showLecturerAdminTools && (
              <div>
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">Add student or lecturer</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Creates an active account. Share the temporary password securely with the new user.
                  </p>
                </div>
                <form onSubmit={submitCreateUser} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                  <div className="sm:col-span-2">
                    <label htmlFor="new-role" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Role
                    </label>
                    <select
                      id="new-role"
                      value={createUserForm.role}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, role: e.target.value }))}
                      className={inputClass()}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="LECTURER">Lecturer</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="new-fn" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      First name
                    </label>
                    <input
                      id="new-fn"
                      required
                      value={createUserForm.first_name}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, first_name: e.target.value }))}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-ln" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Last name
                    </label>
                    <input
                      id="new-ln"
                      required
                      value={createUserForm.last_name}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, last_name: e.target.value }))}
                      className={inputClass()}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="new-email" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Email
                    </label>
                    <input
                      id="new-email"
                      type="email"
                      required
                      value={createUserForm.email}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, email: e.target.value }))}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-reg" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Registration / staff ID
                    </label>
                    <input
                      id="new-reg"
                      required
                      value={createUserForm.registration_no}
                      onChange={(e) =>
                        setCreateUserForm((p) => ({ ...p, registration_no: e.target.value }))
                      }
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-pw" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Initial password (min. 6)
                    </label>
                    <input
                      id="new-pw"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={createUserForm.password}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, password: e.target.value }))}
                      className={inputClass()}
                    />
                  </div>
                  {createUserForm.role === "STUDENT" && (
                    <div className="sm:col-span-2">
                      <label htmlFor="new-pid" className="block text-xs font-semibold text-slate-500 mb-1.5">
                        Program ID (optional)
                      </label>
                      <input
                        id="new-pid"
                        type="number"
                        min={1}
                        value={createUserForm.program_id}
                        onChange={(e) => setCreateUserForm((p) => ({ ...p, program_id: e.target.value }))}
                        className={inputClass()}
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={creatingUser}
                      className="inline-flex items-center justify-center rounded-xl bg-[#f28b22] text-white text-sm font-semibold px-5 py-2.5 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {creatingUser ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                          Creating…
                        </>
                      ) : (
                        "Create account"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
