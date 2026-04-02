const { sql, poolPromise } = require('../../config/db');

// CREATE QUESTION
const createQuestion = async (req, res) => {
    const {
        marking_guide_id,
        question_no,
        question_text,
        max_marks,
        model_answer_text,
        keyword_weight,
        semantic_weight
    } = req.body;

    if (!marking_guide_id || !question_no || !question_text) {
        return res.status(400).json({
            message: "marking_guide_id, question_no, question_text are required"
        });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('marking_guide_id', sql.Int, marking_guide_id)
            .input('question_no', sql.Int, question_no)
            .input('question_text', sql.VarChar(500), question_text)
            .input('max_marks', sql.Int, max_marks || 0)
            .input('model_answer_text', sql.VarChar(sql.MAX), model_answer_text || null)
            .input('keyword_weight', sql.Decimal(5,2), keyword_weight || 0)
            .input('semantic_weight', sql.Decimal(5,2), semantic_weight || 0)
            .query(`
                INSERT INTO guide_question (
                    marking_guide_id,
                    question_no,
                    question_text,
                    max_marks,
                    model_answer_text,
                    keyword_weight,
                    semantic_weight
                )
                VALUES (
                    @marking_guide_id,
                    @question_no,
                    @question_text,
                    @max_marks,
                    @model_answer_text,
                    @keyword_weight,
                    @semantic_weight
                )
            `);

        res.status(201).json({ message: "Question created successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// GET ALL QUESTIONS
const getQuestions = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT gq.*, mg.title AS guide_title
            FROM guide_question gq
            JOIN marking_guide mg ON gq.marking_guide_id = mg.marking_guide_id
            ORDER BY gq.marking_guide_id, gq.question_no ASC
        `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// GET BY ID
const getQuestionById = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT * 
                FROM guide_question
                WHERE question_id = @id
            `);

        if (!result.recordset.length) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// UPDATE QUESTION (includes reorder support)
const updateQuestion = async (req, res) => {
    const {
        question_text,
        max_marks,
        model_answer_text,
        keyword_weight,
        semantic_weight,
        question_no
    } = req.body;

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('question_text', sql.VarChar(500), question_text || "")
            .input('max_marks', sql.Int, max_marks || 0)
            .input('model_answer_text', sql.VarChar(sql.MAX), model_answer_text || null)
            .input('keyword_weight', sql.Decimal(5,2), keyword_weight || 0)
            .input('semantic_weight', sql.Decimal(5,2), semantic_weight || 0)
            .input('question_no', sql.Int, question_no || 0)
            .query(`
                UPDATE guide_question
                SET question_text = @question_text,
                    max_marks = @max_marks,
                    model_answer_text = @model_answer_text,
                    keyword_weight = @keyword_weight,
                    semantic_weight = @semantic_weight,
                    question_no = @question_no,
                    updated_at = GETDATE()
                WHERE question_id = @id
            `);

        res.json({ message: "Question updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// REORDER QUESTIONS (BEST FIX)
const reorderQuestions = async (req, res) => {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({
            message: "questions array required"
        });
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            for (const q of questions) {
                await new sql.Request(transaction)
                    .input('id', sql.Int, q.question_id)
                    .input('question_no', sql.Int, q.question_no)
                    .query(`
                        UPDATE guide_question
                        SET question_no = @question_no
                        WHERE question_id = @id
                    `);
            }

            await transaction.commit();

            res.json({ message: "Reordered successfully" });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// DELETE QUESTION
const deleteQuestion = async (req, res) => {
    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                DELETE FROM guide_question
                WHERE question_id = @id
            `);

        res.json({ message: "Question deleted successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    reorderQuestions 
};