const { pool, poolConnect, sql } = require('../../config/db');
const fs = require('fs');
const path = require("path");

function createBadRequest(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function parseNumericId(value, fieldName) {
    if (value === undefined || value === null || String(value).trim() === "") {
        throw createBadRequest(`${fieldName} is required`);
    }

    const parsed = Number(String(value).trim());
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw createBadRequest(
            `${fieldName} must be a positive integer (received: ${value})`
        );
    }

    return parsed;
}


// =====================================================
// UPLOAD SUBMISSION
// =====================================================
exports.upload = async (req) => {
    try {
        await poolConnect;

        if (!req.file) throw new Error("File required");

        const rawAssessmentId = req.body.assessment_id ?? req.body.assessmentId;
        const rawStudentId = req.user?.user_id ?? req.body.student_id ?? req.body.studentId;

        const assessment_id = parseNumericId(rawAssessmentId, "assessment_id");
        const student_id = parseNumericId(rawStudentId, "student_id");

        // ================= FILE VALIDATION =================
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!allowedTypes.includes(req.file.mimetype)) {
            throw new Error("Only PDF and DOCX files are allowed");
        }

        // ================= ASSESSMENT =================
        const assessmentRes = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`SELECT * FROM assessment WHERE assessment_id = @assessment_id`);

        if (!assessmentRes.recordset.length) {
            throw new Error("Assessment not found");
        }

        const assess = assessmentRes.recordset[0];

        const now = new Date();

        // ================= TIME WINDOW (start → due + grace) =================
        if (assess.start_date) {
            const start = new Date(assess.start_date);
            if (now.getTime() < start.getTime()) {
                throw createBadRequest("Submission is not open yet (before start date)");
            }
        }

        if (!assess.due_date) {
            throw createBadRequest("Assessment has no due date configured");
        }

        const dueMs = new Date(assess.due_date).getTime();
        const graceMin = Number(assess.grace_minutes ?? assess.grace_period_minutes ?? 0) || 0;
        const graceEndMs = dueMs + graceMin * 60000;

        if (now.getTime() > graceEndMs) {
            throw createBadRequest("Submission period is closed (past due date and grace period)");
        }

        let isLate = 0;
        let lateMinutes = 0;
        if (now.getTime() > dueMs) {
            isLate = 1;
            lateMinutes = Math.floor((now.getTime() - dueMs) / 60000);
            if (!assess.late_policy_enabled) {
                throw createBadRequest("Late submission is not allowed for this assignment");
            }
        }

        // ================= ATTEMPT / RESUBMISSION =================
        const attemptRes = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('student_id', sql.Int, student_id)
            .query(`
                SELECT MAX(attempt_no) AS maxAttempt
                FROM submission
                WHERE assessment_id = @assessment_id
                AND student_id = @student_id
                AND (submission_status IS NULL OR submission_status <> 'DELETED')
            `);

        const maxPrev = attemptRes.recordset[0].maxAttempt;
        const attemptNo = maxPrev ? maxPrev + 1 : 1;

        if (attemptNo > 1) {
            if (!assess.allow_resubmission) {
                throw createBadRequest("Resubmission is not allowed for this assignment");
            }
            const maxR = assess.max_resubmissions;
            if (maxR != null && maxR !== undefined && attemptNo > 1 + Number(maxR)) {
                throw createBadRequest("Maximum submission attempts reached");
            }
        }

        // ================= PATH (normalize slashes for cross-platform DB rows) =================
        const fullPath = path.resolve(req.file.path).replace(/\\/g, "/");

        // ================= INSERT FILE =================
        const fileInsert = await pool.request()
            .input('original_file_name', sql.VarChar, req.file.originalname)
            .input('stored_file_name', sql.VarChar, req.file.filename)
            .input('storage_category', sql.VarChar, "STUDENT_SUBMISSION") // ✅ FIXED
            .input('storage_path', sql.VarChar, fullPath)
            .input('mime_type', sql.VarChar, req.file.mimetype)
            .input('file_size_bytes', sql.BigInt, req.file.size)
            // Hashing disabled (per requirements). Store NULL.
            .input('sha256_hash', sql.VarChar, null)
            .input('upload_user_id', sql.Int, student_id)
            .query(`
                INSERT INTO file_storage (
                    original_file_name,
                    stored_file_name,
                    storage_category,
                    storage_path,
                    mime_type,
                    file_size_bytes,
                    sha256_hash,
                    upload_user_id
                )
                OUTPUT INSERTED.file_id
                VALUES (
                    @original_file_name,
                    @stored_file_name,
                    @storage_category,
                    @storage_path,
                    @mime_type,
                    @file_size_bytes,
                    @sha256_hash,
                    @upload_user_id
                )
            `);

        const file_id = fileInsert.recordset[0].file_id;

        // ================= INSERT SUBMISSION =================
        await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('student_id', sql.Int, student_id)
            .input('attempt_no', sql.Int, attemptNo)
            .input('is_late', sql.Bit, isLate)
            .input('late_minutes', sql.Int, lateMinutes)
            .input('file_id', sql.Int, file_id)
            // Hashing disabled (per requirements). Store NULL.
            .input('integrity_hash', sql.VarChar, null)
            .query(`
                INSERT INTO submission (
                    assessment_id,
                    student_id,
                    attempt_no,
                    submitted_at,
                    is_late,
                    late_minutes,
                    file_id,
                    integrity_hash
                )
                VALUES (
                    @assessment_id,
                    @student_id,
                    @attempt_no,
                    GETDATE(),
                    @is_late,
                    @late_minutes,
                    @file_id,
                    @integrity_hash
                )
            `);

        return {
            success: true,
            message: "Submission successful",
            data: { attemptNo, isLate, lateMinutes, file_id }
        };

    } catch (error) {
        console.error("Upload Error:", error.message);
        throw error;
    }
};


