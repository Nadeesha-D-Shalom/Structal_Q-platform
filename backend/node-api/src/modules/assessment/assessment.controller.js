const sql = require('mssql');

//CREATE ASSESSMENT
exports.createAssessment = async (req, res) => {
    const {
        subject_id,
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

    if (!subject_id || !assessment_title || !assessment_type) {
        return res.status(400).json({
            message: "subject_id, assessment_title, assessment_type are required"
        });
    }

    try {
        const pool = await sql.connect();

        await pool.request()
            .input('subject_id', sql.Int, subject_id)
            .input('assessment_title', sql.VarChar(150), assessment_title)
            .input('assessment_type', sql.VarChar(30), assessment_type)
            .input('total_marks', sql.Int, total_marks)
            .input('start_date', sql.DateTime, start_date)
            .input('due_date', sql.DateTime, due_date)
            .input('allow_resubmission', sql.Bit, allow_resubmission)
            .input('max_resubmissions', sql.Int, max_resubmissions)
            .input('late_policy_enabled', sql.Bit, late_policy_enabled)
            .input('grace_minutes', sql.Int, grace_minutes)
            .query(`
                INSERT INTO assessment (
                    subject_id,
                    assessment_title,
                    assessment_type,
                    total_marks,
                    start_date,
                    due_date,
                    allow_resubmission,
                    max_resubmissions,
                    late_policy_enabled,
                    grace_minutes
                )
                VALUES (
                    @subject_id,
                    @assessment_title,
                    @assessment_type,
                    @total_marks,
                    @start_date,
                    @due_date,
                    @allow_resubmission,
                    @max_resubmissions,
                    @late_policy_enabled,
                    @grace_minutes
                )
            `);

        res.status(201).json({
            message: "Assessment created successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


//GET ALL ASSESSMENTS
exports.getAssessments = async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request()
            .query(`
                SELECT a.*, s.subject_name
                FROM assessment a
                JOIN subject s ON a.subject_id = s.subject_id
                WHERE a.status = 'ACTIVE'
                ORDER BY a.created_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


//GET ASSESSMENT BY ID
exports.getAssessmentById = async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
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


//UPDATE ASSESSMENT
exports.updateAssessment = async (req, res) => {
    const {
        assessment_title,
        total_marks,
        start_date,
        due_date
    } = req.body;

    try {
        const pool = await sql.connect();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('assessment_title', sql.VarChar(150), assessment_title)
            .input('total_marks', sql.Int, total_marks)
            .input('start_date', sql.DateTime, start_date)
            .input('due_date', sql.DateTime, due_date)
            .query(`
                UPDATE assessment
                SET assessment_title = @assessment_title,
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



   //SOFT DELETE
exports.deleteAssessment = async (req, res) => {
    try {
        const pool = await sql.connect();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE assessment
                SET status = 'INACTIVE',
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