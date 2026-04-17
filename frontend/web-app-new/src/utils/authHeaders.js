/** Build Authorization header for API calls (matches pages using localStorage auth_token). */
export function buildAuthHeaders(token) {
  const t = token != null ? String(token).trim() : "";
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}