// =====================================================
// GET ALL SUBMISSIONS (LECTURER)
// =====================================================
exports.getAllSubmissionsForLecturer = async () => {
    await poolConnect;

    const result = await pool.request().query(`
        SELECT 
            s.submission_id,
            s.assessment_id,
            s.student_id,
            s.attempt_no,
            s.is_late,
            s.late_minutes,
            s.file_id,
            s.submitted_at,
            f.original_file_name,
            f.storage_path,
            COALESCE(sub.subject_id, mg_sub.subject_id) AS subject_id,
            COALESCE(sub.subject_name, mg_sub.subject_name) AS subject_name,
            COALESCE(sub.subject_code, mg_sub.subject_code) AS subject_code,
            a.assessment_title,
            ISNULL(ar.similarity_avg, 0) AS similarity_avg,
            ISNULL(ar.risk_score, 0) AS risk_score
        FROM submission s
        INNER JOIN file_storage f ON s.file_id = f.file_id
        INNER JOIN assessment a ON s.assessment_id = a.assessment_id
        LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
        LEFT JOIN subject sub ON so.subject_id = sub.subject_id
        OUTER APPLY (
            SELECT TOP 1
                sx.subject_id,
                sx.subject_name,
                sx.subject_code
            FROM marking_guide mg
            INNER JOIN assessment ax ON mg.assessment_id = ax.assessment_id
            LEFT JOIN subject_offering sox ON ax.offering_id = sox.offering_id
            LEFT JOIN subject sx ON sox.subject_id = sx.subject_id
            WHERE mg.assessment_id = a.assessment_id
              AND sx.subject_id IS NOT NULL
            ORDER BY mg.marking_guide_id DESC
        ) mg_sub
        OUTER APPLY (
            SELECT TOP 1 *
            FROM analysis_result ar
            WHERE ar.submission_id = s.submission_id
            ORDER BY ar.analysis_result_id DESC
        ) ar
        WHERE f.storage_category = 'STUDENT_SUBMISSION'
        ORDER BY s.submitted_at DESC;
    `);

    return result.recordset;
};

/**
 * All submissions for the logged-in student (not limited to published marks).
 */
