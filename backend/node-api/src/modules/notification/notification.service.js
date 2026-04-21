const { pool, poolConnect, sql } = require("../../config/db");
const { normalizeRole } = require("../../utils/roleNormalize");

async function insertNotification(userId, title, message, type) {
  await poolConnect;
  await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .input("title", sql.NVarChar(255), title)
    .input("message", sql.NVarChar(sql.MAX), message)
    .input("type", sql.NVarChar(50), type)
    .query(`
      INSERT INTO notification (user_id, title, message, type, is_read, created_at)
      VALUES (@user_id, @title, @message, @type, 0, SYSUTCDATETIME());
    `);
}

/** Safe export for other modules (single insert; failures are non-fatal). */
exports.insertForUser = async (userId, title, message, type) => {
  try {
    await insertNotification(userId, title, message, type || "GENERAL");
    return true;
  } catch (e) {
    console.warn("[notification] insertForUser:", e.message);
    return false;
  }
};

/**
 * Notify all students who have a submission for this assessment.
 */
exports.notifyStudentsForAssessment = async (assessmentId, title, message, type) => {
  await poolConnect;
  const r = await pool
    .request()
    .input("aid", sql.BigInt, assessmentId)
    .query(`
      SELECT DISTINCT s.student_id
      FROM submission s
      WHERE s.assessment_id = @aid
        AND (s.submission_status IS NULL OR s.submission_status <> 'DELETED');
    `);
  const rows = r.recordset || [];
  for (const row of rows) {
    await insertNotification(row.student_id, title, message, type);
  }
  return rows.length;
};

exports.listForUser = async (userId, limit = 50) => {
  await poolConnect;
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const result = await pool
    .request()
    .input("uid", sql.BigInt, userId)
    .input("lim", sql.Int, lim)
    .query(`
      SELECT
        notification_id,
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
      FROM notification
      WHERE user_id = @uid
      ORDER BY created_at DESC
      OFFSET 0 ROWS FETCH NEXT @lim ROWS ONLY;
    `);
  return result.recordset || [];
};

exports.getUnreadCount = async (userId) => {
  await poolConnect;
  const result = await pool
    .request()
    .input("uid", sql.BigInt, userId)
    .query(`
      SELECT COUNT(*) AS cnt
      FROM notification
      WHERE user_id = @uid AND is_read = 0;
    `);
  return Number(result.recordset?.[0]?.cnt ?? 0);
};

exports.markRead = async (notificationId, userId) => {
  await poolConnect;
  const result = await pool
    .request()
    .input("nid", sql.BigInt, notificationId)
    .input("uid", sql.BigInt, userId)
    .query(`
      UPDATE notification
      SET is_read = 1
      WHERE notification_id = @nid AND user_id = @uid;
    `);
  return result.rowsAffected?.[0] > 0;
};

exports.markAllRead = async (userId) => {
  await poolConnect;
  await pool
    .request()
    .input("uid", sql.BigInt, userId)
    .query(`
      UPDATE notification
      SET is_read = 1
      WHERE user_id = @uid AND is_read = 0;
    `);
};

/**
 * Broadcast "new assignment" to all active student accounts.
 * Scoped to entire platform — enable only when appropriate (e.g. small cohorts).
 * Set NOTIFY_STUDENTS_ON_ASSIGNMENT=true in .env to turn on.
 */
exports.notifyStudentsNewAssignmentBroadcast = async ({ assessmentTitle, subjectName }) => {
  if (process.env.NOTIFY_STUDENTS_ON_ASSIGNMENT !== "true") {
    return 0;
  }
  await poolConnect;
  let rows;
  try {
    const r = await pool.request().query(`
      SELECT user_id, role FROM users
      WHERE ISNULL(status, 'ACTIVE') = 'ACTIVE';
    `);
    rows = r.recordset || [];
  } catch (e) {
    console.warn("[notification] notifyStudentsNewAssignmentBroadcast:", e.message);
    return 0;
  }
  let n = 0;
  const title = "New lab assignment";
  const msg = `A new assignment "${assessmentTitle}" was added${subjectName ? ` (${subjectName})` : ""}. Open Submissions to view deadlines.`;
  for (const row of rows) {
    if (normalizeRole(row.role) !== "student") continue;
    try {
      await insertNotification(row.user_id, title, msg, "ASSIGNMENT_CREATED");
      n++;
    } catch (e) {
      /* ignore single failure */
    }
  }
  return n;
};

/**
 * Notify all active student accounts (in-app). Use for exam timetable publish and similar broadcasts.
 */
exports.notifyAllActiveStudents = async (title, message, type) => {
  await poolConnect;
  let rows;
  try {
    const r = await pool.request().query(`
      SELECT user_id, role FROM users
      WHERE ISNULL(status, 'ACTIVE') = 'ACTIVE';
    `);
    rows = r.recordset || [];
  } catch (e) {
    console.warn("[notification] notifyAllActiveStudents:", e.message);
    return 0;
  }
  let n = 0;
  for (const row of rows) {
    if (normalizeRole(row.role) !== "student") continue;
    try {
      await insertNotification(row.user_id, title, message, type || "ANNOUNCEMENT");
      n++;
    } catch {
      /* ignore */
    }
  }
  return n;
};
