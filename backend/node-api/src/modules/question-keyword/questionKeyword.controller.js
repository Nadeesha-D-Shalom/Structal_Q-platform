const sql = require('mssql');

// CREATE KEYWORD
exports.createKeyword = async (req, res) => {
    const {
        question_id,
        keyword_text,
        marks_weight,
        is_mandatory,
        match_type
    } = req.body;

    if (!question_id || !keyword_text) {
        return res.status(400).json({
            message: "question_id and keyword_text are required"
        });
    }

    try {
        const pool = await sql.connect();

        await pool.request()
            .input('question_id', sql.Int, question_id)
            .input('keyword_text', sql.VarChar(200), keyword_text)
            .input('marks_weight', sql.Decimal(5,2), marks_weight || 0)
            .input('is_mandatory', sql.Bit, is_mandatory || 0)
            .input('match_type', sql.VarChar(50), match_type || 'EXACT')
            .query(`
                INSERT INTO question_keyword (
                    question_id,
                    keyword_text,
                    marks_weight,
                    is_mandatory,
                    match_type
                )
                VALUES (
                    @question_id,
                    @keyword_text,
                    @marks_weight,
                    @is_mandatory,
                    @match_type
                )
            `);

        res.status(201).json({
            message: "Keyword created successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// GET ALL KEYWORDS
exports.getKeywords = async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request()
            .query(`
                SELECT k.*, q.question_text
                FROM question_keyword k
                JOIN guide_question q ON k.question_id = q.question_id
                ORDER BY k.created_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// GET KEYWORD BY ID
exports.getKeywordById = async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT * 
                FROM question_keyword
                WHERE keyword_id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Keyword not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// UPDATE KEYWORD
exports.updateKeyword = async (req, res) => {
    const {
        keyword_text,
        marks_weight,
        is_mandatory,
        match_type
    } = req.body;

    try {
        const pool = await sql.connect();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('keyword_text', sql.VarChar(200), keyword_text)
            .input('marks_weight', sql.Decimal(5,2), marks_weight)
            .input('is_mandatory', sql.Bit, is_mandatory)
            .input('match_type', sql.VarChar(50), match_type)
            .query(`
                UPDATE question_keyword
                SET keyword_text = @keyword_text,
                    marks_weight = @marks_weight,
                    is_mandatory = @is_mandatory,
                    match_type = @match_type
                WHERE keyword_id = @id
            `);

        res.json({
            message: "Keyword updated successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// DELETE KEYWORD (HARD DELETE)
exports.deleteKeyword = async (req, res) => {
    try {
        const pool = await sql.connect();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                DELETE FROM question_keyword
                WHERE keyword_id = @id
            `);

        res.json({
            message: "Keyword deleted successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};