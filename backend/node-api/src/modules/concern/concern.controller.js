const PDFDocument = require('pdfkit');
const { pool, sql } = require("../../config/db");
<<<<<<< HEAD
const priorityDetector = require('./priorityDetector');

exports.createConcern = async (req, res, next) => {
    try {
        const {student_id, student_name, student_email, academic_year, concern_message, submission_id} = req.body;

        const priority = await priorityDetector(student_id, academic_year,concern_message,submission_id);
        
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
=======

// Suggest priority levels for concerns
async function priorityDetector(student_id, academic_year, concern_message, submission_id) {
    try {
        let score = 0;

        const result = await pool.request()
            .input('student_id', sql.BigInt, student_id)
            .input('submission_id', sql.BigInt, submission_id)
            .query(`
                SELECT total_marks_awarded
                FROM final_mark
                WHERE student_id = @student_id
                  AND submission_id = @submission_id
            `);

        const finalMark = Number(result.recordset[0]?.total_marks_awarded || 0);
        const lowerMsg = (concern_message || "").toLowerCase();

        const keywordWeights = {
            'medical issue': 30,
            'emergency': 30,
            'calculation error': 15,
            'wrong': 10,
            'review': 5
        };

        Object.keys(keywordWeights).forEach(word => {
            if (lowerMsg.includes(word)) score += keywordWeights[word];
        });

        if (['Y3S1', 'Y3S2'].includes(academic_year)) {
            score += 15;
        } else if (['Y4S1', 'Y4S2'].includes(academic_year)) {
            score += 25;
        }

        if (lowerMsg.includes('calculation error') && finalMark > 40 && finalMark < 45) {
            score += 20;
        }

        if (score > 70) return 'High';
        if (score > 50) return 'Medium';
        return 'Low';

    } catch (err) {
        console.error(err);
        return 'Low';
    }
}

exports.createConcern = async (req, res, next) => {
    try {
        const {
            student_id,
            student_name,
            student_email,
            academic_year,
            concern_message,
            submission_id
        } = req.body;

        if (!student_id || !submission_id || !concern_message) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        if (req.user?.user_id && Number(req.user.user_id) !== Number(student_id)) {
            return res.status(403).json({ success: false, message: 'You may only create concerns for your own account.' });
        }

        const submissionLookup = await pool.request()
            .input('submission_id', sql.BigInt, submission_id)
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
            .query(`
                SELECT fm.final_mark_id, s.student_id, a.assessment_title, so.subject_name
                FROM submission s
                LEFT JOIN final_mark fm ON fm.submission_id = s.submission_id
                LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
                LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
                WHERE s.submission_id = @submission_id
            `);
<<<<<<< HEAD
        
        //to make the concern form disable for that submission
        await pool.request()
            .input('submission_id', sql.BigInt, submission_id)
            .query(`
                    UPDATE final_mark
                    SET concern_window_open = 0
                    WHERE submission_id = @submission_id
            `);
    
        res.json({ success: true, message: "Concern created successfully." });
=======
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)

        if (!submissionLookup.recordset.length || !submissionLookup.recordset[0].final_mark_id) {
            return res.status(404).json({ success: false, message: 'Final mark not found for submission.' });
        }

        const final_mark_id = submissionLookup.recordset[0].final_mark_id;
        const priority = await priorityDetector(student_id, academic_year, concern_message, submission_id);

        const result = await pool.request()
            .input('final_mark_id', sql.BigInt, final_mark_id)
            .input('student_id', sql.BigInt, student_id)
            .input('concern_text', sql.NVarChar(sql.MAX), concern_message)
            .input('priority', sql.NVarChar(50), priority)
            .input('status', sql.NVarChar(50), 'Pending')
            .input('submitted_at', sql.DateTime, new Date())
            .query(`
                INSERT INTO mark_concern (
                    final_mark_id,
                    student_id,
                    concern_text,
                    priority,
                    status,
                    submitted_at
                )
                OUTPUT INSERTED.concern_id
                VALUES (
                    @final_mark_id,
                    @student_id,
                    @concern_text,
                    @priority,
                    @status,
                    @submitted_at
                )
            `);

        return res.json({ success: true, message: 'Concern created successfully.' });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getAllConcerns = async (req, res, next) => {
    try {
        const result = await pool.request().query(`
<<<<<<< HEAD
            SELECT 
                mc.concern_id,
                mc.student_id,
                mc.student_name,
                mc.student_email,
                mc.academic_year,
                mc.submission_id,
                mc.concern_message,
                mc.priority_level,
                mc.concern_status,
                mc.created_at,
                mc.last_modified,
                mc.revised_by,
                mc.revised_on,
                mc.lecturer_comment,
                a.assessment_title as assignment,
                fm.total_marks_awarded as originalMark,
                sub.subject_name,
                sub.subject_code
            FROM mark_concern mc
            LEFT JOIN submission s ON mc.submission_id = s.submission_id
            LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
            LEFT JOIN final_mark fm ON mc.submission_id = fm.submission_id
            LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
            LEFT JOIN subject sub ON so.subject_id = sub.subject_id
            ORDER BY mc.created_at DESC
        `);

        res.json(result.recordset);
=======
            SELECT mc.concern_id AS id,
                   mc.final_mark_id,
                   mc.student_id,
                   mc.concern_text AS message,
                   mc.priority,
                   mc.status,
                   mc.submitted_at AS date,
                   a.assessment_title AS assignment,
                   sub.subject_name AS subject,
                   u.registration_no AS student_registration
            FROM mark_concern mc
            LEFT JOIN final_mark fm ON fm.final_mark_id = mc.final_mark_id
            LEFT JOIN submission s ON fm.submission_id = s.submission_id
            LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
            LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
            LEFT JOIN subject sub ON so.subject_id = sub.subject_id
            LEFT JOIN users u ON u.user_id = mc.student_id
            ORDER BY mc.submitted_at DESC
        `);

        res.json({ success: true, data: result.recordset });
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
    } catch (err) {
        console.error('Error fetching concerns:', err);
        next(err);
    }
};

<<<<<<< HEAD
exports.getConcernsForSpecificStudent = async (req, res, next) => {
=======
exports.getConcernsByStudent = async (req, res, next) => {
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
    try {
        const { student_id } = req.params;
        const result = await pool.request()
            .input('student_id', sql.BigInt, student_id)
            .query(`
<<<<<<< HEAD
                SELECT 
                    mc.concern_id,
                    mc.student_id,
                    mc.student_name,
                    mc.student_email,
                    mc.academic_year,
                    mc.submission_id,
                    mc.concern_message,
                    mc.priority_level,
                    mc.concern_status,
                    mc.created_at,
                    mc.last_modified,
                    mc.revised_by,
                    mc.revised_on,
                    mc.lecturer_comment,
                    a.assessment_title as assignment,
                    sub.subject_name,
                    sub.subject_code,
                    fm.total_marks_awarded as original_mark,
                    fm.published_at
                FROM mark_concern mc
                LEFT JOIN submission s ON mc.submission_id = s.submission_id
                LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
                LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
                LEFT JOIN subject sub ON so.subject_id = sub.subject_id
                LEFT JOIN final_mark fm ON mc.submission_id = fm.submission_id
                WHERE mc.student_id = @student_id
                ORDER BY mc.created_at DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching student concerns:', err);
=======
                SELECT mc.concern_id AS id,
                       mc.final_mark_id,
                       mc.student_id,
                       mc.concern_text AS message,
                       mc.priority,
                       mc.status,
                       mc.submitted_at AS date,
                       a.assessment_title AS assignment,
                       sub.subject_name AS subject
                FROM mark_concern mc
                LEFT JOIN final_mark fm ON fm.final_mark_id = mc.final_mark_id
                LEFT JOIN submission s ON fm.submission_id = s.submission_id
                LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
                LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
                LEFT JOIN subject sub ON so.subject_id = sub.subject_id
                WHERE mc.student_id = @student_id
                ORDER BY mc.submitted_at DESC
            `);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error(err);
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
        next(err);
    }
};

exports.updateConcern = async (req, res, next) => {
    try {
<<<<<<< HEAD
        const { concern_id } = req.params;
        const {concern_status, revised_by, lecturer_comment, revised_mark, originalMark, submission_id} = req.body;

        //const lecturer_name = session?.user?.user_name || session?.lecturer_name;
        const lecturer_name= "Dr Robert Fox";
        

        await pool.request()
            .input('concern_status', sql.VarChar, concern_status)
            .input('revised_by', sql.BigInt, revised_by)
            .input('revised_on', sql.DateTimeOffset, new Date())
            .input('lecturer_comment', sql.VarChar, lecturer_comment)
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
                .input('old_mark', sql.Decimal, originalMark)
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
                `)

            }   
            res.json({ 
            success: true,
            message: "Concern updated successfully" 
        });
=======
        const { id } = req.params;
        const { status, resolved_at } = req.body;

        await pool.request()
            .input('status', sql.NVarChar(50), status)
            .input('resolved_at', sql.DateTime, resolved_at ? new Date(resolved_at) : null)
            .input('concern_id', sql.BigInt, id)
            .query(`
                UPDATE mark_concern
                SET status = @status,
                    resolved_at = @resolved_at
                WHERE concern_id = @concern_id
            `);
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)

        res.json({ success: true, message: 'Concern updated successfully.' });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.deleteConcern = async (req, res, next) => {
<<<<<<< HEAD
    const { concern_id } = req.params;
=======
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
    try {
        const { id } = req.params;
        await pool.request()
<<<<<<< HEAD
            .input('concern_id', sql.VarChar, concern_id)
            .query('DELETE FROM mark_concern WHERE concern_id = @concern_id');

        res.json({ 
            success: true,
            message: 'Concern deleted successfully' 
        });
=======
            .input('concern_id', sql.BigInt, id)
            .query(`
                DELETE FROM mark_concern
                WHERE concern_id = @concern_id
            `);

        res.json({ success: true, message: 'Concern deleted successfully.' });
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
    } catch (err) {
        console.error('Error deleting concern:', err);
        next(err);
    }
<<<<<<< HEAD
};

//Export as a pdf
exports.exportConcernsToPDF = async (req, res) => {
    try {
        const { concerns, filters, exportDate } = req.body;
        
        // Create a new PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=concerns_report_${new Date().toISOString().split('T')[0]}.pdf`);
        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // Add header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('Student Concerns Report', { align: 'center' });
        
        doc.moveDown();
        
        // Add report info
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Generated on: ${new Date(exportDate).toLocaleString()}`, { align: 'center' });
        
        doc.moveDown();
        
        // Add filter information
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
        
        // Add summary
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`Summary: ${concerns.length} concerns found`, { underline: true });
        
        doc.moveDown();
        
        // Define table columns
        const tableHeaders = ['ID', 'Student Name', 'Student ID', 'Assignment', 'Priority', 'Date', 'Status'];
        const columnWidths = [60, 100, 70, 120, 60, 80, 80];
        let startX = 50;
        let startY = doc.y;
        
        // Draw table header
        doc.fontSize(9)
           .font('Helvetica-Bold');
        
        let currentX = startX;
        tableHeaders.forEach((header, i) => {
            doc.text(header, currentX, startY, { width: columnWidths[i], align: 'left' });
            currentX += columnWidths[i];
        });
        
        // Draw header underline
        doc.moveTo(startX, startY + 15)
           .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), startY + 15)
           .stroke();
        
        // Draw table rows
        doc.fontSize(8)
           .font('Helvetica');
        
        let currentY = startY + 20;
        
        concerns.forEach((concern, index) => {
            // Check if we need a new page
            if (currentY > 500) {
                doc.addPage();
                currentY = 50;
                
                // Redraw header on new page
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
        
        // Add footer
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
        
        // Finalize the PDF
        doc.end();
        
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF'
        });
    }
=======
>>>>>>> 1fad3f5 ((feat) Integrate the all pages and fixed them)
};