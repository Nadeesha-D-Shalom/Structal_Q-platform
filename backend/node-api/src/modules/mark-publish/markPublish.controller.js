const { pool, sql } = require("../../config/db");
const path = require("path");
const mime = require('mime-types');
const fs = require("fs");

exports.getAllAssessments = async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT assessment_id, assessment_title, total_marks 
            FROM assessment 
            ORDER BY created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        next(err); 
    }
};

exports.getPendingSubmissions = async (req, res, next) => {
    try {
        const { assessment_id } = req.query;
        const result = await pool.request()
            .input("aid", sql.BigInt, assessment_id)
            .query(`
                SELECT 
                s.student_id,
                s.submission_id,
                ar.analysis_result_id
                FROM submission s
                -- JOIN ensures the AI has actually processed the file
                JOIN analysis_result ar ON ar.submission_id = s.submission_id
                -- LEFT JOIN + NULL check identifies "Unpublished" marks
                LEFT JOIN final_mark fm ON fm.submission_id = s.submission_id
                WHERE s.assessment_id = @aid
                AND fm.submission_id IS NULL
                ORDER BY s.submitted_at ASC
            `);
        
        res.json(result.recordset || []);
    } catch (err) { 
        next(err); 
    }
};

exports.getPdf = async (req, res, next) => {
    try {
        const { submission_id } = req.params;
        const result = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query(`
                SELECT fs.storage_path 
                FROM submission s
                JOIN file_storage fs ON s.file_id = fs.file_id
                WHERE s.submission_id = @sid
            `);

        if (!result.recordset.length) return res.status(404).send("File not found");

        // Normalize the path for Windows
        const rawPath = result.recordset[0].storage_path;
        const fullPath = path.resolve(rawPath);

        // Check if file actually exists on disk before streaming
        if (!fs.existsSync(fullPath)) {
            return res.status(404).send("Physical file missing on server");
        }

        const type = mime.lookup(fullPath) || 'application/pdf';
        
        res.setHeader('Content-Type', type);
        res.setHeader('Content-Disposition', 'inline'); // 'inline' tells browser to show it, not download it

        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);

    } catch (err) { 
        next(err); 
    }
};


