const sql = require('mssql');

//CREATE MARKING GUIDE

exports.createGuide = async (req, res) => {
    const {
        assessment_id,
        version_no,
        title,
        description,
        order_sensitive,
        requires_diagram_check,
        diagram_types_expected,
        created_by
    } = req.body;

    if (!assessment_id || !title) {
        return res.status(400).json({
            message: "assessment_id and title are required"
        });
    }

    try {
        const pool = await sql.connect();

        await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('version_no', sql.Int, version_no || 1)
            .input('title', sql.VarChar(150), title)
            .input('description', sql.VarChar(sql.MAX), description)
            .input('order_sensitive', sql.Bit, order_sensitive)
            .input('requires_diagram_check', sql.Bit, requires_diagram_check)
            .input('diagram_types_expected', sql.VarChar(200), diagram_types_expected)
            .input('created_by', sql.Int, created_by)
            .query(`
                INSERT INTO marking_guide (
                    assessment_id,
                    version_no,
                    title,
                    description,
                    order_sensitive,
                    requires_diagram_check,
                    diagram_types_expected,
                    created_by
                )
                VALUES (
                    @assessment_id,
                    @version_no,
                    @title,
                    @description,
                    @order_sensitive,
                    @requires_diagram_check,
                    @diagram_types_expected,
                    @created_by
                )
            `);

        res.status(201).json({
            message: "Marking guide created successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


//GET ALL GUIDES (JOINED)

exports.getGuides = async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request()
            .query(`
                SELECT mg.*, a.assessment_title, s.subject_name
                FROM marking_guide mg
                JOIN assessment a ON mg.assessment_id = a.assessment_id
                JOIN subject s ON a.subject_id = s.subject_id
                WHERE mg.status = 'ACTIVE'
                ORDER BY mg.created_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


//GET GUIDE BY ID

exports.getGuideById = async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT * 
                FROM marking_guide
                WHERE marking_guide_id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Marking guide not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


//UPDATE MARKING GUIDE

exports.updateGuide = async (req, res) => {
    const {
        title,
        description,
        order_sensitive,
        requires_diagram_check,
        diagram_types_expected
    } = req.body;

    try {
        const pool = await sql.connect();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('title', sql.VarChar(150), title)
            .input('description', sql.VarChar(sql.MAX), description)
            .input('order_sensitive', sql.Bit, order_sensitive)
            .input('requires_diagram_check', sql.Bit, requires_diagram_check)
            .input('diagram_types_expected', sql.VarChar(200), diagram_types_expected)
            .query(`
                UPDATE marking_guide
                SET title = @title,
                    description = @description,
                    order_sensitive = @order_sensitive,
                    requires_diagram_check = @requires_diagram_check,
                    diagram_types_expected = @diagram_types_expected,
                    updated_at = GETDATE()
                WHERE marking_guide_id = @id
            `);

        res.json({
            message: "Marking guide updated successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


//SOFT DELETE

exports.deleteGuide = async (req, res) => {
    try {
        const pool = await sql.connect();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE marking_guide
                SET status = 'INACTIVE',
                    updated_at = GETDATE()
                WHERE marking_guide_id = @id
            `);

        res.json({
            message: "Marking guide deactivated successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};