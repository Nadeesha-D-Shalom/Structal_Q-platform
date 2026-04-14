const PDFDocument = require('pdfkit');
const { pool, sql } = require("../../config/db");

exports.getMarks = async (req, res) => {
    try {
        const { student_id } = req.params;
        
        const result = await pool.request()
        .input('student_id', sql.BigInt, student_id)
        .query(`
            SELECT 
            fm.submission_id,
            fm.total_marks_awarded AS mark,
            fm.total_marks_awarded AS total_marks_awarded,
            fm.published_at,
            fm.concern_window_open,
            
            a.assessment_title as assignment_name,
            a.total_marks as total,
            
            sub.subject_name,
            sub.subject_code,
            
            so.academic_year + ' ' + so.semester AS academic_year
            
            FROM final_mark fm
            INNER JOIN submission s ON fm.submission_id = s.submission_id
            INNER JOIN assessment a ON s.assessment_id = a.assessment_id
            INNER JOIN subject_offering so ON a.offering_id = so.offering_id
            INNER JOIN subject sub ON so.subject_id = sub.subject_id
            WHERE s.student_id = @student_id
            AND fm.marking_status = 'PUBLISHED'
            ORDER BY fm.published_at DESC
        `);
        
        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
    
    } catch (err) {
        console.error('Error fetching student marks:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student marks'
        });
    }
};

exports.getStats = async (req, res) => {
    try {
        const { student_id } = req.params;
        
        // Get total subjects
        const subjectsResult = await pool.request()
        .input('student_id', sql.BigInt, student_id)
        .query(`
            SELECT COUNT(DISTINCT sub.subject_id) as total_subjects
            FROM final_mark fm
            INNER JOIN submission s ON fm.submission_id = s.submission_id
            INNER JOIN assessment a ON s.assessment_id = a.assessment_id
            INNER JOIN subject_offering so ON a.offering_id = so.offering_id
            INNER JOIN subject sub ON so.subject_id = sub.subject_id
            WHERE s.student_id = @student_id
            AND fm.marking_status = 'PUBLISHED'
        `);
        
        // Get total assignments
        const assignmentsResult = await pool.request()
        .input('student_id', sql.BigInt, student_id)
        .query(`
            SELECT COUNT(*) as total_assignments
            FROM final_mark fm
            INNER JOIN submission s ON fm.submission_id = s.submission_id
            WHERE s.student_id = @student_id
            AND fm.marking_status = 'PUBLISHED'
        `);
        
        res.json({
            success: true,
            data: {
                total_subjects: subjectsResult.recordset[0]?.total_subjects || 0,
                total_assignments: assignmentsResult.recordset[0]?.total_assignments || 0
            }
        });
        
    } catch (err) {
        console.error('Error fetching student stats:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student statistics'
        });
    }
}

exports.getAllSubjects = async (req, res) => {
    try {
        const student_id = req.query.student_id;
        if (!student_id) {
            return res.status(400).json({
                success: false,
                message: "Query parameter student_id is required",
            });
        }
        const result = await pool.request()
            .input("student_id", sql.BigInt, student_id)
            .query(`
                SELECT DISTINCT 
                sub.subject_name
                FROM final_mark fm
                INNER JOIN submission s ON fm.submission_id = s.submission_id
                INNER JOIN assessment a ON s.assessment_id = a.assessment_id
                INNER JOIN subject_offering so ON a.offering_id = so.offering_id
                INNER JOIN subject sub ON so.subject_id = sub.subject_id
                WHERE s.student_id = @student_id
                AND fm.marking_status = 'PUBLISHED'
                ORDER BY sub.subject_name
            `);
        
        res.json({
            success: true,
            data: {
                subjects: result.recordset.map(r => r.subject_name)
            }
        });

    } catch (err) {
        console.error('Error fetching filters:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch filter options'
        });
    }
}

exports.getDetailsForConcernForm = async (req, res) => {
    try {
        const { submission_id } = req.query;

        //validation
        if (!submission_id || isNaN(submission_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing submission_id!'
            });
        }
    
        const result = await pool.request()
            .input('submission_id', sql.BigInt, submission_id)
            .query(`
                SELECT 
                fm.submission_id,
                fm.total_marks_awarded AS mark,
                fm.total_marks_awarded AS total_marks_awarded,
                fm.published_at,
                fm.concern_window_open,
                
                a.assessment_title as assignment_name,
                a.total_marks as total,
                
                sub.subject_name,
                sub.subject_code,
                
                so.academic_year + ' ' + so.semester AS academic_year
                
                FROM final_mark fm
                INNER JOIN submission s ON fm.submission_id = s.submission_id
                INNER JOIN assessment a ON s.assessment_id = a.assessment_id
                INNER JOIN subject_offering so ON a.offering_id = so.offering_id
                INNER JOIN subject sub ON so.subject_id = sub.subject_id
                WHERE fm.submission_id = @submission_id
                AND fm.marking_status = 'PUBLISHED'
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
        
    } catch (err) {
        console.error('Error fetching submission details:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch submission details'
        });
    }
}

//pdf export
exports.exportMarksToPDF = async (req, res) => {
    try {
        const { marks, student, filters, exportDate, summary } = req.body;
        
        // Create a new PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=my_marks_${new Date().toISOString().split('T')[0]}.pdf`);
        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // Add header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('My Academic Results', { align: 'center' });
        
        doc.moveDown();
        
        // Add student info
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`Student: ${student.name}`, { align: 'center' });
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Student ID: ${student.id} | Email: ${student.email}`, { align: 'center' });
        
        doc.moveDown();
        
        // Add report info
        doc.fontSize(10)
           .text(`Generated on: ${new Date(exportDate).toLocaleString()}`, { align: 'center' });
        
        doc.moveDown();
        
        // Add summary section
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Summary', { underline: true });
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Total Subjects: ${summary.totalSubjects}`)
           .text(`Total Assignments: ${summary.totalAssignments}`)
           .text(`Average Mark: ${summary.averageMark}%`);
        
        doc.moveDown();
        
        // Add filter information
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Applied Filters', { underline: true });
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Academic Year: ${filters.academicYear}`)
           .text(`Subject: ${filters.subject}`)
           .text(`Search Query: ${filters.search || 'None'}`)
           .text(`Sort By: ${filters.sortBy === 'none' ? 'Default' : filters.sortBy === 'high-low' ? 'Highest to Lowest' : 'Lowest to Highest'}`);
        
        doc.moveDown();
        
        // Define table columns
        const tableHeaders = ['Subject', 'Assignment', 'Mark', 'Percentage', 'Published Date'];
        const columnWidths = [120, 150, 60, 80, 100];
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
        doc.fontSize(9)
           .font('Helvetica');
        
        let currentY = startY + 25;
        
        marks.forEach((mark, index) => {
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
                doc.fontSize(9).font('Helvetica');
                currentY += 15;
            }
            
            const percentage = ((mark.mark / mark.total) * 100).toFixed(1);
            const publishedDate = mark.published_at ? new Date(mark.published_at).toLocaleDateString() : 'N/A';
            
            const rowData = [
                mark.subject_name || 'N/A',
                mark.assignment_name || 'N/A',
                `${mark.mark}/${mark.total}`,
                `${percentage}%`,
                publishedDate
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
};