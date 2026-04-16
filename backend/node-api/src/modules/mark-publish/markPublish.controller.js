const { pool, sql } = require("../../config/db");
const path = require("path");
const mime = require('mime-types');
const fs = require("fs");
const { Parser } = require('json2csv');

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
                    s.submission_id,
                    s.student_id,
                    er.ai_marks,
                    er.diagram_marks,
                    er.final_mark as evaluated_final_mark,
                    a.assessment_title,
                    a.total_marks as max_mark
                FROM submission s
                JOIN assessment a ON s.assessment_id = a.assessment_id
                JOIN evaluated_results er ON s.submission_id = er.submission_id
                LEFT JOIN final_mark fm ON s.submission_id = fm.submission_id
                WHERE s.assessment_id = @aid
                    AND fm.submission_id IS NULL
                    AND er.final_mark IS NOT NULL
                ORDER BY s.submitted_at ASC
            `);
        
        // Get summary statistics
        const stats = await pool.request()
            .input("aid", sql.BigInt, assessment_id)
            .query(`
                SELECT 
                    COUNT(*) as total_pending,
                    AVG(er.final_mark) as avg_mark,
                    MAX(er.final_mark) as max_mark,
                    MIN(er.final_mark) as min_mark
                FROM submission s
                JOIN evaluated_results er ON s.submission_id = er.submission_id
                LEFT JOIN final_mark fm ON s.submission_id = fm.submission_id
                WHERE s.assessment_id = @aid
                    AND fm.submission_id IS NULL
                    AND er.final_mark IS NOT NULL
            `);
        
        res.json({
            success: true,
            data: result.recordset || [],
            stats: stats.recordset[0] || {
                total_pending: 0,
                avg_mark: 0,
                max_mark: 0,
                min_mark: 0
            }
        });
    } catch (err) { 
        console.error("Error fetching pending submissions:", err);
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


// Save evaluated results
exports.saveEvaluatedResults = async (req, res) => {
    try {
        const { results } = req.body;
        const savedResults = [];

        for (const result of results) {
            // Check if already exists
            const checkQuery = await pool.request()
                .input('submission_id', sql.BigInt, result.submission_id)
                .query(`SELECT * FROM evaluated_results WHERE submission_id = @submission_id`);

            if (checkQuery.recordset.length === 0) {
                await pool.request()
                    .input('submission_id', sql.BigInt, result.submission_id)
                    .input('ai_marks', sql.Decimal(5, 2), result.ai_marks)
                    .input('diagram_marks', sql.Decimal(5, 2), result.diagram_marks)
                    .input('final_mark', sql.Decimal(5, 2), result.final_mark)
                    .query(`
                        INSERT INTO evaluated_results (submission_id, ai_marks, diagram_marks, final_mark)
                        VALUES (@submission_id, @ai_marks, @diagram_marks, @final_mark)
                    `);
                savedResults.push(result);
            } else {
                // Update existing record
                await pool.request()
                    .input('submission_id', sql.BigInt, result.submission_id)
                    .input('diagram_marks', sql.Decimal(5, 2), result.diagram_marks)
                    .input('final_mark', sql.Decimal(5, 2), result.final_mark)
                    .query(`
                        UPDATE evaluated_results 
                        SET diagram_marks = @diagram_marks, final_mark = @final_mark
                        WHERE submission_id = @submission_id
                    `);
                savedResults.push(result);
            }
        }

        res.json({
            success: true,
            message: `${savedResults.length} results saved successfully`,
            saved: savedResults
        });
    } catch (err) {
        console.error("Error saving evaluated results:", err);
        res.status(500).json({
            success: false,
            message: "Failed to save evaluated results"
        });
    }
<<<<<<< HEAD
};

// Export pending marks to CSV
exports.exportPendingMarksCSV = async (req, res, next) => {
    try {
        const { assessment_id } = req.params;
        
        const result = await pool.request()
            .input("aid", sql.BigInt, assessment_id)
            .query(`
                SELECT 
                    s.submission_id,
                    s.student_id,
                    er.ai_marks,
                    er.diagram_marks,
                    er.final_mark,
                    a.assessment_title,
                    a.total_marks as max_mark
