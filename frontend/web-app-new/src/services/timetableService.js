import axios from "axios";
import { getApiRoot } from "../api/client";

const baseURL = (() => {
  const root = getApiRoot();
  if (root) return `${root}/api/timetable`;
  return "/api/timetable";
})();

const api = axios.create({ baseURL });

/** Bumped when a timetable is published so student views can refresh (storage event + polling). */
export const TIMETABLE_REFRESH_KEY = "structal_timetable_version";

export const TIMETABLE_UPDATED_EVENT = "structal-timetable-updated";

export function notifyTimetablePublished() {
  try {
    localStorage.setItem(TIMETABLE_REFRESH_KEY, String(Date.now()));
  } catch (_) {
    /* private mode / blocked storage */
  }
  try {
    window.dispatchEvent(new Event(TIMETABLE_UPDATED_EVENT));
  } catch (_) {
    /* non-browser */
  }
}

/** Returns conflict message when API sends TIMETABLE_CONFLICT (409), else null. */
export function getTimetableConflictMessage(err) {
  const st = err?.response?.status;
  const data = err?.response?.data;
  if (st === 409 && data?.code === "TIMETABLE_CONFLICT" && data?.message) {
    return String(data.message);
  }
  return null;
}

function roleHeaders(role) {
  return { role: role === "Student" ? "Student" : "Admin" };
}

/**
 * @param {'Admin'|'Student'} [role='Admin'] — Students only receive Published rows.
 */
export function getTimetable(role = "Admin", filters = {}) {
  const params = {};
  if (filters.academic_year) params.academic_year = filters.academic_year;
  if (filters.semester) params.semester = filters.semester;
  if (filters.subject) params.subject = filters.subject;
  return api.get("/", { headers: roleHeaders(role), params });
}

export function createTimetable(data, role = "Admin") {
  return api.post("/", data, { headers: roleHeaders(role) });
}

export function updateTimetable(id, data, role = "Admin") {
  return api.put(`/${id}`, data, { headers: roleHeaders(role) });
}

export function deleteTimetable(id, role = "Admin") {
  return api.delete(`/${id}`, { headers: roleHeaders(role) });
}

export function publishTimetable(id, role = "Admin") {
  return api.put(`/publish/${id}`, {}, { headers: roleHeaders(role) });
}
