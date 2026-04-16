const { sql, pool, poolConnect } = require('../../config/db');
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");

function parseDiagramTypes(raw) {
    if (raw == null) return null;
    if (Array.isArray(raw)) return JSON.stringify(raw);
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        try {
            const parsed = JSON.parse(trimmed);
            return JSON.stringify(Array.isArray(parsed) ? parsed : [trimmed]);
        } catch {
            return JSON.stringify(
                trimmed.split(",").map((x) => x.trim()).filter(Boolean)
            );
        }
    }
    return null;
}

async function insertGuideFile(req, uploadUserId) {
    const file = req.file;
    if (!file) throw new Error("Guide file is required");

    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error("Only PDF and DOCX files are allowed");
    }

    const fullPath = path.resolve(file.path);

    const inserted = await pool.request()
        .input('original_file_name', sql.VarChar, file.originalname)
        .input('stored_file_name', sql.VarChar, file.filename)
        .input('storage_category', sql.VarChar, "MARKING_GUIDE")
        .input('storage_path', sql.VarChar, fullPath)
        .input('mime_type', sql.VarChar, file.mimetype)
        .input('file_size_bytes', sql.BigInt, file.size)
        .input('sha256_hash', sql.VarChar, null)
        .input('upload_user_id', sql.Int, uploadUserId)
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

    return inserted.recordset[0].file_id;
}

async function getNextVersionNo(assessmentId, title) {
    const result = await pool.request()
        .input("assessment_id", sql.BigInt, assessmentId)
        .input("title", sql.NVarChar(255), title)
        .query(`
            SELECT ISNULL(MAX(version_no), 0) AS max_version
            FROM marking_guide
            WHERE assessment_id = @assessment_id
              AND title = @title
        `);

    return (result.recordset[0]?.max_version || 0) + 1;
}

function mapGuide(record) {
    let diagramTypes = [];
    if (record.diagram_types_expected) {
        try {
            diagramTypes = JSON.parse(record.diagram_types_expected);
        } catch {
            diagramTypes = [];
        }
    }

    return {
        guide_id: record.marking_guide_id,
        marking_guide_id: record.marking_guide_id,
        guide_name: record.title,
        title: record.title,
        version_no: record.version_no,
        description: record.description,
        assessment_id: record.assessment_id,
        assessment_title: record.assessment_title,
        subject_id: record.subject_id,
        subject_name: record.subject_name,
        file_id: record.file_id,
        guide_file_path: record.guide_file_path,
        original_file_name: record.original_file_name,
        mime_type: record.mime_type,
        order_sensitive: !!record.order_sensitive,
        requires_diagram_check: !!record.requires_diagram_check,
        diagram_types_expected: diagramTypes,
        status: record.status,
        created_at: record.created_at,
        updated_at: record.updated_at,
        created_by: record.created_by,
    };
}