exports.getOwnSubmissionHistory = async (studentId) => {
    await poolConnect;

    const result = await pool.request()
        .input("student_id", sql.Int, studentId)
        .query(`
            SELECT
                s.submission_id,
                s.assessment_id,
                s.student_id,
                s.attempt_no,
                s.is_late,
                s.late_minutes,
                s.submitted_at,
                s.submission_status,
                f.original_file_name,
                f.storage_path,
                f.file_id,
                a.assessment_title,
                a.due_date,
                sub.subject_name,
                sub.subject_code,
                so.academic_year
            FROM submission s
            INNER JOIN file_storage f ON s.file_id = f.file_id
            INNER JOIN assessment a ON s.assessment_id = a.assessment_id
            INNER JOIN subject_offering so ON a.offering_id = so.offering_id
            INNER JOIN subject sub ON so.subject_id = sub.subject_id
            WHERE s.student_id = @student_id
              AND (s.submission_status IS NULL OR s.submission_status <> 'DELETED')
            ORDER BY s.submitted_at DESC
        `);

    return result.recordset;
};


exports.getSubmissionsByAssessment = async (assessmentId) => {
    await poolConnect;

    const result = await pool.request()
        .input("assessmentId", sql.Int, assessmentId)
        .query(`
            SELECT 
                s.submission_id,
                s.assessment_id,
                s.student_id,
                s.file_id,

                fs.storage_path,

                mg.marking_guide_id,
                fs2.storage_path AS guide_path

            FROM submission s

            INNER JOIN file_storage fs 
                ON s.file_id = fs.file_id

            INNER JOIN marking_guide mg 
                ON s.assessment_id = mg.assessment_id

            INNER JOIN file_storage fs2
                ON mg.file_id = fs2.file_id

            WHERE s.assessment_id = @assessmentId
              AND fs.storage_category = 'STUDENT_SUBMISSION'
        `);

    return result.recordset;
};

/**
 * One row per submission for a specific marking guide (avoids duplicate rows when multiple guides exist per assessment).
 * submissionIds: null/undefined = all submissions for the assessment; non-empty array = only those ids.
 */
exports.getSubmissionsForBatchEvaluation = async (assessmentId, markingGuideId, submissionIds) => {
    await poolConnect;

    const request = pool.request()
        .input("assessmentId", sql.Int, assessmentId)
        .input("markingGuideId", sql.BigInt, markingGuideId);

    let inFilter = "";
    if (Array.isArray(submissionIds) && submissionIds.length > 0) {
        const parts = [];
        submissionIds.forEach((id, i) => {
            const name = `sid${i}`;
            request.input(name, sql.BigInt, id);
            parts.push(`@${name}`);
        });
        inFilter = ` AND s.submission_id IN (${parts.join(", ")})`;
    }

    const result = await request.query(`
        SELECT 
            s.submission_id,
            s.assessment_id,
            s.student_id,
            s.file_id,
            fs.storage_path,
            mg.marking_guide_id,
            fs2.storage_path AS guide_path
        FROM submission s
        INNER JOIN file_storage fs ON s.file_id = fs.file_id
        INNER JOIN marking_guide mg
            ON mg.marking_guide_id = @markingGuideId
            AND mg.assessment_id = s.assessment_id
        INNER JOIN file_storage fs2 ON mg.file_id = fs2.file_id
        WHERE s.assessment_id = @assessmentId
          AND fs.storage_category = 'STUDENT_SUBMISSION'
          ${inFilter}
    `);

    return result.recordset;
};

