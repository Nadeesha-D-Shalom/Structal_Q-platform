/** Normalize :id from react-router (handles trailing slash, e.g. /analysis/10/) */
export function normalizeRouteId(param) {
  if (param == null || param === "") return "";
  return String(param).replace(/\/+$/, "").trim();
}
