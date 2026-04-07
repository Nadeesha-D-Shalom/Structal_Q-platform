import axios from "axios";

const API = axios.create({
    baseURL: "/api/evaluation-scheduling",
    headers: { "Content-Type": "application/json" },
});

// ── LOCATION ─────────────────────────────────────────────────────────
export const getLocations    = ()           => API.get("/locations");
export const createLocation  = (data)       => API.post("/locations", data);
export const updateLocation  = (id, data)   => API.put(`/locations/${id}`, data);
export const deleteLocation  = (id)         => API.delete(`/locations/${id}`);

// ── SCHEDULE ─────────────────────────────────────────────────────────
export const createSchedule  = (data)       => API.post("/schedules", data);
export const updateSchedule  = (id, data)   => API.put(`/schedules/${id}`, data);
export const getSchedules    = ()           => API.get("/schedules");
export const publishSchedule = (id, userId) => API.patch(`/schedules/${id}/publish`, { published_by: userId });
export const cancelSchedule  = (id)         => API.patch(`/schedules/${id}/cancel`, {});
export const deleteSchedule  = (id)         => API.delete(`/schedules/${id}`);

// ── SLOTS ─────────────────────────────────────────────────────────────
export const getSlots        = (scheduleId)      => API.get(`/schedules/${scheduleId}/slots`);
export const assignGroup     = (slotId, data)    => API.post(`/slots/${slotId}/assign`, data);

// ── CONFLICTS ─────────────────────────────────────────────────────────
export const getConflicts      = (scheduleId) => API.get(`/schedules/${scheduleId}/conflicts`);

// ── ASSESSMENTS ───────────────────────────────────────────────────────
export const getAssessments    = ()           => API.get("/assessments");

// ── EMAIL LOGS ────────────────────────────────────────────────────────
export const getEmailLogs      = (scheduleId) => API.get(`/schedules/${scheduleId}/email-logs`);
export const retryFailedEmails = (scheduleId) => API.post(`/schedules/${scheduleId}/retry-emails`);
export const sendReminderBlast = (scheduleId) => API.post(`/schedules/${scheduleId}/send-reminders`);
export const resendGroupEmail  = (logId)      => API.post(`/email-logs/${logId}/resend`);

// ── STUDENT VIEW ──────────────────────────────────────────────────────
export const getStudentSchedules = () => API.get("/student/schedules");

export default API;
