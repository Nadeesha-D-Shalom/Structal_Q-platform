const PDFDocument = require('pdfkit');
const { pool, poolConnect, sql } = require("../../config/db");
const priorityDetector = require('./priorityDetector');
const { assertActiveConcernWindow } = require("./concernEligibility");

function normalizeConcernRow(row) {
    const fallbackName = (row.fallback_student_name || "").trim();
    return {
        ...row,
        concern_id: row.concern_id || (row.id != null ? `CON-${String(row.id).padStart(4, "0")}` : null),
        student_name: row.student_name || fallbackName || `Student ${row.student_id ?? ""}`.trim(),
        student_email: row.student_email || row.fallback_student_email || "",
        concern_status: row.concern_status || "Pending",
        priority_level: row.priority_level || "Low",
        assignment: row.assignment || row.assessment_title || "N/A",
        subject: row.subject || row.subject_name || "",
        originalMark: row.originalMark ?? row.original_mark ?? null,
        original_mark: row.original_mark ?? row.originalMark ?? null
    };
}

exports.createConcern = async (req, res, next) => {
    try {
        await poolConnect;
        const {student_id, student_name, student_email, academic_year, concern_message, submission_id} = req.body;

        const sessionUid = req.user?.user_id;
        if (sessionUid != null && Number(student_id) !== Number(sessionUid)) {
            return res.status(403).json({
                success: false,
                message: "You can only submit concerns for your own account.",
            });
        }

        const windowCheck = await assertActiveConcernWindow(pool, submission_id, student_id);
        if (!windowCheck.ok) {
            return res.status(403).json({ success: false, message: windowCheck.message });
        }

        const dup = await pool.request()
            .input("submission_id", sql.BigInt, submission_id)
            .query(`SELECT COUNT(*) AS c FROM mark_concern WHERE submission_id = @submission_id`);
        if (dup.recordset[0].c > 0) {
            return res.status(400).json({
                success: false,
                message: "A concern has already been submitted for this submission.",
            });
        }

        const priority = await priorityDetector(student_id, academic_year, concern_message, submission_id);

        const result = await pool.request()
            .input('student_id', sql.BigInt, student_id)
            .input('student_name', sql.VarChar, student_name)
            .input('student_email', sql.VarChar, student_email)
            .input('academic_year', sql.VarChar, academic_year)
            .input('submission_id', sql.BigInt, submission_id)
            .input('concern_message', sql.NVarChar(sql.MAX), concern_message)
            .input('priority_level', sql.VarChar, priority)
            .query(`INSERT INTO mark_concern
                    (student_id, student_name, student_email, academic_year, submission_id, concern_message, priority_level)
                    OUTPUT inserted.id, inserted.submission_id
                    VALUES (@student_id, @student_name, @student_email, @academic_year, @submission_id, @concern_message, @priority_level)`);

        // Generate specific ids for concerns
        const numericId = result.recordset[0].id;
        const formattedId = `CON-${String(numericId).padStart(4, '0')}`;
        await pool.request()
            .input('concern_id', sql.VarChar, formattedId)
            .input('id', sql.Int, numericId)
            .query(`UPDATE mark_concern SET concern_id = @concern_id WHERE id = @id`);

        res.json({ success: true, message: "Concern created successfully." });
    } catch (err) {
        console.error('Error creating concern:', err);
        next(err);
    }
};

