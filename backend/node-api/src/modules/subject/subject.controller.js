const { sql, poolPromise } = require('../../config/db');

// VALIDATION FUNCTION
const validateSubject = (data) => {
    const {
        subject_code,
        subject_name,
        program_id,
        term_id,
        credit_value
    } = data;

    if (!subject_code || !subject_name || program_id == null || term_id == null || credit_value == null) {
        return "All fields are required (code, name, program, term, credits)";
    }

    if (typeof subject_code !== "string" || subject_code.trim() === "") {
        return "Invalid subject_code";
    }

    if (typeof subject_name !== "string" || subject_name.trim() === "") {
        return "Invalid subject_name";
    }

    if (isNaN(program_id) || program_id < 1 || program_id > 4) {
        return "program_id must be between 1 and 4";
    }

    if (isNaN(term_id) || term_id < 1 || term_id > 2) {
        return "term_id must be 1 or 2";
    }

    if (isNaN(credit_value) || credit_value <= 0 || credit_value > 10) {
        return "credit_value must be between 0 and 10";
    }

    return null;
};

// CREATE SUBJECT
const createSubject = async (req, res) => {
    const validationError = validateSubject(req.body);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const {
        subject_code,
        subject_name,
        program_id,
        term_id,
        credit_value
    } = req.body;

    try {
        const pool = await poolPromise;

        // CHECK DUPLICATE
        const duplicateCheck = await pool.request()
            .input('subject_code', sql.VarChar(20), subject_code)
            .query(`
                SELECT subject_id FROM subject
                WHERE subject_code = @subject_code AND status = 'ACTIVE'
            `);

        if (duplicateCheck.recordset.length > 0) {
            return res.status(400).json({
                message: "Subject code already exists"
            });
        }

        await pool.request()
            .input('subject_code', sql.VarChar(20), subject_code)
            .input('subject_name', sql.VarChar(100), subject_name)
            .input('program_id', sql.Int, program_id)
            .input('term_id', sql.Int, term_id)
            .input('credit_value', sql.Decimal(3,1), credit_value)
            .query(`
                INSERT INTO subject 
                (subject_code, subject_name, program_id, term_id, credit_value)
                VALUES 
                (@subject_code, @subject_name, @program_id, @term_id, @credit_value)
            `);

        res.status(201).json({ message: "Subject created successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET ALL
const getSubjects = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT * 
            FROM subject
            WHERE status = 'ACTIVE'
            ORDER BY created_at DESC
        `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET BY ID
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
        res.status(500).json({ error: err.message });
    }
};

// UPDATE SUBJECT
const updateSubject = async (req, res) => {
    const validationError = validateSubject(req.body);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const {
        subject_code,
        subject_name,
        program_id,
        term_id,
        credit_value
    } = req.body;

    try {
        const pool = await poolPromise;

        // CHECK DUPLICATE
        const duplicateCheck = await pool.request()
            .input('subject_code', sql.VarChar(20), subject_code)
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT subject_id FROM subject
                WHERE subject_code = @subject_code
                AND subject_id != @id
                AND status = 'ACTIVE'
            `);

        if (duplicateCheck.recordset.length > 0) {
            return res.status(400).json({
                message: "Subject code already exists"
            });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('subject_code', sql.VarChar(20), subject_code)
            .input('subject_name', sql.VarChar(100), subject_name)
            .input('program_id', sql.Int, program_id)
            .input('term_id', sql.Int, term_id)
            .input('credit_value', sql.Decimal(3,1), credit_value)
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
        res.status(500).json({ error: err.message });
    }
};

// DELETE (SOFT)
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