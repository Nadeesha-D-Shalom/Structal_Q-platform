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

router.get('/student/:id', controller.getStudentSubmissions);

router.get('/lecturer/student-only', controller.getAllStudentSubmissions);

router.get('/lecturer/all', controller.getAllSubmissionsForLecturer);

router.get('/:id/ai-metadata', controller.getAIMetadata);

router.get('/:id', controller.getSubmissionById);

router.delete('/:id', controller.softDeleteSubmission);


/* FILE PREVIEW */
router.get("/file/:fileId", async (req, res) => {
    try {
        const { fileId } = req.params;

        const result = await pool.request()
            .input("fileId", sql.Int, fileId)
            .query(`
                SELECT storage_path, mime_type, original_file_name
                FROM file_storage
                WHERE file_id = @fileId AND is_deleted = 0
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send("File not found");
        }

        const file = result.recordset[0];
        const filePath = path.resolve(file.storage_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File missing on disk");
        }

        /* =========================
           CONTENT TYPE FIX
        ========================= */
        const ext = path.extname(file.original_file_name).toLowerCase();

        if (ext === ".pdf") {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "inline");
        }
        else if (ext === ".docx") {
            // DOCX cannot render in browser → prevent download force
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            res.setHeader("Content-Disposition", "inline");
        }
        else {
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Disposition", "inline");
        }

        return res.sendFile(filePath);

    } catch (err) {
        console.error("FILE PREVIEW ERROR:", err);
        res.status(500).send("Preview failed");
    }
});

module.exports = router;