exports.getAiScores = async (req, res, next) => {
    try {
        const { submission_id } = req.params;
        const result = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query(`
                SELECT 
                    ar.submission_id,
                    ar.risk_level,
                    ar.status,
                    -- Calculate Question Total
                    ISNULL((SELECT SUM(suggested_marks) FROM ai_question_score WHERE analysis_result_id = ar.analysis_result_id), 0) AS q_marks,
                    -- Calculate Rubric Total
                    ISNULL((SELECT SUM(suggested_marks) FROM ai_rubric_score WHERE analysis_result_id = ar.analysis_result_id), 0) AS r_marks,
                    -- Calculate Final Combined Mark (Capped at 100)
                    CASE 
                        WHEN (
                            ISNULL((SELECT SUM(suggested_marks) FROM ai_question_score WHERE analysis_result_id = ar.analysis_result_id), 0) + 
                            ISNULL((SELECT SUM(suggested_marks) FROM ai_rubric_score WHERE analysis_result_id = ar.analysis_result_id), 0)
                        ) > 100 THEN 100
                        WHEN (
                            ISNULL((SELECT SUM(suggested_marks) FROM ai_question_score WHERE analysis_result_id = ar.analysis_result_id), 0) + 
                            ISNULL((SELECT SUM(suggested_marks) FROM ai_rubric_score WHERE analysis_result_id = ar.analysis_result_id), 0)
                        ) < 0 THEN 0
                        ELSE (
                            ISNULL((SELECT SUM(suggested_marks) FROM ai_question_score WHERE analysis_result_id = ar.analysis_result_id), 0) + 
                            ISNULL((SELECT SUM(suggested_marks) FROM ai_rubric_score WHERE analysis_result_id = ar.analysis_result_id), 0)
                        )
                    END AS final_mark
                FROM analysis_result ar
                WHERE ar.submission_id = @sid;
            `);

        //validation
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No AI analysis found for submission: ${submission_id}`
            });
        }

        res.status(200).json({
            success: true,
            dataset: result.recordset[0]
        });

    } catch (err) {
        next(err);
    }
}

exports.getDiagramPages = async (req, res, next) => {
  try {
    const { submission_id } = req.params;
    const result = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query(`
                SELECT 
                    ocr_id, 
                    page_no 
                FROM ocr_page_result 
                WHERE analysis_result_id = (SELECT analysis_result_id FROM analysis_result WHERE submission_id = @sid)
                AND has_diagram = 1
                ORDER BY page_no ASC;
            `);

        res.status(200).json(result.recordset);
  } catch (err) { next(err); }
};

exports.publishingleMark = async (req, res, next) => {
    try {
        const { submission_id, final_mark, enable_concern_window } = req.body;

        // Once developed: const lecturer_id = req.session?.user?.user_id;
        const lecturer_id = "1"; 

        if (!lecturer_id) {
            return res.status(401).json({ message: "Unauthorized: No lecturer session found." });
        }

        // Input Validation
        if (!submission_id || final_mark === undefined) {
            return res.status(400).json({ message: "Missing submission_id or final_mark." });
        }

        if (isNaN(final_mark) || final_mark < 0) {
            return res.status(400).json({ message: "Invalid mark. Score must be a positive number." });
        }

        const validationData = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query(`
                SELECT s.student_id, a.total_marks 
                FROM submission s
                JOIN assessment a ON s.assessment_id = a.assessment_id
                WHERE s.submission_id = @sid
            `);

        if (validationData.recordset.length === 0) {
            return res.status(404).json({ message: "Submission or Assessment not found." });
        }

        const { student_id, total_marks } = validationData.recordset[0];

        // Score Range Validation
        if (final_mark > total_marks) {
            return res.status(400).json({ message: `Mark (${final_mark}) exceeds max allowed (${total_marks}).` });
        }

        //Duplicate Check
        const duplicateCheck = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query("SELECT id FROM final_mark WHERE submission_id = @sid");

        if (duplicateCheck.recordset.length > 0) {
            return res.status(409).json({ message: "This submission has already been published." });
        }

        const result = await pool.request()
            .input("sub_id",  sql.BigInt,  submission_id)
            .input("stu_id",  sql.BigInt,  student_id)
            .input("lec_id",  sql.VarChar,  lecturer_id)
            .input("mark",    sql.Decimal(5, 2), final_mark)
            .input("status",  sql.VarChar,  "PUBLISHED")
            .input("window",  sql.Bit,      enable_concern_window ? 1 : 0)
            .input("now",     sql.DateTime, new Date())
            .query(`
                INSERT INTO final_mark (
                    submission_id, student_id, lecturer_id, 
                    total_marks_awarded, marking_status, published_at, 
                    updated_at, concern_window_open
                )
                OUTPUT INSERTED.id
                VALUES (@sub_id, @stu_id, @lec_id, @mark, @status, @now, @now, @window)
            `);

        // Generate specific ids for final marks
        const numericId = result.recordset[0].id;
        const formattedId = `FM-${String(numericId).padStart(4, '0')}`;
        await pool.request()
            .input('final_mark_id', sql.VarChar, formattedId)
            .input('id', sql.Int, numericId)
            .query(`
                UPDATE final_mark
                SET final_mark_id = @final_mark_id
                WHERE id = @id
            `);
    
        res.json({ success: true, message: "Mark published successfully." });

    } catch (err) {
        next(err); 
    }
};

exports.getPublishedMarks = async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                fm.submission_id,
                s.student_id,
                fm.total_marks_awarded AS mark,
                fm.total_marks_awarded AS total_marks_awarded,
                a.assessment_title AS assignment_name,
                a.total_marks AS total,
                sub.subject_name,
                sub.subject_code,
                so.academic_year,
                fm.published_at,
                fm.concern_window_open
            FROM final_mark fm
            INNER JOIN submission s ON fm.submission_id = s.submission_id
            INNER JOIN assessment a ON s.assessment_id = a.assessment_id
            INNER JOIN subject_offering so ON a.offering_id = so.offering_id
            INNER JOIN subject sub ON so.subject_id = sub.subject_id
            WHERE fm.marking_status = 'PUBLISHED'
            ORDER BY fm.published_at DESC
        `);
        res.json({ success: true, data: result.recordset || [] });
    } catch (err) {
        next(err);
    }
};

exports.updatePublishedMark = async (req, res, next) => {
    try {
        const { submission_id, new_mark } = req.body;
        if (submission_id == null || new_mark === undefined) {
            return res.status(400).json({ success: false, message: "submission_id and new_mark are required" });
        }
        const markNum = Number(new_mark);
        if (Number.isNaN(markNum) || markNum < 0) {
            return res.status(400).json({ success: false, message: "Invalid mark" });
        }
        await pool
            .request()
            .input("sid", sql.BigInt, submission_id)
            .input("mark", sql.Decimal(10, 2), markNum)
            .query(`
                UPDATE final_mark
                SET total_marks_awarded = @mark, updated_at = GETDATE()
                WHERE submission_id = @sid AND marking_status = 'PUBLISHED'
            `);
        res.json({ success: true, message: "Mark updated successfully." });
    } catch (err) {
        next(err);
    }
};

exports.deletePublishedMark = async (req, res, next) => {
    try {
        const { submission_id } = req.params;
        await pool
            .request()
            .input("sid", sql.BigInt, submission_id)
            .query(`DELETE FROM final_mark WHERE submission_id = @sid`);
        res.json({ success: true, message: "Mark deleted successfully." });
    } catch (err) {
        next(err);
    }
};