=======
}

exports.getDiagramPages = async (req, res, next) => {
  try {
    const { submission_id } = req.params;
    const result = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query(`
                SELECT 
                    o.page_no,
                    o.has_diagram,
                    CAST(ISNULL(d.match_score, 0) * 10 AS DECIMAL(10,2)) AS clarity_score,
                    CASE 
                        WHEN ISNULL(o.has_diagram, 0) = 1
                             AND (d.match_score IS NULL OR d.match_score < 0.5)
                        THEN 1 ELSE 0
                    END AS manual_review_recommended,
                    d.detected_labels,
                    d.issues
                FROM ocr_page_result o
                LEFT JOIN diagram_check_result d
                    ON d.analysis_result_id = o.analysis_result_id
                    AND d.page_no = o.page_no
                WHERE o.analysis_result_id = (
                    SELECT TOP 1 ar.analysis_result_id
                    FROM analysis_result ar
                    WHERE ar.submission_id = @sid
                    ORDER BY ar.analysis_result_id DESC
                )
                AND ISNULL(o.has_diagram, 0) = 1
                ORDER BY o.page_no ASC;
            `);

        const parseJson = (val) => {
            if (val == null) return null;
            if (Array.isArray(val)) return val;
            if (typeof val === "string") {
                const trimmed = val.trim();
                if (!trimmed) return null;
                try { return JSON.parse(trimmed); } catch { return null; }
            }
            return null;
        };

        const normalizeIssues = (val) => {
            if (val == null) return null;
            if (Array.isArray(val)) return val.join(", ");
            if (typeof val === "string") {
                const parsed = parseJson(val);
                if (Array.isArray(parsed)) return parsed.join(", ");
                return val;
            }
            const parsed = parseJson(val);
            if (Array.isArray(parsed)) return parsed.join(", ");
            return null;
        };

        const data = (result.recordset || []).map((r) => {
            const detectedLabels = parseJson(r.detected_labels);
            return {
                page_no: r.page_no,
                has_diagram: !!r.has_diagram,
                clarity_score: r.clarity_score ?? 0,
                manual_review_recommended: !!r.manual_review_recommended,
                detected_labels: Array.isArray(detectedLabels) ? detectedLabels : [],
                issues: normalizeIssues(r.issues),
            };
        });

        res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getPublishedMarks = async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                fm.submission_id,
                fm.total_marks_awarded AS mark,
                fm.published_at,
                a.assessment_title AS assignment_name,
                a.total_marks AS total,
                sub.subject_name,
                sub.subject_code
            FROM final_mark fm
            INNER JOIN submission s ON fm.submission_id = s.submission_id
            INNER JOIN assessment a ON s.assessment_id = a.assessment_id
            INNER JOIN subject_offering so ON a.offering_id = so.offering_id
            INNER JOIN subject sub ON so.subject_id = sub.subject_id
            WHERE fm.marking_status = 'PUBLISHED'
            ORDER BY fm.published_at DESC
        `);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        next(err);
    }
};

exports.updatePublishedMark = async (req, res, next) => {
    let transaction;

    try {
        const { submission_id, new_mark, reason } = req.body;
        const lecturer_id = req.user?.user_id || 1;

        if (!submission_id || new_mark === undefined || !reason) {
            return res.status(400).json({ success: false, message: "submission_id, new_mark and reason are required." });
        }

        const parsedMark = Number(new_mark);
        if (Number.isNaN(parsedMark) || parsedMark < 0) {
            return res.status(400).json({ success: false, message: "Invalid new_mark value." });
        }

        const existing = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query(`
                SELECT fm.final_mark_id,
                       fm.total_marks_awarded,
                       a.total_marks
                FROM final_mark fm
                INNER JOIN submission s ON fm.submission_id = s.submission_id
                INNER JOIN assessment a ON s.assessment_id = a.assessment_id
                WHERE fm.submission_id = @sid
                  AND fm.marking_status = 'PUBLISHED'
            `);

        if (!existing.recordset.length) {
            return res.status(404).json({ success: false, message: "Published mark not found for the given submission." });
        }

        const { final_mark_id, total_marks_awarded, total_marks } = existing.recordset[0];
        if (parsedMark > Number(total_marks || 0)) {
            return res.status(400).json({ success: false, message: `Mark cannot exceed assessment total of ${total_marks}.` });
        }

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        await request
            .input("final_mark_id", sql.BigInt, final_mark_id)
            .input("new_mark", sql.Decimal(10, 2), parsedMark)
            .input("updated_at", sql.DateTime, new Date())
            .query(`
                UPDATE final_mark
                SET total_marks_awarded = @new_mark,
                    updated_at = @updated_at
                WHERE final_mark_id = @final_mark_id
            `);

        await request
            .input("lecturer_id", sql.BigInt, lecturer_id)
            .input("old_mark", sql.Decimal(10, 2), total_marks_awarded)
            .input("revision_reason", sql.NVarChar(sql.MAX), reason)
            .input("revised_at", sql.DateTime, new Date())
            .query(`
                INSERT INTO mark_revision_log (
                    final_mark_id,
                    lecturer_id,
                    old_mark,
                    new_mark,
                    revision_reason,
                    revised_at
                ) VALUES (
                    @final_mark_id,
                    @lecturer_id,
                    @old_mark,
                    @new_mark,
                    @revision_reason,
                    @revised_at
                )
            `);

        await transaction.commit();

        res.json({ success: true, message: "Mark updated successfully." });
    } catch (err) {
        if (transaction) {
            await transaction.rollback();
        }
        next(err);
    }
};

exports.deletePublishedMark = async (req, res, next) => {
    let transaction;

    try {
        const { submission_id } = req.params;
        const reason = req.body.reason || "Mark deleted via audit log";
        const lecturer_id = req.user?.user_id || 1;

        if (!submission_id) {
            return res.status(400).json({ success: false, message: "submission_id is required." });
        }

        const existing = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query(`
                SELECT fm.final_mark_id,
                       fm.total_marks_awarded
                FROM final_mark fm
                INNER JOIN submission s ON fm.submission_id = s.submission_id
                WHERE fm.submission_id = @sid
                  AND fm.marking_status = 'PUBLISHED'
            `);

        if (!existing.recordset.length) {
            return res.status(404).json({ success: false, message: "Published mark not found for the given submission." });
        }

        const { final_mark_id, total_marks_awarded } = existing.recordset[0];
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        await request
            .input("final_mark_id", sql.BigInt, final_mark_id)
            .input("updated_at", sql.DateTime, new Date())
            .input("reason", sql.NVarChar(sql.MAX), reason)
            .query(`
                UPDATE final_mark
                SET marking_status = 'DELETED',
                    updated_at = @updated_at,
                    feedback_summary = @reason
                WHERE final_mark_id = @final_mark_id
            `);

        await request
            .input("lecturer_id", sql.BigInt, lecturer_id)
            .input("old_mark", sql.Decimal(10, 2), total_marks_awarded)
            .input("new_mark", sql.Decimal(10, 2), total_marks_awarded)
            .input("revision_reason", sql.NVarChar(sql.MAX), `Deleted mark: ${reason}`)
            .input("revised_at", sql.DateTime, new Date())
            .query(`
                INSERT INTO mark_revision_log (
                    final_mark_id,
                    lecturer_id,
                    old_mark,
                    new_mark,
                    revision_reason,
                    revised_at
                ) VALUES (
                    @final_mark_id,
                    @lecturer_id,
                    @old_mark,
                    @new_mark,
                    @revision_reason,
                    @revised_at
                )
            `);

        await transaction.commit();

        res.json({ success: true, message: "Mark deleted successfully." });
    } catch (err) {
        if (transaction) {
            await transaction.rollback();
        }
        next(err);
    }
};

exports.publishingleMark = async (req, res, next) => {
    try {
        const { submission_id, final_mark, enable_concern_window } = req.body;
        const lecturer_id = req.user?.user_id || 1;

        if (!submission_id || final_mark === undefined) {
            return res.status(400).json({ message: "Missing submission_id or final_mark." });
        }

        const parsedMark = Number(final_mark);
        if (Number.isNaN(parsedMark) || parsedMark < 0) {
            return res.status(400).json({ message: "Invalid mark. Score must be a non-negative number." });
        }

        const validationData = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query(`
                SELECT s.student_id, a.total_marks
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
                FROM submission s
                JOIN assessment a ON s.assessment_id = a.assessment_id
                JOIN evaluated_results er ON s.submission_id = er.submission_id
                LEFT JOIN final_mark fm ON s.submission_id = fm.submission_id
                WHERE s.assessment_id = @aid
                    AND fm.submission_id IS NULL
                    AND er.final_mark IS NOT NULL
                ORDER BY s.submitted_at ASC
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No pending marks found for this assessment"
            });
        }
