const { sql, poolPromise } = require('../../config/db');

// CREATE SUBJECT
const createSubject = async (req, res) => {
    const {
        subject_code,
        subject_name,
        program_id,
        term_id,
        credit_value
    } = req.body;

    if (!subject_code || !subject_name) {
        return res.status(400).json({
            message: "subject_code and subject_name are required"
        });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('subject_code', sql.VarChar(20), subject_code)
            .input('subject_name', sql.VarChar(100), subject_name)
            .input('program_id', sql.Int, program_id || null)
            .input('term_id', sql.Int, term_id || null)
            .input('credit_value', sql.Decimal(3,1), credit_value || null)
            .query(`
                INSERT INTO subject 
                (subject_code, subject_name, program_id, term_id, credit_value)
                VALUES 
                (@subject_code, @subject_name, @program_id, @term_id, @credit_value)
            `);

        res.status(201).json({ message: "Subject created successfully" });

    } catch (err) {
        console.error(err); // 🔥 important for debug
        res.status(500).json({ error: err.message });
    }
};


// GET ALL SUBJECTS
const getSubjects = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .query(`
                SELECT * 
                FROM subject
                WHERE status = 'ACTIVE'
                ORDER BY created_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


// GET SUBJECT BY ID
const getSubjectById = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT * 
                FROM subject 
                WHERE subject_id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


// UPDATE SUBJECT
const updateSubject = async (req, res) => {
    const {
        subject_code,
        subject_name,
        program_id,
        term_id,
        credit_value
    } = req.body;

    if (!subject_code || !subject_name) {
        return res.status(400).json({
            message: "subject_code and subject_name are required"
        });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('subject_code', sql.VarChar(20), subject_code)
            .input('subject_name', sql.VarChar(100), subject_name)
            .input('program_id', sql.Int, program_id || null)
            .input('term_id', sql.Int, term_id || null)
            .input('credit_value', sql.Decimal(3,1), credit_value || null)
            .query(`
                UPDATE subject
                SET subject_code = @subject_code,
                    subject_name = @subject_name,
                    program_id = @program_id,
                    term_id = @term_id,
                    credit_value = @credit_value,
                    updated_at = GETDATE()
                WHERE subject_id = @id
            `);

        res.json({ message: "Subject updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


// DELETE (SOFT DELETE)
const deleteSubject = async (req, res) => {
    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE subject
                SET status = 'INACTIVE',
                    updated_at = GETDATE()
                WHERE subject_id = @id
            `);

        res.json({ message: "Subject deactivated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


module.exports = {
    createSubject,
    getSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject
};