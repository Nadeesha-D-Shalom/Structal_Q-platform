/**
 * Central API base URL and fetch helper.
 * - Dev with CRA proxy: leave REACT_APP_API_URL unset → relative "/api/..." hits proxy → :5000
 * - Absolute API: set REACT_APP_API_URL=http://localhost:5000 (CORS must allow origin on backend)
 */
const RAW = process.env.REACT_APP_API_URL || "";

export function getApiRoot() {
  return String(RAW).replace(/\/$/, "");
}

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const root = getApiRoot();
  if (!root) return p;
  return `${root}${p}`;
}

export function getStoredToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/**
 * @param {string} path — e.g. "/api/auth/session"
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(apiUrl(path), { ...options, headers });
}

export function persistAuth({ token, user }) {
  if (token) localStorage.setItem("token", token);
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    if (user.role) localStorage.setItem("role", user.role);
  }
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("userRole");
  localStorage.removeItem("user_type");
}