<<<<<<< HEAD
        
        const csvData = result.recordset.map(row => ({
            'Submission_ID': row.submission_id,
            'Student_ID': row.student_id,
            'Assessment_Title': row.assessment_title,
            'AI_Marks': row.ai_marks,
            'Diagram_Marks': row.diagram_marks,
            'Calculated_Final_Mark': row.final_mark,
            'Max_Mark': row.max_mark,
            'Mark_to_Publish': row.final_mark
        }));
        
        const fields = [
            'Submission_ID', 'Student_ID', 'Assessment_Title', 
            'AI_Marks', 'Diagram_Marks', 'Calculated_Final_Mark', 
            'Max_Mark', 'Mark_to_Publish'
        ];
        
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(csvData);
        
        const assessmentTitle = result.recordset[0].assessment_title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `marks_to_publish_${assessmentTitle}_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
        
    } catch (err) {
        console.error("Error exporting CSV:", err);
=======

        const { student_id, total_marks } = validationData.recordset[0];
        if (parsedMark > Number(total_marks || 0)) {
            return res.status(400).json({ message: `Mark (${parsedMark}) exceeds max allowed (${total_marks}).` });
        }

        const duplicateCheck = await pool.request()
            .input("sid", sql.BigInt, submission_id)
            .query("SELECT final_mark_id FROM final_mark WHERE submission_id = @sid");

        if (duplicateCheck.recordset.length > 0) {
            return res.status(409).json({ message: "This submission has already been published." });
        }

        await pool.request()
            .input("sub_id", sql.BigInt, submission_id)
            .input("stu_id", sql.BigInt, student_id)
            .input("lec_id", sql.BigInt, lecturer_id)
            .input("mark", sql.Decimal(10, 2), parsedMark)
            .input("status", sql.NVarChar(50), "PUBLISHED")
            .input("now", sql.DateTime, new Date())
            .query(`
                INSERT INTO final_mark (
                    submission_id,
                    lecturer_id,
                    total_marks_awarded,
                    marking_status,
                    published_at,
                    updated_at
                )
                VALUES (
                    @sub_id,
                    @lec_id,
                    @mark,
                    @status,
                    @now,
                    @now
                )
            `);

        res.json({ success: true, message: "Mark published successfully." });
    } catch (err) {
        next(err);
    }
};
// CONCERN WINDOW MANAGEMENT
exports.createConcernWindow = async (req, res, next) => {
    try {
        const { assessment_id, start_date, end_date, description } = req.body;
        const created_by = req.user.user_id;

        const result = await pool.request()
            .input("assessment_id", sql.Int, assessment_id)
            .input("start_date", sql.DateTime, start_date)
            .input("end_date", sql.DateTime, end_date)
            .input("description", sql.NVarChar, description)
            .input("created_by", sql.Int, created_by)
            .query(`
                INSERT INTO concern_window (assessment_id, start_date, end_date, description, created_by, created_at)
                OUTPUT INSERTED.window_id
                VALUES (@assessment_id, @start_date, @end_date, @description, @created_by, GETDATE())
            `);

        res.json({
            success: true,
            message: "Concern window created successfully",
            window_id: result.recordset[0].window_id
        });
    } catch (err) {
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
        next(err);
    }
};

<<<<<<< HEAD
// Add this new endpoint to your markPublish.controller.js
exports.bulkPublishMarks = async (req, res, next) => {
    try {
        const { submissions } = req.body; // Expecting array of submissions
        const published_by = "Dr Robert Fox";
        
        if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No submissions provided for bulk publish"
            });
        }
        
        const results = [];
        const errors = [];
        
        for (const sub of submissions) {
            try {
                const { submission_id, final_mark, ai_score, manual_mark } = sub;
                
                if (!submission_id || final_mark === undefined) {
                    errors.push({ submission_id, reason: "Missing submission_id or final_mark" });
                    continue;
                }
                
                // Get student_id and validate
                const validationData = await pool.request()
                    .input("sid", sql.BigInt, submission_id)
                    .query(`
                        SELECT s.student_id, a.total_marks 
                        FROM submission s
                        JOIN assessment a ON s.assessment_id = a.assessment_id
                        WHERE s.submission_id = @sid
                    `);
                
                if (validationData.recordset.length === 0) {
                    errors.push({ submission_id, reason: "Submission not found" });
                    continue;
                }
                
                const { student_id, total_marks } = validationData.recordset[0];
                
                if (final_mark < 0 || final_mark > total_marks) {
                    errors.push({ submission_id, reason: `Mark ${final_mark} exceeds max ${total_marks}` });
                    continue;
                }
                
                // Check for duplicate
                const duplicateCheck = await pool.request()
                    .input("sid", sql.BigInt, submission_id)
                    .query("SELECT id FROM final_mark WHERE submission_id = @sid");
                
                if (duplicateCheck.recordset.length > 0) {
                    errors.push({ submission_id, reason: "Already published" });
                    continue;
                }
                
                // Insert into final_mark table
                const result = await pool.request()
                    .input("sub_id", sql.BigInt, submission_id)
                    .input("stu_id", sql.BigInt, student_id)
                    .input("ai_marks", sql.Decimal(5, 2), ai_score || 0)
                    .input("diagram_marks", sql.Decimal(5, 2), manual_mark || 0)
                    .input("total_mark", sql.Decimal(5, 2), final_mark)
                    .input("status", sql.VarChar, "PUBLISHED")
                    .input("published_by", sql.VarChar, published_by)
                    .input("published_at", sql.DateTimeOffset, new Date())
                    .input("updated_by", sql.VarChar, published_by)
                    .input("updated_at", sql.DateTimeOffset, new Date())
                    .input("window", sql.Bit, 1)
                    .query(`
                        INSERT INTO final_mark (
                            submission_id, student_id, 
                            ai_marks, diagram_marks, total_marks_awarded,
                            marking_status, published_by, published_at,
                            updated_by, updated_at, concern_window_open
                        )
                        OUTPUT INSERTED.id
                        VALUES (
                            @sub_id, @stu_id, 
                            @ai_marks, @diagram_marks, @total_mark,
                            @status, @published_by, @published_at,
                            @updated_by, @updated_at, @window
                        )
                    `);
                
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
                
                results.push({ submission_id, final_mark, status: "published" });
                
            } catch (err) {
                errors.push({ submission_id: sub.submission_id, reason: err.message });
            }
        }
        
        res.json({
            success: true,
            message: `Published: ${results.length}, Failed: ${errors.length}`,
            published: results,
            errors: errors
        });
        
    } catch (err) {
        console.error("Error in bulk publish:", err);
        res.status(500).json({
            success: false,
            message: "Failed to bulk publish marks",
            error: err.message
        });
=======
exports.getConcernWindows = async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                cw.*,
                a.assessment_title,
                u.first_name + ' ' + u.last_name AS created_by_name
            FROM concern_window cw
            JOIN assessment a ON cw.assessment_id = a.assessment_id
            JOIN users u ON cw.created_by = u.user_id
            ORDER BY cw.created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
};

exports.getConcernWindowById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT 
                    cw.*,
                    a.assessment_title,
                    u.first_name + ' ' + u.last_name AS created_by_name
                FROM concern_window cw
                JOIN assessment a ON cw.assessment_id = a.assessment_id
                JOIN users u ON cw.created_by = u.user_id
                WHERE cw.window_id = @id
            `);

        if (!result.recordset.length) {
            return res.status(404).json({ success: false, error: "Concern window not found" });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
};

