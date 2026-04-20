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
        next(err);
    }
};

exports.bulkPublishMarks = async (req, res, next) => {
    try {
        const { submissions, published_by } = req.body; 
        
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
                    .query(`
                        INSERT INTO final_mark (
                            submission_id, student_id, 
                            ai_marks, diagram_marks, total_marks_awarded,
                            marking_status, published_by, published_at,
                            updated_by, updated_at
                        )
                        OUTPUT INSERTED.id
                        VALUES (
                            @sub_id, @stu_id, 
                            @ai_marks, @diagram_marks, @total_mark,
                            @status, @published_by, @published_at,
                            @updated_by, @updated_at
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
    }
};