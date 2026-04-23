const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./submission.controller');
const path = require("path");
const { pool, sql } = require("../../config/db");
const fs = require("fs");

const uploadDir = "storage/students";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);

        const fileName =
            "submission_" +
            Date.now() +
            "_" +
            Math.round(Math.random() * 1e9) +
            ext;

        cb(null, fileName);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }
});

/* ROUTES */

router.post('/upload', upload.single('file'), controller.uploadSubmission);

router.get('/me', controller.getMySubmissions);
router.put('/me/:id/edit', upload.single('file'), controller.editOwnSubmission);
router.post('/me/:id/resubmit', upload.single('file'), controller.resubmitOwnSubmission);
router.delete('/me/:id', controller.deleteOwnSubmission);

router.get('/student/:id', controller.getStudentSubmissions);

router.get('/lecturer/student-only', controller.getAllStudentSubmissions);

router.get('/lecturer/all', controller.getAllSubmissionsForLecturer);

/* FILE STREAM — must be before /:id so paths like /file/123 are not captured by /:id */
router.get("/file/:fileId", async (req, res) => {
    try {
        const raw = req.params.fileId;
        if (raw == null || !/^\d+$/.test(String(raw).trim())) {
            return res.status(400).send("Invalid file id");
        }
        const idStr = String(raw).trim();
        const fileIdNum = Number(idStr);
        if (!Number.isSafeInteger(fileIdNum) || fileIdNum <= 0) {
            return res.status(400).send("Invalid file id");
        }

        /* NULL is_deleted must count as active: (is_deleted = 0) alone omits those rows in SQL */
        const result = await pool.request()
            .input("fileId", sql.BigInt, fileIdNum)
            .query(`
                SELECT storage_path, mime_type, original_file_name
                FROM file_storage
                WHERE file_id = @fileId
                  AND (ISNULL(CAST(is_deleted AS INT), 0) = 0)
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send("File not found");
        }

        const file = result.recordset[0];
        let filePath = path.resolve(file.storage_path);
        if (!fs.existsSync(filePath)) {
            const alt = path.join(process.cwd(), file.storage_path.replace(/^\//, ""));
            if (fs.existsSync(alt)) filePath = alt;
        }
        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File missing on disk");
        }

        const ext = path.extname(file.original_file_name).toLowerCase();
        const asDownload = String(req.query.download || "") === "1";
        const safeFileName = String(file.original_file_name || "file").replace(/[\r\n"]/g, "_");

        if (ext === ".pdf") {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", asDownload ? `attachment; filename="${safeFileName}"` : "inline");
        }
        else if (ext === ".docx") {
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            res.setHeader("Content-Disposition", asDownload ? `attachment; filename="${safeFileName}"` : "inline");
        }
        else {
            res.setHeader("Content-Type", file.mime_type || "application/octet-stream");
            res.setHeader("Content-Disposition", asDownload ? `attachment; filename="${safeFileName}"` : "inline");
        }

        return res.sendFile(filePath);

    } catch (err) {
        console.error("FILE PREVIEW ERROR:", err);
        res.status(500).send("Preview failed");
    }
});

router.get('/:id/ai-metadata', controller.getAIMetadata);

router.get('/:id', controller.getSubmissionById);

router.delete('/:id', controller.softDeleteSubmission);

module.exports = router;