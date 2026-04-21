/**
 * Map DB / legacy role strings to canonical: student | lecturer | admin
 */
function normalizeRole(role) {
  if (role == null || role === "") return "";
  const r = String(role).trim().toLowerCase();
  if (
    ["lecturer", "teacher", "professor", "faculty", "instructor", "module_leader", "tutor"].includes(
      r
    )
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

module.exports = { normalizeRole };
