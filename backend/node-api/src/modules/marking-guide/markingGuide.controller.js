const { sql, poolPromise } = require('../../config/db');

// VALIDATION
const validateGuide = async (data, pool) => {
    const {
        assessment_id,
        title,
        order_sensitive,
        requires_diagram_check,
        diagram_types_expected
    } = data;

    if (!assessment_id || !title) {
        return "assessment_id and title are required";
    }

    if (isNaN(assessment_id)) {
        return "assessment_id must be a number";
    }

    if (title.length > 150) {
        return "title too long (max 150 chars)";
    }

    // CHECK ASSESSMENT EXISTS
    const assessmentCheck = await pool.request()
        .input('id', sql.Int, assessment_id)
        .query(`
            SELECT assessment_id 
            FROM assessment 
            WHERE assessment_id = @id AND status = 'ACTIVE'
        `);

    if (!assessmentCheck.recordset.length) {
        return "Assessment does not exist";
    }

    // BOOLEAN CHECK
    if (order_sensitive !== undefined && ![0, 1, true, false].includes(order_sensitive)) {
        return "order_sensitive must be boolean";
    }

    if (requires_diagram_check !== undefined && ![0, 1, true, false].includes(requires_diagram_check)) {
        return "requires_diagram_check must be boolean";
    }

    // CONDITIONAL VALIDATION
    if (requires_diagram_check && !diagram_types_expected) {
        return "diagram_types_expected required when diagram check enabled";
    }

    return null;
};

