/** Same rule as LoginPage — email format for login field */
export function validateLoginEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

/**
 * Where to send user after successful login (matches LoginPage routing).
 */
export function getDashboardPathForRole(userRole) {
  const r = String(userRole || "")
    .toLowerCase()
    .trim();
  if (r === "lecturer" || r === "admin") return "/lecturer";
  return "/student";
}
