const service = require('./submission.service');
const { pool, poolConnect, sql } = require('../../config/db');

/* UPLOAD */
exports.uploadSubmission = async (req, res) => {
    try {
        const result = await service.upload(req);
        res.json(result);
    } catch (err) {
        console.error("UPLOAD ERROR:", err);
        const status = Number(err.statusCode) || 500;
        res.status(status).json({ success: false, error: err.message });
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

/* Current user (JWT) — full submission history */
exports.getMySubmissions = async (req, res) => {
    try {
        const uid = req.user?.user_id;
        if (!uid) {
            return res.status(401).json({ success: false, error: "Not authenticated" });
        }
        const data = await service.getOwnSubmissionHistory(uid);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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

        if (!data) {
            return res.status(404).json({ success: false, error: "AI metadata not found" });
        }

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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

exports.editOwnSubmission = async (req, res) => {
    try {
        const uid = req.user?.user_id;
        if (!uid) return res.status(401).json({ success: false, error: "Not authenticated" });
        const result = await service.editOwnSubmission({
            submissionId: req.params.id,
            userId: uid,
            file: req.file,
        });
        res.json(result);
    } catch (err) {
        const status = Number(err.statusCode) || 500;
        res.status(status).json({ success: false, error: err.message });
    }
};

exports.resubmitOwnSubmission = async (req, res) => {
    try {
        const uid = req.user?.user_id;
        if (!uid) return res.status(401).json({ success: false, error: "Not authenticated" });
        const result = await service.resubmitOwnSubmission({
            submissionId: req.params.id,
            userId: uid,
            file: req.file,
        });
        res.json(result);
    } catch (err) {
        const status = Number(err.statusCode) || 500;
        res.status(status).json({ success: false, error: err.message });
    }
};

exports.deleteOwnSubmission = async (req, res) => {
    try {
        const uid = req.user?.user_id;
        if (!uid) return res.status(401).json({ success: false, error: "Not authenticated" });
        const result = await service.deleteOwnSubmission({
            submissionId: req.params.id,
            userId: uid,
        });
        res.json(result);
    } catch (err) {
        const status = Number(err.statusCode) || 500;
        res.status(status).json({ success: false, error: err.message });
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
                    s.file_id,
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