// CREATE MARKING GUIDE
const createGuide = async (req, res) => {
    try {
        const pool = await poolPromise;

        const error = await validateGuide(req.body, pool);
        if (error) return res.status(400).json({ message: error });

        const {
            assessment_id,
            title,
            description,
            order_sensitive,
            requires_diagram_check,
            diagram_types_expected,
            created_by
        } = req.body;

        // VERSION
        const versionResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT ISNULL(MAX(version_no), 0) + 1 AS next_version
                FROM marking_guide
                WHERE assessment_id = @assessment_id
            `);

        const version_no = versionResult.recordset[0].next_version;

        await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('version_no', sql.Int, version_no)
            .input('title', sql.VarChar(150), title)
            .input('description', sql.VarChar(sql.MAX), description || null)
            .input('order_sensitive', sql.Bit, order_sensitive ? 1 : 0)
            .input('requires_diagram_check', sql.Bit, requires_diagram_check ? 1 : 0)
            .input('diagram_types_expected', sql.VarChar(200), diagram_types_expected || null)
            .input('created_by', sql.Int, created_by || null)
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
            message: "Marking guide created successfully",
            version_no
        });

    } catch (err) {
        console.error("Create Guide Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


// NEW VERSION
const createNewVersion = async (req, res) => {
    try {
        const pool = await poolPromise;
        const guideId = req.params.id;

        if (isNaN(guideId)) {
            return res.status(400).json({ message: "Invalid guide ID" });
        }

        // GET GUIDE
        const guideResult = await pool.request()
            .input('id', sql.Int, guideId)
            .query(`SELECT * FROM marking_guide WHERE marking_guide_id = @id`);

        if (!guideResult.recordset.length) {
            return res.status(404).json({ message: "Guide not found" });
        }

        const guide = guideResult.recordset[0];

        // VERSION
        const versionResult = await pool.request()
            .input('assessment_id', sql.Int, guide.assessment_id)
            .query(`
                SELECT ISNULL(MAX(version_no), 0) + 1 AS next_version
                FROM marking_guide
                WHERE assessment_id = @assessment_id
            `);

        const newVersion = versionResult.recordset[0].next_version;

        // INSERT GUIDE
        const insertGuide = await pool.request()
            .input('assessment_id', sql.Int, guide.assessment_id)
            .input('version_no', sql.Int, newVersion)
            .input('title', sql.VarChar(150), guide.title)
            .input('description', sql.VarChar(sql.MAX), guide.description)
            .input('order_sensitive', sql.Bit, guide.order_sensitive)
            .input('requires_diagram_check', sql.Bit, guide.requires_diagram_check)
            .input('diagram_types_expected', sql.VarChar(200), guide.diagram_types_expected)
            .input('created_by', sql.Int, guide.created_by)
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
                OUTPUT INSERTED.marking_guide_id
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

        const newGuideId = insertGuide.recordset[0].marking_guide_id;

        // COPY QUESTIONS + KEYWORDS
        const questions = await pool.request()
            .input('gid', sql.Int, guideId)
            .query(`SELECT * FROM guide_question WHERE marking_guide_id = @gid`);

        for (const q of questions.recordset) {

            const newQ = await pool.request()
                .input('marking_guide_id', sql.Int, newGuideId)
                .input('question_no', sql.Int, q.question_no)
                .input('question_text', sql.VarChar(500), q.question_text)
                .input('max_marks', sql.Int, q.max_marks)
                .input('model_answer_text', sql.VarChar(sql.MAX), q.model_answer_text)
                .input('keyword_weight', sql.Decimal(5,2), q.keyword_weight)
                .input('semantic_weight', sql.Decimal(5,2), q.semantic_weight)
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
                    OUTPUT INSERTED.question_id
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

            const newQId = newQ.recordset[0].question_id;

            const keywords = await pool.request()
                .input('qid', sql.Int, q.question_id)
                .query(`SELECT * FROM question_keyword WHERE question_id = @qid`);

            for (const k of keywords.recordset) {
                await pool.request()
                    .input('question_id', sql.Int, newQId)
                    .input('keyword_text', sql.VarChar(200), k.keyword_text)
                    .input('marks_weight', sql.Decimal(5,2), k.marks_weight)
                    .input('is_mandatory', sql.Bit, k.is_mandatory)
                    .input('match_type', sql.VarChar(50), k.match_type)
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
            }
        }

        res.json({
            message: "New version created successfully",
            version_no: newVersion,
            new_guide_id: newGuideId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


// GET ALL
const getGuides = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT mg.*, a.assessment_title, s.subject_name
            FROM marking_guide mg
            JOIN assessment a ON mg.assessment_id = a.assessment_id
            JOIN subject s ON a.subject_id = s.subject_id
            WHERE mg.status = 'ACTIVE'
            ORDER BY mg.created_at DESC
        `);

        res.json(result.recordset);

    } catch (err) {
        console.error("Guide Fetch Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


// GET BY ID
const getGuideById = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT mg.*, a.assessment_title, s.subject_name
                FROM marking_guide mg
                JOIN assessment a ON mg.assessment_id = a.assessment_id
                JOIN subject s ON a.subject_id = s.subject_id
                WHERE mg.marking_guide_id = @id
            `);

        if (!result.recordset.length) {
            return res.status(404).json({ message: "Guide not found" });
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


// UPDATE
const updateGuide = async (req, res) => {
    try {
        const pool = await poolPromise;

        const error = await validateGuide(req.body, pool);
        if (error) return res.status(400).json({ message: error });

        const {
            title,
            description,
            order_sensitive,
            requires_diagram_check,
            diagram_types_expected
        } = req.body;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('title', sql.VarChar(150), title)
            .input('description', sql.VarChar(sql.MAX), description || null)
            .input('order_sensitive', sql.Bit, order_sensitive ? 1 : 0)
            .input('requires_diagram_check', sql.Bit, requires_diagram_check ? 1 : 0)
            .input('diagram_types_expected', sql.VarChar(200), diagram_types_expected || null)
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

        res.json({ message: "Guide updated" });

    } catch (err) {
        console.error("Update Guide Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


// DELETE
const deleteGuide = async (req, res) => {
    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE marking_guide
                SET status = 'INACTIVE',
                    updated_at = GETDATE()
                WHERE marking_guide_id = @id
            `);

        res.json({ message: "Guide deleted" });

    } catch (err) {
        console.error("Delete Guide Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


module.exports = {
    createGuide,
    createNewVersion,
    getGuides,
    getGuideById,
    updateGuide,
    deleteGuide
};