exports.getByStudent = async (studentId) => {
    await poolConnect;

    const result = await pool.request()
        .input('studentId', sql.BigInt, studentId)
        .query(`
            SELECT
                fm.submission_id,
                fm.total_marks_awarded,
                fm.published_at,
                (SELECT COUNT(*) FROM mark_concern mc WHERE mc.submission_id = fm.submission_id) AS concern_count,
                a.assessment_title AS assignment_name,
                a.total_marks AS total,
                sub.subject_name,
                sub.subject_code,
                so.academic_year,
                s.attempt_no,
                s.submitted_at,
                s.submission_status,
                f.original_file_name,
                f.storage_path
            FROM final_mark fm
            INNER JOIN submission s ON fm.submission_id = s.submission_id
            INNER JOIN assessment a ON s.assessment_id = a.assessment_id
            INNER JOIN subject_offering so ON a.offering_id = so.offering_id
            INNER JOIN subject sub ON so.subject_id = sub.subject_id
            INNER JOIN file_storage f ON s.file_id = f.file_id
            WHERE s.student_id = @studentId
              AND fm.marking_status = 'PUBLISHED'
            ORDER BY fm.published_at DESC
        `);

    return result.recordset.map(row => ({
        ...row,
        concern_window_open: !!(
            row.published_at &&
            Number(row.concern_count || 0) === 0 &&
            Date.now() - new Date(row.published_at).getTime() <= 48 * 60 * 60 * 1000
        ),
    }));
};

exports.getAllStudentSubmissions = async () => {
    await poolConnect;

    const result = await pool.request().query(`
        SELECT 
            s.submission_id,
            s.student_id,
            s.assessment_id,
            s.attempt_no,
            s.submitted_at,
            s.submission_status,
            f.original_file_name,
            f.storage_path,
            a.assessment_title AS assignment_name,
            so.academic_year,
            sub.subject_name,
            sub.subject_code,
            f.upload_user_id
        FROM submission s
        INNER JOIN file_storage f ON s.file_id = f.file_id
        INNER JOIN assessment a ON s.assessment_id = a.assessment_id
        INNER JOIN subject_offering so ON a.offering_id = so.offering_id
        INNER JOIN subject sub ON so.subject_id = sub.subject_id
        WHERE f.storage_category = 'STUDENT_SUBMISSION'
        ORDER BY s.submitted_at DESC
    `);

    return result.recordset;
};

exports.getAIMetadata = async (submissionId) => {
    await poolConnect;

    const analysisResult = await pool.request()
        .input('submission_id', sql.BigInt, submissionId)
        .query(`
            SELECT
                ar.*,
                f.original_file_name AS student_file_name,
                f.storage_path AS student_file_path,
                fg.original_file_name AS guide_file_name,
                fg.storage_path AS guide_file_path
            FROM analysis_result ar
            INNER JOIN submission s ON ar.submission_id = s.submission_id
            INNER JOIN file_storage f ON s.file_id = f.file_id
            LEFT JOIN marking_guide mg ON ar.marking_guide_id = mg.marking_guide_id
            LEFT JOIN file_storage fg ON mg.file_id = fg.file_id
            WHERE ar.submission_id = @submission_id
            ORDER BY ar.analysis_result_id DESC
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
        `);

    if (analysisResult.recordset.length === 0) {
        return null;
    }

    const analysis = analysisResult.recordset[0];

    const questionScores = await pool.request()
        .input('analysis_result_id', sql.BigInt, analysis.analysis_result_id)
        .query(`
            SELECT *
            FROM ai_question_score
            WHERE analysis_result_id = @analysis_result_id
        `);

    const rubricScores = await pool.request()
        .input('analysis_result_id', sql.BigInt, analysis.analysis_result_id)
        .query(`
            SELECT *
            FROM ai_rubric_score
            WHERE analysis_result_id = @analysis_result_id
        `);

    return {
        ...analysis,
        question_scores: questionScores.recordset,
        rubric_scores: rubricScores.recordset
    };
};

exports.softDelete = async (submissionId) => {
    await poolConnect;

    const submissionResult = await pool.request()
        .input('submissionId', sql.BigInt, submissionId)
        .query(`
            SELECT file_id
            FROM submission
            WHERE submission_id = @submissionId
        `);

    if (submissionResult.recordset.length === 0) {
        throw new Error('Submission not found');
    }

    const fileId = submissionResult.recordset[0].file_id;

    await pool.request()
        .input('submissionId', sql.BigInt, submissionId)
        .input('fileId', sql.BigInt, fileId)
        .query(`
            UPDATE submission
            SET submission_status = 'DELETED', updated_at = GETDATE()
            WHERE submission_id = @submissionId;

            UPDATE file_storage
            SET is_deleted = 1
            WHERE file_id = @fileId;
        `);

    return true;
};
