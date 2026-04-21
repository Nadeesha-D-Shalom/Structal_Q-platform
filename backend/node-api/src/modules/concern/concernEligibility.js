const { sql } = require("../../config/db");

/**
 * Returns { ok, message? } — whether a student may raise a concern for this submission.
 * Uses concern_window row when present; otherwise falls back to 48h after published_at on final_mark.
 */
async function assertActiveConcernWindow(pool, submissionId, studentUserId) {
  const sub = await pool
    .request()
    .input("sid", sql.BigInt, submissionId)
    .query(`
      SELECT s.student_id, s.assessment_id, fm.published_at
      FROM submission s
      LEFT JOIN final_mark fm ON fm.submission_id = s.submission_id
      WHERE s.submission_id = @sid
        AND (s.submission_status IS NULL OR s.submission_status <> 'DELETED');
    `);
  if (!sub.recordset?.length) {
    return { ok: false, message: "Submission not found." };
  }
  const row = sub.recordset[0];
  if (Number(row.student_id) !== Number(studentUserId)) {
    return { ok: false, message: "You can only raise concerns for your own submissions." };
  }
  if (!row.published_at) {
    return { ok: false, message: "Marks are not published yet for this submission." };
  }
  const pub = new Date(row.published_at).getTime();
  const within48 = Date.now() - pub <= 48 * 60 * 60 * 1000;

  try {
    const cw = await pool
      .request()
      .input("aid", sql.BigInt, row.assessment_id)
      .query(`
        SELECT TOP 1 open_from, open_until, status
        FROM concern_window
        WHERE assessment_id = @aid;
      `);
    if (cw.recordset?.length) {
      const w = cw.recordset[0];
      if (w.status && String(w.status).toUpperCase() === "CLOSED") {
        return { ok: false, message: "The concern window for this assessment is closed." };
      }
      if (w.open_from && w.open_until) {
        const a = new Date(w.open_from).getTime();
        const b = new Date(w.open_until).getTime();
        const now = Date.now();
        if (now >= a && now <= b) return { ok: true };
        return { ok: false, message: "The concern window is not active for this assessment." };
      }
    }
  } catch (e) {
    console.warn("[concernEligibility] concern_window check:", e.message);
  }

  if (within48) return { ok: true };
  return { ok: false, message: "The concern window has ended for this submission." };
}

module.exports = { assertActiveConcernWindow };