exports.updateConcernWindow = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { start_date, end_date, description } = req.body;

        await pool.request()
            .input("id", sql.Int, id)
            .input("start_date", sql.DateTime, start_date)
            .input("end_date", sql.DateTime, end_date)
            .input("description", sql.NVarChar, description)
            .query(`
                UPDATE concern_window
                SET start_date = @start_date, end_date = @end_date, description = @description, updated_at = GETDATE()
                WHERE window_id = @id
            `);

        res.json({ success: true, message: "Concern window updated successfully" });
    } catch (err) {
        next(err);
    }
};

exports.deleteConcernWindow = async (req, res, next) => {
    try {
        const { id } = req.params;
        await pool.request()
            .input("id", sql.Int, id)
            .query(`DELETE FROM concern_window WHERE window_id = @id`);
        res.json({ success: true, message: "Concern window deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// STUDENT CONCERNS
exports.raiseConcern = async (req, res, next) => {
    try {
        const { final_mark_id, concern_type, description } = req.body;
        const student_id = req.user.user_id;

        const result = await pool.request()
            .input("final_mark_id", sql.Int, final_mark_id)
            .input("student_id", sql.Int, student_id)
            .input("concern_type", sql.NVarChar, concern_type)
            .input("description", sql.NVarChar, description)
            .query(`
                INSERT INTO mark_concern (final_mark_id, student_id, concern_type, description, status, created_at)
                OUTPUT INSERTED.concern_id
                VALUES (@final_mark_id, @student_id, @concern_type, @description, 'PENDING', GETDATE())
            `);

        res.json({
            success: true,
            message: "Concern raised successfully",
            concern_id: result.recordset[0].concern_id
        });
    } catch (err) {
        next(err);
    }
};

exports.getConcerns = async (req, res, next) => {
    try {
        let query = `
            SELECT 
                mc.*,
                fm.total_marks,
                s.subject_name,
                u.first_name + ' ' + u.last_name AS student_name
            FROM mark_concern mc
            JOIN final_mark fm ON mc.final_mark_id = fm.final_mark_id
            JOIN submission sub ON fm.submission_id = sub.submission_id
            JOIN assessment a ON sub.assessment_id = a.assessment_id
            JOIN subject_offering so ON a.subject_offering_id = so.subject_offering_id
            JOIN subject s ON so.subject_id = s.subject_id
            JOIN users u ON mc.student_id = u.user_id
        `;

        if (req.user.role === 'STUDENT') {
            query += ` WHERE mc.student_id = ${req.user.user_id}`;
        }

        query += ` ORDER BY mc.created_at DESC`;

        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
};

exports.resolveConcern = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { resolution_notes } = req.body;
        const resolved_by = req.user.user_id;

        await pool.request()
            .input("id", sql.Int, id)
            .input("resolution_notes", sql.NVarChar, resolution_notes)
            .input("resolved_by", sql.Int, resolved_by)
            .query(`
                UPDATE mark_concern
                SET status = 'RESOLVED', resolution_notes = @resolution_notes, resolved_by = @resolved_by, resolved_at = GETDATE()
                WHERE concern_id = @id
            `);

        res.json({ success: true, message: "Concern resolved successfully" });
    } catch (err) {
        next(err);
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
    }
};