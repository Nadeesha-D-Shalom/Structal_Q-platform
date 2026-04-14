const { pool, poolConnect, sql } = require('../../config/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require("path");


// =====================================================
// UPLOAD SUBMISSION
// =====================================================
exports.upload = async (req) => {
    try {
        await poolConnect;

        if (!req.file) throw new Error("File required");

        const { assessment_id, student_id } = req.body;

        if (!assessment_id || !student_id) {
            throw new Error("assessment_id and student_id are required");
        }

        // ================= IGNORE TEMP FILES =================
        if (req.file.originalname.startsWith("~$")) {
            throw new Error("Temporary files are not allowed");
        }

        // ================= FILE VALIDATION =================
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!allowedTypes.includes(req.file.mimetype)) {
            throw new Error("Only PDF and DOCX files are allowed");
        }

        // ================= HASH =================
        const fileBuffer = fs.readFileSync(req.file.path);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // ================= DUPLICATE CHECK =================
        const duplicate = await pool.request()
            .input('hash', sql.VarChar, hash)
            .query(`SELECT file_id FROM file_storage WHERE sha256_hash = @hash`);

        if (duplicate.recordset.length > 0) {
            throw new Error("Duplicate file detected");
        }

        // ================= ASSESSMENT =================
        const assessmentRes = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`SELECT * FROM assessment WHERE assessment_id = @assessment_id`);

        if (!assessmentRes.recordset.length) {
            throw new Error("Assessment not found");
        }

        const assess = assessmentRes.recordset[0];

        // ================= LATE CHECK =================
        const now = new Date();
        const dueDate = new Date(assess.due_date);

        let isLate = 0;
        let lateMinutes = 0;

        if (now > dueDate) {
            lateMinutes = Math.floor((now - dueDate) / 60000);

            if (assess.late_policy_enabled) {
                isLate = 1;
            } else {
                throw new Error("Late submission not allowed");
            }
        }

        // ================= ATTEMPT =================
        const attemptRes = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('student_id', sql.Int, student_id)
            .query(`
                SELECT MAX(attempt_no) AS maxAttempt
                FROM submission
                WHERE assessment_id = @assessment_id
                AND student_id = @student_id
            `);

        const attemptNo = attemptRes.recordset[0].maxAttempt
            ? attemptRes.recordset[0].maxAttempt + 1
            : 1;

        // ================= PATH =================
        const fullPath = path.resolve(req.file.path);

        // ================= INSERT FILE =================
        const fileInsert = await pool.request()
            .input('original_file_name', sql.VarChar, req.file.originalname)
            .input('stored_file_name', sql.VarChar, req.file.filename)
            .input('storage_category', sql.VarChar, "STUDENT_SUBMISSION") // ✅ FIXED
            .input('storage_path', sql.VarChar, fullPath)
            .input('mime_type', sql.VarChar, req.file.mimetype)
            .input('file_size_bytes', sql.BigInt, req.file.size)
            .input('sha256_hash', sql.VarChar, hash)
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
            .input('integrity_hash', sql.VarChar, hash)
            .query(`
                INSERT INTO submission (
                    assessment_id,
                    student_id,
                    attempt_no,
                    is_late,
                    late_minutes,
                    file_id,
                    integrity_hash
                )
                VALUES (
                    @assessment_id,
                    @student_id,
                    @attempt_no,
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

    ISNULL(ar.similarity_avg, 0) AS similarity_avg,
    ISNULL(ar.risk_score, 0) AS risk_score

FROM submission s

INNER JOIN file_storage f 
    ON s.file_id = f.file_id

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
