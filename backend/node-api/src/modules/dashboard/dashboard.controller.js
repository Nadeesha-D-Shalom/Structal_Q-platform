const { pool, poolConnect, sql } = require("../../config/db");

function riskColor(risk) {
  const l = (risk || "").toUpperCase();
  if (l === "HIGH") return { bg: "bg-red-500", text: "text-white" };
  if (l === "MEDIUM") return { bg: "bg-yellow-500", text: "text-black" };
  return { bg: "bg-green-500", text: "text-white" };
}

function concernColor() {
  return { bg: "bg-amber-500", text: "text-black" };
}

function fmtTimeLabel(ts) {
  try {
    const d = ts ? new Date(ts) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(mins, 0)} MINS AGO`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} HOURS AGO`;
    const days = Math.floor(hrs / 24);
    return days <= 1 ? "YESTERDAY" : `${days} DAYS AGO`;
  } catch {
    return "";
  }
}

async function safeDashboardQuery(label, run) {
  try {
    return await run();
  } catch (err) {
    console.warn(`[dashboard] ${label}:`, err.message);
    return { recordset: [] };
  }
}

/** mark_concern shape differs between scripts (submission-based vs final_mark-based). */
async function queryConcernActivitiesForDashboard() {
  try {
    return await pool.request().query(`
      SELECT TOP 5
        mc.created_at AS ts,
        a.assessment_title AS assessment_title,
        sub.subject_name AS subject_name
      FROM mark_concern mc
      INNER JOIN submission s ON s.submission_id = mc.submission_id
      INNER JOIN assessment a ON a.assessment_id = s.assessment_id
      INNER JOIN subject_offering so ON a.offering_id = so.offering_id
      INNER JOIN subject sub ON sub.subject_id = so.subject_id
      WHERE mc.concern_status = 'Pending'
      ORDER BY mc.created_at DESC;
    `);
  } catch (e1) {
    try {
      return await pool.request().query(`
        SELECT TOP 5
          mc.submitted_at AS ts,
          a.assessment_title AS assessment_title,
          sub.subject_name AS subject_name
        FROM mark_concern mc
        LEFT JOIN final_mark fm ON fm.final_mark_id = mc.final_mark_id
        LEFT JOIN submission s ON s.submission_id = fm.submission_id
        LEFT JOIN assessment a ON a.assessment_id = s.assessment_id
        LEFT JOIN subject_offering so ON so.offering_id = a.offering_id
        LEFT JOIN subject sub ON sub.subject_id = so.subject_id
        WHERE mc.status = 'Pending'
        ORDER BY mc.submitted_at DESC;
      `);
    } catch (e2) {
      console.warn("[dashboard] concern_activities:", e1.message, "| fallback:", e2.message);
      return { recordset: [] };
    }
  }
}

