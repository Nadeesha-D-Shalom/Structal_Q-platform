const { pool, poolConnect, sql } = require('../../config/db');
const crypto = require('crypto');
const fs = require('fs');

exports.upload = async (req) => {

    if (!req.file) throw new Error("File required");

    const { assessment_id, student_id } = req.body;

    await poolConnect;

    // 🔹 Validate file type
    if (req.file.mimetype !== 'application/pdf')
        throw new Error("Only PDF allowed");

    // 🔹 Generate SHA-256 hash
    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 🔹 Prevent duplicate submission (same file hash)
    const duplicateCheck = await pool.request()
        .input('hash', sql.VarChar, hash)
        .query("SELECT * FROM file_storage WHERE sha256_hash = @hash");

    if (duplicateCheck.recordset.length > 0)
        throw new Error("Duplicate file detected");

    // 🔹 Get assessment details (deadline + type)
    const assessment = await pool.request()
        .input('assessment_id', sql.Int, assessment_id)
        .query("SELECT * FROM assessment WHERE assessment_id = @assessment_id");

    if (assessment.recordset.length === 0)
        throw new Error("Assessment not found");

    const assess = assessment.recordset[0];

    const now = new Date();
    const dueDate = new Date(assess.due_date);

    let isLate = 0;
    let lateMinutes = 0;

    if (now > dueDate) {
        lateMinutes = Math.floor((now - dueDate) / 60000);
        if (assess.late_policy_enabled === true)
            isLate = 1;
        else
            throw new Error("Late submission not allowed");
    }

    // 🔹 Determine attempt number
    const attemptQuery = await pool.request()
        .input('assessment_id', sql.Int, assessment_id)
        .input('student_id', sql.Int, student_id)
        .query(`
            SELECT MAX(attempt_no) as maxAttempt
            FROM submission
            WHERE assessment_id = @assessment_id
            AND student_id = @student_id
        `);

    const attemptNo = attemptQuery.recordset[0].maxAttempt
        ? attemptQuery.recordset[0].maxAttempt + 1
        : 1;

    // 🔹 Insert file_storage
    const fileInsert = await pool.request()
        .input('original_file_name', sql.VarChar, req.file.originalname)
        .input('stored_file_name', sql.VarChar, req.file.filename)
        .input('storage_category', sql.VarChar, assess.assessment_type)
        .input('storage_path', sql.VarChar, req.file.path)
        .input('mime_type', sql.VarChar, req.file.mimetype)
        .input('file_size_bytes', sql.BigInt, req.file.size)
        .input('sha256_hash', sql.VarChar, hash)
        .input('upload_user_id', sql.Int, student_id)
        .query(`
            INSERT INTO file_storage
            (original_file_name, stored_file_name, storage_category,
             storage_path, mime_type, file_size_bytes,
             sha256_hash, upload_user_id)
            OUTPUT INSERTED.file_id
            VALUES
            (@original_file_name, @stored_file_name, @storage_category,
             @storage_path, @mime_type, @file_size_bytes,
             @sha256_hash, @upload_user_id)
        `);

    const file_id = fileInsert.recordset[0].file_id;

    // 🔹 Insert submission
    await pool.request()
        .input('assessment_id', sql.Int, assessment_id)
        .input('student_id', sql.Int, student_id)
        .input('attempt_no', sql.Int, attemptNo)
        .input('is_late', sql.Bit, isLate)
        .input('late_minutes', sql.Int, lateMinutes)
        .input('file_id', sql.Int, file_id)
        .input('integrity_hash', sql.VarChar, hash)
        .query(`
            INSERT INTO submission
            (assessment_id, student_id, attempt_no,
             is_late, late_minutes,
             file_id, integrity_hash)
            VALUES
            (@assessment_id, @student_id, @attempt_no,
             @is_late, @late_minutes,
             @file_id, @integrity_hash)
        `);

    return {
        message: "Submission successful",
        attemptNo,
        isLate,
        lateMinutes
    };
};

exports.getByStudent = async (student_id) => {
    await poolConnect;

    const result = await pool.request()
        .input('student_id', sql.Int, student_id)
        .query(`
            SELECT * FROM submission
            WHERE student_id = @student_id
            AND submission_status <> 'FINALIZED'
        `);

    return result.recordset;
};

exports.getAIMetadata = async (submission_id) => {
    await poolConnect;

    const result = await pool.request()
        .input('submission_id', sql.Int, submission_id)
        .query(`
            SELECT s.submission_id,
                   s.student_id,
                   s.attempt_no,
                   f.storage_path,
                   s.assessment_id
            FROM submission s
            JOIN file_storage f
            ON s.file_id = f.file_id
            WHERE s.submission_id = @submission_id
        `);

    return result.recordset[0];
};

exports.softDelete = async (submission_id) => {
    await poolConnect;

    await pool.request()
        .input('submission_id', sql.Int, submission_id)
        .query(`
            UPDATE file_storage
            SET is_deleted = 1
            WHERE file_id =
                (SELECT file_id FROM submission
                 WHERE submission_id = @submission_id)
        `);
};