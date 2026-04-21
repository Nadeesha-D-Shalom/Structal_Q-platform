/** Same rule as LoginPage — email format for login field */
export function validateLoginEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

/**
 * Align with backend `roleNormalize` — canonical: student | lecturer | admin
 */
export function normalizeRole(role) {
  if (role == null || role === "") return "";
  const r = String(role).trim().toLowerCase();
  if (
    ["lecturer", "teacher", "professor", "faculty", "instructor", "module_leader", "tutor"].includes(r)
  ) {
    return "lecturer";
  }
  if (["admin", "administrator", "superuser", "super_admin"].includes(r)) {
    return "admin";
  }
  if (["student", "pupil", "undergraduate", "learner"].includes(r)) {
    return "student";
  }
  return r;
}

/** Human-readable label for navbar / profile */
export function formatRoleLabel(role) {
  const r = normalizeRole(role);
  if (!r) return "—";
  const labels = {
    lecturer: "Lecturer",
    student: "Student",
    admin: "Administrator",
  };
  return labels[r] || r.charAt(0).toUpperCase() + r.slice(1);
}

/**
 * Where to send user after successful login (matches LoginPage routing).
 */
export function getDashboardPathForRole(userRole) {
  const r = normalizeRole(userRole);
  if (r === "lecturer" || r === "admin") return "/lecturer";
  return "/student";
}
