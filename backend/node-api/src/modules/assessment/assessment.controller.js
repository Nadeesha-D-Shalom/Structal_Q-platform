const { pool, sql } = require("../../config/db");

// ==============================
// CREATE ASSESSMENT
// ==============================
exports.createAssessment = async (req, res) => {
    const {
        offering_id,
        assessment_title,
        assessment_type,
        total_marks,
        start_date,
        due_date,
        allow_resubmission,
        max_resubmissions,
        late_policy_enabled,
        grace_minutes
    } = req.body;

    if (!offering_id || !assessment_title || !assessment_type) {
        return res.status(400).json({
            message: "offering_id, assessment_title, assessment_type are required"
        });
    }

    try {
        await pool.request()
            .input('offering_id', sql.BigInt, offering_id)
            .input('assessment_title', sql.NVarChar(255), assessment_title)
            .input('assessment_type', sql.NVarChar(50), assessment_type)
            .input('total_marks', sql.Decimal(10,2), total_marks)
            .input('start_date', sql.DateTime, start_date)
            .input('due_date', sql.DateTime, due_date)
            .input('allow_resubmission', sql.Bit, allow_resubmission)
            .input('max_resubmissions', sql.Int, max_resubmissions)
            .input('late_policy_enabled', sql.Bit, late_policy_enabled)
            .input('grace_minutes', sql.Int, grace_minutes)
            .query(`
                INSERT INTO assessment (
                    offering_id,
                    assessment_title,
                    assessment_type,
                    total_marks,
                    start_date,
                    due_date,
                    allow_resubmission,
                    max_resubmissions,
                    late_policy_enabled,
                    grace_minutes,
                    created_by,
                    created_at,
                    status
                )
                VALUES (
                    @offering_id,
                    @assessment_title,
                    @assessment_type,
                    @total_marks,
                    @start_date,
                    @due_date,
                    @allow_resubmission,
                    @max_resubmissions,
                    @late_policy_enabled,
                    @grace_minutes,
                    1,
                    GETDATE(),
                    'ACTIVE'
                )
            `);

        res.status(201).json({
            message: "Assessment created successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ==============================
// GET ALL ASSESSMENTS
// ==============================
exports.getAssessments = async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
                SELECT 
                    a.*,
                    so.subject_id,
                    s.subject_name
                FROM assessment a
                JOIN subject_offering so ON a.offering_id = so.offering_id
                JOIN subject s ON so.subject_id = s.subject_id
                WHERE a.status = 'ACTIVE'
                ORDER BY a.created_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ==============================
// GET ASSESSMENT BY ID
// ==============================
exports.getAssessmentById = async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .query(`
                SELECT *
                FROM assessment
                WHERE assessment_id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Assessment not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ==============================
// UPDATE ASSESSMENT
// ==============================
exports.updateAssessment = async (req, res) => {
    const {
        assessment_title,
        total_marks,
        start_date,
        due_date
    } = req.body;

    try {
        await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .input('assessment_title', sql.NVarChar(255), assessment_title)
            .input('total_marks', sql.Decimal(10,2), total_marks)
            .input('start_date', sql.DateTime, start_date)
            .input('due_date', sql.DateTime, due_date)
            .query(`
                UPDATE assessment
                SET 
                    assessment_title = @assessment_title,
                    total_marks = @total_marks,
                    start_date = @start_date,
                    due_date = @due_date,
                    updated_at = GETDATE()
                WHERE assessment_id = @id
            `);

        res.json({
            message: "Assessment updated successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ==============================
// SOFT DELETE (DEACTIVATE)
// ==============================
exports.deleteAssessment = async (req, res) => {
    try {
        await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .query(`
                UPDATE assessment
                SET 
                    status = 'INACTIVE',
                    updated_at = GETDATE()
                WHERE assessment_id = @id
            `);

        res.json({
            message: "Assessment deactivated successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAssessmentById = async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .query(`
                SELECT 
                    a.*,
                    so.subject_id,
                    s.subject_name
                FROM assessment a
                JOIN subject_offering so ON a.offering_id = so.offering_id
                JOIN subject s ON so.subject_id = s.subject_id
                WHERE a.assessment_id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Assessment not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.updateAssessment = async (req, res) => {
    const {
        assessment_title,
        total_marks,
        start_date,
        due_date
    } = req.body;

    try {
        const result = await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .input('assessment_title', sql.NVarChar(255), assessment_title)
            .input('total_marks', sql.Decimal(10,2), total_marks)
            .input('start_date', sql.DateTime, start_date)
            .input('due_date', sql.DateTime, due_date)
            .query(`
                UPDATE assessment
                SET 
                    assessment_title = @assessment_title,
                    total_marks = @total_marks,
                    start_date = @start_date,
                    due_date = @due_date,
                    updated_at = GETDATE()
                WHERE assessment_id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: "Assessment not found"
            });
        }

        res.json({
            message: "Assessment updated successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.deleteAssessment = async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .query(`
                UPDATE assessment
                SET 
                    status = 'INACTIVE',
                    updated_at = GETDATE()
                WHERE assessment_id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: "Assessment not found"
            });
        }

        res.json({
            message: "Assessment deleted successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

