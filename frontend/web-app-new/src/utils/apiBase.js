/**
 * Resolves the API base URL for fetch() calls.
 *
 * When REACT_APP_API_URL points at http://localhost:5000 (or 127.0.0.1), the browser
 * performs a cross-origin request from :3000 → :5000. That often fails in dev even
 * though Postman works (CORS / credentials / env mismatch). Create React App's
 * package.json "proxy" only applies to **same-origin** requests like `/api/...`.
 *
 * So in non-production builds, if the env URL is a local loopback host, return ""
 * so requests become `/api/...` and are proxied to the backend without CORS issues.
 *
 * In production, use the configured absolute URL (or "" for same-origin deploys).
 */
export function getApiBaseUrl() {
  const raw = process.env.REACT_APP_API_URL;
  if (raw == null || String(raw).trim() === "") {
    return "";
  }
  const trimmed = String(raw).trim().replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    return trimmed;
  }
  try {
    const u = new URL(trimmed);
    const loopback =
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "::1";
    if (loopback) {
      return "";
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}