exports.getAllConcerns = async (req, res, next) => {
    try {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT
                mc.*,
                a.assessment_title AS assignment,
                sub.subject_name AS subject,
                sub.subject_code,
                fm.total_marks_awarded AS originalMark,
                CONCAT(ISNULL(u.first_name, ''), ' ', ISNULL(u.last_name, '')) AS fallback_student_name,
                u.email AS fallback_student_email
            FROM mark_concern mc
            LEFT JOIN submission s ON mc.submission_id = s.submission_id
            LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
            OUTER APPLY (
                SELECT TOP 1 f.total_marks_awarded
                FROM final_mark f
                WHERE f.submission_id = mc.submission_id
                ORDER BY f.id DESC
            ) fm
            LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
            LEFT JOIN subject sub ON so.subject_id = sub.subject_id
            LEFT JOIN users u ON mc.student_id = u.user_id
            ORDER BY mc.created_at DESC
        `);

        res.json(result.recordset.map(normalizeConcernRow));
    } catch (err) {
        console.error('Error fetching concerns:', err);
        next(err);
    }
};

exports.getConcernsForSpecificStudent = async (req, res, next) => {
    try {
        await poolConnect;
        const { student_id } = req.params;
        const result = await pool.request()
            .input('student_id', sql.BigInt, student_id)
            .query(`
                SELECT
                    mc.*,
                    a.assessment_title AS assignment,
                    sub.subject_name AS subject,
                    sub.subject_code,
                    fm.total_marks_awarded AS original_mark,
                    fm.published_at,
                    CONCAT(ISNULL(u.first_name, ''), ' ', ISNULL(u.last_name, '')) AS fallback_student_name,
                    u.email AS fallback_student_email
                FROM mark_concern mc
                LEFT JOIN submission s ON mc.submission_id = s.submission_id
                LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
                LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
                LEFT JOIN subject sub ON so.subject_id = sub.subject_id
                OUTER APPLY (
                    SELECT TOP 1 f.total_marks_awarded, f.published_at
                    FROM final_mark f
                    WHERE f.submission_id = mc.submission_id
                    ORDER BY f.id DESC
                ) fm
                LEFT JOIN users u ON mc.student_id = u.user_id
                WHERE mc.student_id = @student_id
                ORDER BY mc.created_at DESC
            `);

        res.json(result.recordset.map(normalizeConcernRow));
    } catch (err) {
        console.error('Error fetching student concerns:', err);
        next(err);
    }
};

exports.updateConcern = async (req, res, next) => {
    try {
        const { concern_id } = req.params;
        const {
            concern_status,
            revised_by,
            lecturer_comment,
            revised_mark,
            originalMark,
            original_mark,
            submission_id
        } = req.body;

        const resolvedRevisedBy = revised_by ?? req.user?.user_id;
        const resolvedOriginalMark = originalMark ?? original_mark;

        const lecturer_name = "Dr Robert Fox";

        const revisedByStr =
            resolvedRevisedBy != null ? String(resolvedRevisedBy) : "";

        await pool.request()
            .input('concern_status', sql.VarChar, concern_status)
            .input('revised_by', sql.NVarChar(255), revisedByStr)
            .input('revised_on', sql.DateTimeOffset, new Date())
            .input('lecturer_comment', sql.NVarChar(sql.MAX), lecturer_comment || "")
            .input('concern_id', sql.VarChar, concern_id)
            .query(`
                UPDATE mark_concern
                SET
                    concern_status = @concern_status,
                    revised_by = @revised_by,
                    revised_on = @revised_on,
                    lecturer_comment = @lecturer_comment
                WHERE concern_id = @concern_id`
            );

        //if the mark is updated within the concern revision table
        if (revised_mark !== undefined && revised_mark !== null) {
            const reason = `Mark changed due to student concern id : ${concern_id}`;
            //save in mark revision audits
            await pool.request()
                .input('submission_id', sql.BigInt, submission_id)
                .input('lecturer_name', sql.VarChar, lecturer_name)
                .input('old_mark', sql.Decimal, resolvedOriginalMark)
                .input('new_mark', sql.Decimal, revised_mark)
                .input('reason', sql.VarChar, reason)
                .input('revised_at', sql.DateTimeOffset, new Date())
                .query(`
                    INSERT INTO mark_revision_log
                    (submission_id, lecturer_name, old_mark, new_mark, revision_reason, revised_at)
                    VALUES
                    (@submission_id, @lecturer_name, @old_mark, @new_mark, @reason, @revised_at)
                `);

            //update final mark to new mark
            await pool.request()
                .input('submission_id', sql.BigInt, submission_id)
                .input('lecturer_name', sql.VarChar, lecturer_name)
                .input('revised_mark', sql.Decimal, revised_mark)
                .input('revised_at', sql.DateTimeOffset, new Date())
                .query(`
                    UPDATE final_mark
                    SET total_marks_awarded = @revised_mark,
                        updated_by = @lecturer_name,
                        updated_at = @revised_at
                    WHERE submission_id = @submission_id
                    AND marking_status = 'PUBLISHED'
                `);
        }

        res.json({
            success: true,
            message: "Concern updated successfully"
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.deleteConcern = async (req, res, next) => {
    const { concern_id } = req.params;
    try {
        await poolConnect;
        await pool.request()
            .input('concern_id', sql.VarChar, concern_id)
            .query('DELETE FROM mark_concern WHERE concern_id = @concern_id');

        res.json({
            success: true,
            message: 'Concern deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting concern:', err);
        next(err);
    }
};

//Export as a pdf
exports.exportConcernsToPDF = async (req, res) => {
    try {
        const { concerns, filters, exportDate } = req.body;

        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=concerns_report_${new Date().toISOString().split('T')[0]}.pdf`);

        doc.pipe(res);

        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('Student Concerns Report', { align: 'center' });

        doc.moveDown();

        doc.fontSize(10)
           .font('Helvetica')
           .text(`Generated on: ${new Date(exportDate).toLocaleString()}`, { align: 'center' });

        doc.moveDown();

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Filter Information:', { underline: true });

        doc.fontSize(10)
           .font('Helvetica')
           .text(`Status Filter: ${filters.status}`)
           .text(`Priority Filter: ${filters.priority}`)
           .text(`Search Query: ${filters.search || 'None'}`)
           .text(`Sort By: ${filters.sortBy}`);

        doc.moveDown();

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`Summary: ${concerns.length} concerns found`, { underline: true });

        doc.moveDown();

        const tableHeaders = ['ID', 'Student Name', 'Student ID', 'Assignment', 'Priority', 'Date', 'Status'];
        const columnWidths = [60, 100, 70, 120, 60, 80, 80];
        let startX = 50;
        let startY = doc.y;

        doc.fontSize(9).font('Helvetica-Bold');

        let currentX = startX;
        tableHeaders.forEach((header, i) => {
            doc.text(header, currentX, startY, { width: columnWidths[i], align: 'left' });
            currentX += columnWidths[i];
        });

        doc.moveTo(startX, startY + 15)
           .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), startY + 15)
           .stroke();

        doc.fontSize(8).font('Helvetica');

        let currentY = startY + 20;

        concerns.forEach((concern) => {
            if (currentY > 500) {
                doc.addPage();
                currentY = 50;

                currentX = startX;
                doc.fontSize(9).font('Helvetica-Bold');
                tableHeaders.forEach((header, i) => {
                    doc.text(header, currentX, currentY - 5, { width: columnWidths[i], align: 'left' });
                    currentX += columnWidths[i];
                });
                doc.moveTo(startX, currentY + 10)
                   .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY + 10)
                   .stroke();
                doc.fontSize(8).font('Helvetica');
                currentY += 15;
            }

            const rowData = [
                concern.concern_id || 'N/A',
                concern.student_name || 'N/A',
                concern.student_id?.toString() || 'N/A',
                concern.assignment || 'N/A',
                concern.priority_level || 'Low',
                concern.created_at ? new Date(concern.created_at).toLocaleDateString() : 'N/A',
                concern.concern_status || 'Pending'
            ];

            currentX = startX;
            rowData.forEach((data, i) => {
                doc.text(data.toString(), currentX, currentY, { width: columnWidths[i], align: 'left' });
                currentX += columnWidths[i];
            });

            currentY += 20;
        });

        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .font('Helvetica')
               .text(
                   `Page ${i + 1} of ${pageCount}`,
                   50,
                   doc.page.height - 50,
                   { align: 'center' }
               );
        }

        doc.end();

    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF'
        });
    }
};