exports.getLecturerDashboardSummary = async (req, res) => {
  try {
    await poolConnect;

    const [
      pendingReviewsRes,
      highRiskRes,
      guidesRes,
      aiActivitiesRes,
      concernActivitiesRes,
    ] = await Promise.all([
      safeDashboardQuery("pending_reviews", () =>
        pool.request().query(`
      SELECT COUNT(DISTINCT s.submission_id) AS pending_reviews_count
      FROM submission s
      JOIN analysis_result ar
        ON ar.submission_id = s.submission_id
       AND ar.status = 'COMPLETED'
      LEFT JOIN final_mark fm
        ON fm.submission_id = s.submission_id
      WHERE fm.submission_id IS NULL;
    `)
      ),
      safeDashboardQuery("high_risk", () =>
        pool.request().query(`
      WITH latest AS (
        SELECT
          submission_id,
          analysis_result_id,
          risk_level,
          ROW_NUMBER() OVER (
            PARTITION BY submission_id
            ORDER BY analysis_result_id DESC
          ) AS rn
        FROM analysis_result
        WHERE status = 'COMPLETED'
      )
      SELECT COUNT(*) AS high_risk_count
      FROM latest
      LEFT JOIN final_mark fm
        ON fm.submission_id = latest.submission_id
      WHERE rn = 1
        AND ISNULL(risk_level, 'LOW') = 'HIGH'
        AND fm.submission_id IS NULL;
    `)
      ),
      safeDashboardQuery("guides", () =>
        pool.request().query(`
      SELECT COUNT(*) AS active_guides_count
      FROM marking_guide
      WHERE ISNULL(status, 'ACTIVE') = 'ACTIVE';
    `)
      ),
      safeDashboardQuery("ai_activities", () =>
        pool.request().query(`
      SELECT TOP 5
        ar.completed_at AS ts,
        ar.risk_level AS risk_level,
        sub.subject_name AS subject_name,
        CONCAT('ML Analysis completed: ', a.assessment_title) AS text
      FROM analysis_result ar
      INNER JOIN submission s ON s.submission_id = ar.submission_id
      INNER JOIN assessment a ON a.assessment_id = s.assessment_id
      INNER JOIN subject_offering so ON a.offering_id = so.offering_id
      INNER JOIN subject sub ON sub.subject_id = so.subject_id
      WHERE ar.status = 'COMPLETED'
      ORDER BY ar.completed_at DESC;
    `)
      ),
      safeDashboardQuery("concern_activities", () => queryConcernActivitiesForDashboard()),
    ]);

    const aiActivities = (aiActivitiesRes.recordset || []).map((r) => ({
      ts: r.ts,
      text: r.text,
      subject: r.subject_name || "—",
      time: fmtTimeLabel(r.ts),
      risk_level: r.risk_level,
      colorClass: riskColor(r.risk_level),
      kind: "AI",
    }));

    const concernActivities = (concernActivitiesRes.recordset || []).map((r) => ({
      ts: r.ts,
      text: `New concern: ${r.assessment_title}`,
      subject: r.subject_name || "—",
      time: fmtTimeLabel(r.ts),
      colorClass: concernColor(),
      kind: "CONCERN",
    }));

    const recentActivities = [...aiActivities, ...concernActivities]
      .sort((a, b) => {
        const da = a.ts ? new Date(a.ts).getTime() : 0;
        const db = b.ts ? new Date(b.ts).getTime() : 0;
        return db - da;
      })
      .slice(0, 5)
      .map((a) => ({
        text: a.text,
        subject: a.subject || "—",
        time: a.time,
        color: a.colorClass.bg,
      }));

    res.json({
      success: true,
      data: {
        pending_reviews_count: pendingReviewsRes.recordset?.[0]?.pending_reviews_count || 0,
        high_risk_count: highRiskRes.recordset?.[0]?.high_risk_count || 0,
        active_guides_count: guidesRes.recordset?.[0]?.active_guides_count || 0,
        recent_activities: recentActivities,
      },
    });
  } catch (err) {
    console.error("Lecturer dashboard summary error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStudentDashboardSummary = async (req, res) => {
  try {
    await poolConnect;

    const studentId = req.user?.user_id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "student id missing from token" });
    }

    const statsRes = await pool.request()
      .input("student_id", sql.BigInt, studentId)
      .query(`
        SELECT
          COUNT(DISTINCT sub.subject_id) AS total_subjects,
          COUNT(*) AS total_assignments
        FROM final_mark fm
        INNER JOIN submission s ON fm.submission_id = s.submission_id
        INNER JOIN assessment a ON s.assessment_id = a.assessment_id
        INNER JOIN subject_offering so ON a.offering_id = so.offering_id
        INNER JOIN subject sub ON so.subject_id = sub.subject_id
        WHERE s.student_id = @student_id
          AND fm.marking_status = 'PUBLISHED';
      `);

    const submissionsCountRes = await pool.request()
      .input("student_id", sql.BigInt, studentId)
      .query(`
        SELECT COUNT(*) AS my_submissions_count
        FROM submission s
        WHERE s.student_id = @student_id;
      `);

    const concernsRes = await pool.request()
      .input("student_id", sql.BigInt, studentId)
      .query(`
        SELECT COUNT(*) AS active_concerns_count
        FROM mark_concern mc
        INNER JOIN final_mark fm ON fm.final_mark_id = mc.final_mark_id
        WHERE fm.submission_id IN (
          SELECT submission_id FROM submission WHERE student_id = @student_id
        )
          AND mc.status = 'Pending';
      `);

    // Recent activities: merge submissions + concerns + published marks
    const submissionsRes = await pool.request()
      .input("student_id", sql.BigInt, studentId)
      .query(`
        SELECT TOP 4
          s.submitted_at AS ts,
          CONCAT('Assignment submitted: ', a.assessment_title, ' (', sub.subject_name, ')') AS text
        FROM submission s
        INNER JOIN assessment a ON s.assessment_id = a.assessment_id
        INNER JOIN subject_offering so ON a.offering_id = so.offering_id
        INNER JOIN subject sub ON so.subject_id = sub.subject_id
        WHERE s.student_id = @student_id
        ORDER BY s.submitted_at DESC;
      `);

    const marksRes = await pool.request()
      .input("student_id", sql.BigInt, studentId)
      .query(`
        SELECT TOP 4
          fm.published_at AS ts,
          CONCAT('Grade updated: ', a.assessment_title) AS text
        FROM final_mark fm
        INNER JOIN submission s ON fm.submission_id = s.submission_id
        INNER JOIN assessment a ON s.assessment_id = a.assessment_id
        WHERE s.student_id = @student_id
          AND fm.marking_status = 'PUBLISHED'
        ORDER BY fm.published_at DESC;
      `);

    const concernsActivitiesRes = await pool.request()
      .input("student_id", sql.BigInt, studentId)
      .query(`
        SELECT TOP 4
          mc.submitted_at AS ts,
          CONCAT('Concern raised: ', a.assessment_title) AS text
        FROM mark_concern mc
        INNER JOIN final_mark fm ON fm.final_mark_id = mc.final_mark_id
        INNER JOIN submission s ON s.submission_id = fm.submission_id
        INNER JOIN assessment a ON s.assessment_id = a.assessment_id
        WHERE mc.student_id = @student_id
        ORDER BY mc.submitted_at DESC;
      `);

    const merged = [
      ...(submissionsRes.recordset || []).map((r) => ({ ts: r.ts, text: r.text, color: "bg-blue-500" })),
      ...(concernsActivitiesRes.recordset || []).map((r) => ({ ts: r.ts, text: r.text, color: "bg-amber-500" })),
      ...(marksRes.recordset || []).map((r) => ({ ts: r.ts, text: r.text, color: "bg-green-500" })),
    ]
      .sort((a, b) => new Date(b.ts || 0).getTime() - new Date(a.ts || 0).getTime())
      .slice(0, 5)
      .map((x) => ({
        text: x.text,
        time: fmtTimeLabel(x.ts),
        color: x.color,
      }));

    res.json({
      success: true,
      data: {
        total_subjects: statsRes.recordset?.[0]?.total_subjects || 0,
        total_assignments: statsRes.recordset?.[0]?.total_assignments || 0,
        my_submissions_count: submissionsCountRes.recordset?.[0]?.my_submissions_count || 0,
        active_concerns_count: concernsRes.recordset?.[0]?.active_concerns_count || 0,
        recent_activities: merged,
      },
    });
  } catch (err) {
    console.error("Student dashboard summary error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