async function fetchGuideById(id) {
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
            SELECT
                mg.*,
                fs.original_file_name,
                fs.storage_path AS guide_file_path,
                fs.mime_type,
                a.assessment_title,
                so.subject_id,
                s.subject_name
            FROM marking_guide mg
            LEFT JOIN file_storage fs ON mg.file_id = fs.file_id
            LEFT JOIN assessment a ON mg.assessment_id = a.assessment_id
            LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
            LEFT JOIN subject s ON so.subject_id = s.subject_id
            WHERE mg.marking_guide_id = @id
        `);
    return result.recordset[0] || null;
}

/* =========================
   CREATE MARKING GUIDE RECORD ONLY */
exports.createGuide = async (req, res) => {
    const {
        assessment_id,
        version_no,
        title,
        description,
        order_sensitive,
        requires_diagram_check,
        diagram_types_expected,
        file_id
    } = req.body;

    if (!assessment_id || !title || !file_id) {
        return res.status(400).json({
            success: false,
            message: "assessment_id, title and file_id are required"
        });
    }

    try {
        await poolConnect;

        const createdBy = req.user?.user_id || req.body.created_by || 1;
        const finalVersionNo = version_no || await getNextVersionNo(assessment_id, title);

        const inserted = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('version_no', sql.Int, finalVersionNo)
            .input('title', sql.NVarChar(255), title)
            .input('description', sql.NVarChar(sql.MAX), description || null)
            .input('order_sensitive', sql.Bit, order_sensitive ? 1 : 0)
            .input('requires_diagram_check', sql.Bit, requires_diagram_check ? 1 : 0)
            .input('diagram_types_expected', sql.NVarChar(sql.MAX), parseDiagramTypes(diagram_types_expected))
            .input('created_by', sql.Int, createdBy)
            .input('file_id', sql.BigInt, file_id)
            .query(`
                INSERT INTO marking_guide (
                    assessment_id,
                    version_no,
                    title,
                    description,
                    order_sensitive,
                    requires_diagram_check,
                    diagram_types_expected,
                    created_by,
                    file_id,
                    created_at,
                    updated_at,
                    status
                )
                OUTPUT INSERTED.marking_guide_id
                VALUES (
                    @assessment_id,
                    @version_no,
                    @title,
                    @description,
                    @order_sensitive,
                    @requires_diagram_check,
                    @diagram_types_expected,
                    @created_by,
                    @file_id,
                    GETDATE(),
                    GETDATE(),
                    'ACTIVE'
                )
            `);

        const guideId = inserted.recordset[0].marking_guide_id;
        const guide = await fetchGuideById(guideId);

        res.status(201).json({
            success: true,
            message: "Marking guide created successfully",
            data: mapGuide(guide)
        });

    } catch (err) {
        console.error("Create Guide Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/* =========================
   UPLOAD NEW GUIDE / NEW VERSION */
exports.uploadGuide = async (req, res) => {
    try {
        await poolConnect;

        const {
            assessment_id,
            title,
            description,
            version_no,
            order_sensitive,
            requires_diagram_check,
            diagram_types_expected
        } = req.body;

        if (!assessment_id || !title) {
            return res.status(400).json({
                success: false,
                message: "assessment_id and title are required"
            });
        }

        const createdBy = req.user?.user_id || 1;
        const fileId = await insertGuideFile(req, createdBy);
        const finalVersionNo = version_no || await getNextVersionNo(assessment_id, title);

        const inserted = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('version_no', sql.Int, finalVersionNo)
            .input('title', sql.NVarChar(255), title)
            .input('description', sql.NVarChar(sql.MAX), description || null)
            .input('order_sensitive', sql.Bit, order_sensitive === "true" || order_sensitive === true ? 1 : 0)
            .input('requires_diagram_check', sql.Bit, requires_diagram_check === "true" || requires_diagram_check === true ? 1 : 0)
            .input('diagram_types_expected', sql.NVarChar(sql.MAX), parseDiagramTypes(diagram_types_expected))
            .input('created_by', sql.Int, createdBy)
            .input('file_id', sql.BigInt, fileId)
            .query(`
                INSERT INTO marking_guide (
                    assessment_id,
                    version_no,
                    title,
                    description,
                    order_sensitive,
                    requires_diagram_check,
                    diagram_types_expected,
                    created_by,
                    file_id,
                    created_at,
                    updated_at,
                    status
                )
                OUTPUT INSERTED.marking_guide_id
                VALUES (
                    @assessment_id,
                    @version_no,
                    @title,
                    @description,
                    @order_sensitive,
                    @requires_diagram_check,
                    @diagram_types_expected,
                    @created_by,
                    @file_id,
                    GETDATE(),
                    GETDATE(),
                    'ACTIVE'
                )
            `);

        const guideId = inserted.recordset[0].marking_guide_id;
        const guide = await fetchGuideById(guideId);

        res.status(201).json({
            success: true,
            message: "Marking guide uploaded successfully",
            data: mapGuide(guide)
        });
    } catch (err) {
        console.error("Upload Guide Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/* =========================
   GET ALL GUIDES */
exports.getGuides = async (req, res) => {
    try {
        await poolConnect;

        const result = await pool.request().query(`
            SELECT 
                mg.*,
                fs.original_file_name,
                fs.storage_path AS guide_file_path,
                fs.mime_type,
                a.assessment_title,
                so.subject_id,
                s.subject_name
            FROM marking_guide mg
            LEFT JOIN file_storage fs ON mg.file_id = fs.file_id
            LEFT JOIN assessment a ON mg.assessment_id = a.assessment_id
            LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
            LEFT JOIN subject s ON so.subject_id = s.subject_id
            WHERE ISNULL(mg.status, 'ACTIVE') = 'ACTIVE'
            ORDER BY mg.created_at DESC, mg.version_no DESC
        `);

        res.json({
            success: true,
            data: result.recordset.map(mapGuide)
        });

    } catch (err) {
        console.error("Guide Fetch Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/* =========================
   GET GUIDE BY ID */
exports.getGuideById = async (req, res) => {
    try {
        await poolConnect;
        const guide = await fetchGuideById(req.params.id);

        if (!guide) {
            return res.status(404).json({
                success: false,
                message: "Marking guide not found"
            });
        }

        res.json({
            success: true,
            data: mapGuide(guide)
        });

    } catch (err) {
        console.error("Get Guide Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/* =========================
   UPDATE GUIDE METADATA */
exports.updateGuide = async (req, res) => {
    const {
        title,
        description,
        order_sensitive,
        requires_diagram_check,
        diagram_types_expected,
        file_id,
        version_no
    } = req.body;

    try {
        await poolConnect;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('title', sql.NVarChar(255), title || null)
            .input('description', sql.NVarChar(sql.MAX), description || null)
            .input('order_sensitive', sql.Bit, order_sensitive === undefined ? null : (order_sensitive ? 1 : 0))
            .input('requires_diagram_check', sql.Bit, requires_diagram_check === undefined ? null : (requires_diagram_check ? 1 : 0))
            .input('diagram_types_expected', sql.NVarChar(sql.MAX), parseDiagramTypes(diagram_types_expected))
            .input('file_id', sql.BigInt, file_id || null)
            .input('version_no', sql.Int, version_no || null)
            .query(`
                UPDATE marking_guide
                SET title = COALESCE(@title, title),
                    description = COALESCE(@description, description),
                    order_sensitive = COALESCE(@order_sensitive, order_sensitive),
                    requires_diagram_check = COALESCE(@requires_diagram_check, requires_diagram_check),
                    diagram_types_expected = COALESCE(@diagram_types_expected, diagram_types_expected),
                    file_id = COALESCE(@file_id, file_id),
                    version_no = COALESCE(@version_no, version_no),
                    updated_at = GETDATE()
                WHERE marking_guide_id = @id
            `);

        const guide = await fetchGuideById(req.params.id);

        res.json({
            success: true,
            message: "Marking guide updated successfully",
            data: guide ? mapGuide(guide) : null
        });

    } catch (err) {
        console.error("Update Guide Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/* =========================
   DELETE GUIDE (SOFT) */
exports.deleteGuide = async (req, res) => {
    try {
        await poolConnect;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE marking_guide
                SET status = 'INACTIVE',
                    updated_at = GETDATE()
                WHERE marking_guide_id = @id
            `);

        res.json({
            success: true,
            message: "Marking guide deactivated successfully"
        });

    } catch (err) {
        console.error("Delete Guide Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/* =========================
   GUIDE FILE PREVIEW */
exports.previewGuideFile = async (req, res) => {
    try {
        await poolConnect;

        const result = await pool.request()
            .input("fileId", sql.BigInt, req.params.fileId)
            .query(`
                SELECT storage_path, mime_type, original_file_name
                FROM file_storage
                WHERE file_id = @fileId
                  AND ISNULL(is_deleted, 0) = 0
            `);

        if (!result.recordset.length) {
            return res.status(404).send("Guide file not found");
        }

        const file = result.recordset[0];
        const filePath = path.resolve(file.storage_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send("Guide file missing on disk");
        }

        const type = mime.lookup(file.original_file_name || filePath) || file.mime_type || "application/octet-stream";
        res.setHeader("Content-Type", type);
        res.setHeader("Content-Disposition", "inline");
        return res.sendFile(filePath);
    } catch (err) {
        console.error("Guide Preview Error:", err);
        res.status(500).send("Guide preview failed");
    }
};
