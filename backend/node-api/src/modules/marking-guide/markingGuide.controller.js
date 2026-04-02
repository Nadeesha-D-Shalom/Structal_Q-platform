const { sql, pool, poolConnect } = require('../../config/db');

/* =========================
   CREATE MARKING GUIDE
exports.createGuide = async (req, res) => {
    const {
        assessment_id,
        version_no,
        title,
        description,
        order_sensitive,
        requires_diagram_check,
        diagram_types_expected,
        created_by,
        file_id   // REQUIRED
    } = req.body;

    if (!assessment_id || !title || !file_id) {
        return res.status(400).json({
            success: false,
            message: "assessment_id, title and file_id are required"
        });
    }

    try {
        await poolConnect;

        await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('version_no', sql.Int, version_no || 1)
            .input('title', sql.VarChar(150), title)
            .input('description', sql.VarChar(sql.MAX), description)
            .input('order_sensitive', sql.Bit, order_sensitive)
            .input('requires_diagram_check', sql.Bit, requires_diagram_check)
            .input('diagram_types_expected', sql.VarChar(200), diagram_types_expected)
            .input('created_by', sql.Int, created_by)
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
                    file_id
                )
                VALUES (
                    @assessment_id,
                    @version_no,
                    @title,
                    @description,
                    @order_sensitive,
                    @requires_diagram_check,
                    @diagram_types_expected,
                    @created_by,
                    @file_id
                )
            `);

        res.status(201).json({
            success: true,
            message: "Marking guide created successfully"
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
   GET ALL GUIDES (FIXED)
exports.getGuides = async (req, res) => {
    try {
        await poolConnect;

        const result = await pool.request().query(`
            SELECT 
                mg.marking_guide_id AS guide_id,
                mg.title AS guide_name,
                fs.storage_path AS guide_file_path,
                a.assessment_title,
                s.subject_name
            FROM marking_guide mg
            LEFT JOIN file_storage fs 
                ON mg.file_id = fs.file_id
            JOIN assessment a 
                ON mg.assessment_id = a.assessment_id
            JOIN subject_offering so 
                ON a.offering_id = so.offering_id
            JOIN subject s 
                ON so.subject_id = s.subject_id
            WHERE mg.status = 'ACTIVE'
            ORDER BY mg.created_at DESC
        `);

        res.json({
            success: true,
            data: result.recordset
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
   GET GUIDE BY ID
exports.getGuideById = async (req, res) => {
    try {
        await poolConnect;

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT 
                    mg.*,
                    fs.storage_path AS guide_file_path
                FROM marking_guide mg
                LEFT JOIN file_storage fs 
                    ON mg.file_id = fs.file_id
                WHERE mg.marking_guide_id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Marking guide not found"
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
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
   UPDATE GUIDE
exports.updateGuide = async (req, res) => {
    const {
        title,
        description,
        order_sensitive,
        requires_diagram_check,
        diagram_types_expected,
        file_id   // OPTIONAL UPDATE
    } = req.body;

    try {
        await poolConnect;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('title', sql.VarChar(150), title)
            .input('description', sql.VarChar(sql.MAX), description)
            .input('order_sensitive', sql.Bit, order_sensitive)
            .input('requires_diagram_check', sql.Bit, requires_diagram_check)
            .input('diagram_types_expected', sql.VarChar(200), diagram_types_expected)
            .input('file_id', sql.BigInt, file_id)
            .query(`
                UPDATE marking_guide
                SET title = @title,
                    description = @description,
                    order_sensitive = @order_sensitive,
                    requires_diagram_check = @requires_diagram_check,
                    diagram_types_expected = @diagram_types_expected,
                    file_id = ISNULL(@file_id, file_id),
                    updated_at = GETDATE()
                WHERE marking_guide_id = @id
            `);

        res.json({
            success: true,
            message: "Marking guide updated successfully"
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
   DELETE GUIDE (SOFT)
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
