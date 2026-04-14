const service = require('./submission.service');
const { pool, poolConnect, sql } = require('../../config/db');

/* UPLOAD */
exports.uploadSubmission = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.file;

        const storagePath = require("path").resolve(file.path);

        const fs = require("fs");
        const crypto = require("crypto");

        // ===== READ FILE =====
        const buffer = fs.readFileSync(file.path);

        // ===== HASH (keep for integrity + ML) =====
        const hash = crypto.createHash("sha256").update(buffer).digest("hex");

        // ===== INSERT FILE (FULL DETAILS) =====
        const fileResult = await pool.request()
            .input("original_file_name", sql.VarChar, file.originalname)
            .input("stored_file_name", sql.VarChar, file.filename)
            .input("storage_category", sql.VarChar, "STUDENT_SUBMISSION")
            .input("storage_path", sql.VarChar, storagePath)
            .input("mime_type", sql.VarChar, file.mimetype)
            .input("file_size_bytes", sql.BigInt, file.size)
            .input("sha256_hash", sql.VarChar, hash)
            .input("upload_user_id", sql.Int, req.body.student_id)
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

        const file_id = fileResult.recordset[0].file_id;

        // ===== INSERT SUBMISSION =====
        const submissionResult = await pool.request()
            .input("assessment_id", sql.Int, req.body.assessment_id)
            .input("student_id", sql.Int, req.body.student_id)
            .input("file_id", sql.Int, file_id)
            .input("hash", sql.VarChar, hash)
            .query(`
                INSERT INTO submission (
                    assessment_id,
                    student_id,
                    file_id,
                    integrity_hash,
                    submitted_at,
                    submission_status
                )
                OUTPUT INSERTED.submission_id
                VALUES (
                    @assessment_id,
                    @student_id,
                    @file_id,
                    @hash,
                    GETDATE(),
                    'SUBMITTED'
                )
            `);

        res.json({
            success: true,
            submission_id: submissionResult.recordset[0].submission_id,
            file_id,
            file_path: storagePath
        });

    } catch (err) {
        console.error("UPLOAD ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

/* GET STUDENT */
exports.getStudentSubmissions = async (req, res) => {
    try {
        const data = await service.getByStudent(req.params.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* GET ALL STUDENT SUBMISSIONS */
exports.getAllStudentSubmissions = async (req, res) => {
    try {
        const data = await service.getAllStudentSubmissions();
        res.json(data);
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/* LECTURER VIEW */
exports.getAllSubmissionsForLecturer = async (req, res) => {
    try {
        const data = await service.getAllSubmissionsForLecturer();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* AI METADATA */
exports.getAIMetadata = async (req, res) => {
    try {
        const data = await service.getAIMetadata(req.params.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* DELETE */
exports.softDeleteSubmission = async (req, res) => {
    try {
        await service.softDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* GET BY ID (FIXED) */
exports.getSubmissionById = async (req, res) => {
    try {
        await poolConnect;

        const submissionId = parseInt(req.params.id);

        if (isNaN(submissionId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid submission ID"
            });
        }

        const result = await pool.request()
            .input('id', sql.Int, submissionId)
            .query(`
                SELECT 
                    s.submission_id,
                    s.attempt_no,
                    fs.original_file_name,
                    fs.storage_path
                FROM submission s
                JOIN file_storage fs 
                    ON s.file_id = fs.file_id
                WHERE s.submission_id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (err) {
        console.error("Get submission error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};