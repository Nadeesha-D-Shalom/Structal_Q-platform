const { pool, poolConnect, sql } = require("../../config/db");
const notificationService = require("../notification/notification.service");

// ==============================
// CREATE ASSESSMENT
// ==============================
exports.createAssessment = async (req, res) => {
  const {
    offering_id,
    assessment_title,
    assessment_type,
    total_marks,
    start_date,
    due_date,
    allow_resubmission,
    max_resubmissions,
    late_policy_enabled,
    grace_minutes,
  } = req.body;

  if (!offering_id || !assessment_title || !assessment_type) {
    return res.status(400).json({
      message: "offering_id, assessment_title, assessment_type are required",
    });
  }

  const titleTrim = String(assessment_title).trim();
  const createdBy = req.user?.user_id ? Number(req.user.user_id) : 1;

  try {
    await poolConnect;

    const offeringOk = await pool
      .request()
      .input("oid", sql.BigInt, offering_id)
      .query(`SELECT 1 AS ok FROM subject_offering WHERE offering_id = @oid`);
    if (!offeringOk.recordset?.length) {
      return res.status(400).json({ message: "Invalid subject_offering (offering_id not found)" });
    }

    const dup = await pool
      .request()
      .input("oid", sql.BigInt, offering_id)
      .input("title", sql.NVarChar(255), titleTrim)
      .query(`
        SELECT TOP 1 assessment_id
        FROM assessment
        WHERE offering_id = @oid
          AND LOWER(LTRIM(RTRIM(assessment_title))) = LOWER(LTRIM(RTRIM(@title)))
          AND ISNULL(status, 'ACTIVE') = 'ACTIVE';
      `);
    if (dup.recordset?.length) {
      return res.status(409).json({
        message: "An assignment with this title already exists for this subject offering",
      });
    }

    const sd = start_date ? new Date(start_date) : null;
    const dd = due_date ? new Date(due_date) : null;
    if (sd && dd && sd > dd) {
      return res.status(400).json({ message: "start_date must be before or equal to due_date" });
    }

    const insertRes = await pool
      .request()
      .input("offering_id", sql.BigInt, offering_id)
      .input("assessment_title", sql.NVarChar(255), titleTrim)
      .input("assessment_type", sql.NVarChar(50), assessment_type)
      .input("total_marks", sql.Decimal(10, 2), total_marks ?? null)
      .input("start_date", sql.DateTime2, sd)
      .input("due_date", sql.DateTime2, dd)
      .input("allow_resubmission", sql.Bit, allow_resubmission ? 1 : 0)
      .input("max_resubmissions", sql.Int, max_resubmissions ?? null)
      .input("late_policy_enabled", sql.Bit, late_policy_enabled ? 1 : 0)
      .input("grace_minutes", sql.Int, grace_minutes ?? null)
      .input("created_by", sql.BigInt, createdBy)
      .query(`
        INSERT INTO assessment (
          offering_id,
          assessment_title,
          assessment_type,
          total_marks,
          start_date,
          due_date,
          allow_resubmission,
          max_resubmissions,
          late_policy_enabled,
          grace_minutes,
          created_by,
          created_at,
          status
        )
        OUTPUT INSERTED.assessment_id
        VALUES (
          @offering_id,
          @assessment_title,
          @assessment_type,
          @total_marks,
          @start_date,
          @due_date,
          @allow_resubmission,
          @max_resubmissions,
          @late_policy_enabled,
          @grace_minutes,
          @created_by,
          GETDATE(),
          'ACTIVE'
        )
      `);

    const newId = insertRes.recordset?.[0]?.assessment_id;
    let subjectName = "";
    try {
      const sn = await pool
        .request()
        .input("oid", sql.BigInt, offering_id)
        .query(`
          SELECT TOP 1 s.subject_name
          FROM subject_offering so
          INNER JOIN subject s ON s.subject_id = so.subject_id
          WHERE so.offering_id = @oid;
        `);
      subjectName = sn.recordset?.[0]?.subject_name || "";
    } catch {
      /* ignore */
    }

    try {
      await notificationService.notifyStudentsNewAssignmentBroadcast({
        assessmentTitle: titleTrim,
        subjectName,
      });
    } catch (e) {
      console.warn("[assessment] assignment notifications:", e.message);
    }

    res.status(201).json({
      message: "Assessment created successfully",
      assessment_id: newId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==============================
// GET ALL ASSESSMENTS
// ==============================
exports.getAssessments = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        a.*,
        so.subject_id,
        s.subject_name
      FROM assessment a
      JOIN subject_offering so ON a.offering_id = so.offering_id
      JOIN subject s ON so.subject_id = s.subject_id
      WHERE a.status = 'ACTIVE'
      ORDER BY a.created_at DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==============================
// GET ASSESSMENT BY ID
// ==============================
exports.getAssessmentById = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("id", sql.BigInt, req.params.id)
      .query(`
        SELECT 
          a.*,
          so.subject_id,
          s.subject_name
        FROM assessment a
        JOIN subject_offering so ON a.offering_id = so.offering_id
        JOIN subject s ON so.subject_id = s.subject_id
        WHERE a.assessment_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Assessment not found",
      });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==============================
// UPDATE ASSESSMENT
// ==============================
exports.updateAssessment = async (req, res) => {
  const { assessment_title, total_marks, start_date, due_date } = req.body;

  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("id", sql.BigInt, req.params.id)
      .input("assessment_title", sql.NVarChar(255), assessment_title)
      .input("total_marks", sql.Decimal(10, 2), total_marks)
      .input("start_date", sql.DateTime2, start_date ? new Date(start_date) : null)
      .input("due_date", sql.DateTime2, due_date ? new Date(due_date) : null)
      .query(`
        UPDATE assessment
        SET 
          assessment_title = @assessment_title,
          total_marks = @total_marks,
          start_date = @start_date,
          due_date = @due_date,
          updated_at = GETDATE()
        WHERE assessment_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        message: "Assessment not found",
      });
    }

    res.json({
      message: "Assessment updated successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==============================
// SOFT DELETE (DEACTIVATE)
// ==============================
exports.deleteAssessment = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("id", sql.BigInt, req.params.id)
      .query(`
        UPDATE assessment
        SET 
          status = 'INACTIVE',
          updated_at = GETDATE()
        WHERE assessment_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        message: "Assessment not found",
      });
    }

    res.json({
      message: "Assessment deactivated successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Student lab portal: assignments with deadlines, submit eligibility, and UI status.
 * Mirrors submission.upload time-window rules.
 */
exports.getStudentLabAssignments = async (req, res) => {
  try {
    const studentId = req.user?.user_id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    await poolConnect;
    const result = await pool
      .request()
      .input("sid", sql.BigInt, studentId)
      .query(`
        SELECT
          a.assessment_id,
          a.assessment_title,
          a.assessment_type,
          a.total_marks,
          a.start_date,
          a.due_date,
          a.allow_resubmission,
          a.max_resubmissions,
          a.late_policy_enabled,
          a.grace_minutes,
          a.requires_ai_analysis,
          a.status AS assessment_status,
          sub.subject_name,
          sub.subject_code,
          so.offering_id,
          so.academic_year,
          so.semester,
          latest.submission_id,
          latest.attempt_no,
          latest.submitted_at,
          fm.marking_status,
          fm.published_at,
          fm.total_marks_awarded
        FROM assessment a
        INNER JOIN subject_offering so ON a.offering_id = so.offering_id
        INNER JOIN subject sub ON so.subject_id = sub.subject_id
        OUTER APPLY (
          SELECT TOP 1
            s2.submission_id,
            s2.attempt_no,
            s2.submitted_at,
            s2.submission_status
          FROM submission s2
          WHERE s2.assessment_id = a.assessment_id
            AND s2.student_id = @sid
            AND (s2.submission_status IS NULL OR s2.submission_status <> 'DELETED')
          ORDER BY s2.attempt_no DESC, s2.submission_id DESC
        ) latest
        LEFT JOIN final_mark fm ON fm.submission_id = latest.submission_id
        WHERE ISNULL(a.status, 'ACTIVE') = 'ACTIVE'
        ORDER BY a.due_date DESC;
      `);

    const serverTime = new Date().toISOString();
    const rows = (result.recordset || []).map((row) => {
      const now = Date.now();
      const startMs = row.start_date ? new Date(row.start_date).getTime() : null;
      const dueMs = row.due_date ? new Date(row.due_date).getTime() : null;
      const graceMs = (Number(row.grace_minutes) || 0) * 60000;
      const windowEndMs = dueMs != null ? dueMs + graceMs : null;
      const att = row.attempt_no != null ? Number(row.attempt_no) : 0;
      const maxR =
        row.max_resubmissions != null && row.max_resubmissions !== undefined
          ? Number(row.max_resubmissions)
          : null;

      let canSubmit = false;
      let lab_status = "not_available";

      if (row.marking_status === "PUBLISHED") {
        lab_status = "published";
      } else if (row.marking_status === "VALIDATED") {
        lab_status = att >= 1 ? "evaluated" : "not_available";
        canSubmit = false;
      } else if (startMs != null && now < startMs) {
        lab_status = "not_available";
      } else if (dueMs == null) {
        lab_status = "not_available";
      } else if (windowEndMs != null && now > windowEndMs) {
        lab_status = att >= 1 ? (att > 1 ? "resubmitted" : "submitted") : "closed";
      } else if (now > dueMs && !row.late_policy_enabled) {
        lab_status = att >= 1 ? (att > 1 ? "resubmitted" : "submitted") : "closed";
      } else {
        canSubmit = true;
        if (att >= 1) {
          if (!row.allow_resubmission) {
            canSubmit = false;
            lab_status = att > 1 ? "resubmitted" : "submitted";
          } else if (maxR != null && att >= 1 + maxR) {
            canSubmit = false;
            lab_status = "resubmitted";
          } else {
            lab_status = "open_resubmit";
          }
        } else {
          lab_status = now > dueMs ? "open_late" : "open";
        }
      }

      if (row.marking_status === "PUBLISHED") {
        canSubmit = false;
      }

      let seconds_remaining = null;
      if (windowEndMs != null && now <= windowEndMs) {
        seconds_remaining = Math.max(0, Math.floor((windowEndMs - now) / 1000));
      }

      return {
        ...row,
        server_time: serverTime,
        can_submit: canSubmit,
        lab_status,
        seconds_remaining,
      };
    });

    res.json({ success: true, data: rows, server_time: serverTime });
  } catch (err) {
    console.error("getStudentLabAssignments:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
