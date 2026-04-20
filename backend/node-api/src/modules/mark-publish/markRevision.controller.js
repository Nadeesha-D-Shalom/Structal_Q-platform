const { pool, sql } = require("../../config/db");
const PDFDocument = require("pdfkit");

//Fetch all published marks for lecturer
exports.getPublishedMarks = async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                fm.submission_id,
                fm.total_marks_awarded as mark,
                fm.published_at,
                fm.published_by,
                fm.updated_at,
                fm.updated_by,
                
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
            WHERE fm.marking_status = 'PUBLISHED'
            ORDER BY fm.published_at DESC
        `);
        
        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
        
    } catch (err) {
        console.error('Error fetching published marks:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch published marks'
        });
    }
};

exports.getAllMarkAudits =  async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
                    SELECT * 
                    FROM mark_revision_log
                `);

        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        })
    } catch (err) {
        console.error('Error fetching mark audits:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch mark audits'
        });
    }
}

//Update a mark
exports.updateMark = async (req, res) => {
    const { submission_id, new_mark, reason, old_mark } = req.body;
    const session = req.session;
    
    try {
        const lecturer_name = session.user.name;
        
        if (!lecturer_name) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login'
            });
        }
        
        // Update the mark
        await pool.request()
            .input('submission_id', sql.BigInt, submission_id)
            .input('new_mark', sql.Decimal(5, 2), new_mark)
            .input('updated_by', sql.VarChar, lecturer_name)
            .input('updated_at', sql.DateTimeOffset, new Date())
            .query(`
                UPDATE final_mark 
                SET total_marks_awarded = @new_mark,
                    updated_by = @updated_by,
                    updated_at = @updated_at
                WHERE submission_id = @submission_id 
                AND marking_status = 'PUBLISHED'
            `);

        //insert into mark_revision_log
        await pool.request()
                .input('submission_id', sql.BigInt, submission_id)
                .input('lecturer_name', sql.VarChar, lecturer_name)
                .input('old_mark', sql.Decimal, old_mark)
                .input('new_mark', sql.Decimal, new_mark)
                .input('reason', sql.VarChar, reason)
                .input('revised_at', sql.DateTimeOffset, new Date())
                .query(`
                            INSERT INTO mark_revision_log
                            (submission_id, lecturer_name, old_mark, new_mark, revision_reason, revised_at)
                            VALUES 
                            (@submission_id, @lecturer_name, @old_mark, @new_mark, @reason, @revised_at)
                `);
        
        res.json({
            success: true,
            message: 'Mark updated successfully'
        });
        
    } catch (err) {
        console.error('Error updating mark:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update mark'
        });
    }
};

// Delete a mark
exports.deleteMark = async (req, res) => {
    const { submission_id } = req.params;
    const session = req.session;
    
    try {
        const lecturer_id = session?.user?.user_id || session?.user?.lecturer_id;
        
        if (!lecturer_id) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please login'
            });
        }
        
        // Check if mark exists
        const markExists = await pool.request()
            .input('submission_id', sql.BigInt, submission_id)
            .query(`
                SELECT id FROM final_mark
                WHERE submission_id = @submission_id AND marking_status = 'PUBLISHED'
            `);
        
        if (markExists.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Published mark not found'
            });
        }
        
        await pool.request()
            .input('submission_id', sql.BigInt, submission_id)
            .query(`
                DELETE FROM final_mark
                WHERE submission_id = @submission_id 
                AND marking_status = 'PUBLISHED'
            `);
        
        res.json({
            success: true,
            message: 'Mark deleted successfully'
        });
        
    } catch (err) {
        console.error('Error deleting mark:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete mark'
        });
    }
};

exports.generateMarksReport = async (req, res) => {
    try {
        const result = await pool.request().query(`
        SELECT 
            fm.submission_id,
            fm.total_marks_awarded AS mark,
            fm.published_at,
            fm.published_by,
            fm.updated_at,
            fm.updated_by,

            a.assessment_title AS assignment_name,
            a.total_marks AS total,

            sub.subject_name,
            sub.subject_code,

            so.academic_year + ' ' + so.semester AS academic_year

        FROM final_mark fm
        INNER JOIN submission s ON fm.submission_id = s.submission_id
        INNER JOIN assessment a ON s.assessment_id = a.assessment_id
        INNER JOIN subject_offering so ON a.offering_id = so.offering_id
        INNER JOIN subject sub ON so.subject_id = sub.subject_id
        WHERE fm.marking_status = 'PUBLISHED'
        ORDER BY fm.published_at DESC
        `);

        const marks = result.recordset;

        const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
        "Content-Disposition",
        `attachment; filename="published_marks_report_${new Date().toISOString().split("T")[0]}.pdf"`
        );

        doc.pipe(res);

        // --- Header ---
        doc.fontSize(18).font("Helvetica-Bold").text("Published Marks Report", { align: "center" });
        doc
        .fontSize(10)
        .font("Helvetica")
        .text(
            `Generated on: ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`,
            { align: "center" }
        );

        doc.moveDown(1.5);

        // --- Summary ---
        const totalCount = marks.length;
        const avgMark =
        totalCount > 0
            ? (marks.reduce((sum, m) => sum + (m.mark / m.total) * 100, 0) / totalCount).toFixed(1)
            : "N/A";

        doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Total Submissions: ${totalCount}   |   Average Score: ${avgMark}%`, { align: "center" });

        doc.moveDown(1);

        // --- Table setup ---
        const colWidths = [65, 140, 110, 55, 85, 85, 85, 85];
            const colHeaders = [
            "Sub ID",
            "Assessment",
            "Subject",
            "Marks",
            "Academic Year",
            "Published By",
            "Published Date",
            "Modified Date",
        ];
        const tableStartX = doc.page.margins.left;
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        let y = doc.y;
        const rowHeight = 22;

        const formatDate = (d) => {
        if (!d) return "N/A";
        return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        };

        // Header row
        doc.rect(tableStartX, y, totalWidth, rowHeight).fill("#3c74ff");
        let x = tableStartX;
        colHeaders.forEach((header, i) => {
        doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#ffffff")
            .text(header, x + 4, y + 7, { width: colWidths[i] - 8, ellipsis: true });
        x += colWidths[i];
        });
        y += rowHeight;

        // Data rows
        marks.forEach((m, idx) => {
        const rowBg = idx % 2 === 0 ? "#f9fafb" : "#ffffff";
        doc.rect(tableStartX, y, totalWidth, rowHeight).fill(rowBg);
        doc.rect(tableStartX, y, totalWidth, rowHeight).stroke("#edf1f5");

        const percentage = m.total > 0 ? ((m.mark / m.total) * 100).toFixed(1) : 0;
        const markColor =
            parseFloat(percentage) >= 75 ? "#10b981" : parseFloat(percentage) >= 55 ? "#3b82f6" : "#ef4444";

        const cells = [
            `SUB-${m.submission_id}`,
            m.assignment_name || "N/A",
            `${m.subject_name || ""} (${m.subject_code || ""})`,
            `${m.mark}/${m.total}`,
            m.academic_year || "N/A",
            m.published_by || "N/A",
            formatDate(m.published_at),
            m.updated_at ? formatDate(m.updated_at) : "N/A",
        ];

        x = tableStartX;
        cells.forEach((cell, i) => {
            const cellColor = i === 3 ? markColor : "#2e3b52";
            doc
            .fontSize(8)
            .font(i === 3 ? "Helvetica-Bold" : "Helvetica")
            .fillColor(cellColor)
            .text(cell, x + 4, y + 7, { width: colWidths[i] - 8, ellipsis: true });
            x += colWidths[i];
        });

        y += rowHeight;

        if (y > doc.page.height - doc.page.margins.bottom - 40) {
            doc.addPage();
            y = doc.page.margins.top;
        }
        });

        // --- Footer ---
        doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text("---- Generated by StructalQ Platform ----", tableStartX, doc.page.height - 40, {
            align: "center",
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        });

        doc.end();
    } catch (err) {
        console.error("Error generating marks report:", err);
        res.status(500).json({ success: false, message: "Failed to generate report" });
    }
}

exports.generateAuditsReport = async (req, res) => {
    try {
        const result = await pool.request().query(`
        SELECT * 
        FROM mark_revision_log
        ORDER BY revised_at DESC
        `);

        const revisions = result.recordset;

        const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
        "Content-Disposition",
        `attachment; filename="mark_revision_audit_log_${new Date().toISOString().split("T")[0]}.pdf"`
        );

        doc.pipe(res);

        // --- Header ---
        doc.fontSize(18).font("Helvetica-Bold").text("Mark Revision Audit Log Report", { align: "center" });
        doc
        .fontSize(10)
        .font("Helvetica")
        .text(
            `Generated on: ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`,
            { align: "center" }
        );

        doc.moveDown(1.5);

        // --- Summary ---
        const totalRevisions = revisions.length;
        const increases = revisions.filter((r) => r.new_mark > r.old_mark).length;
        const decreases = revisions.filter((r) => r.new_mark < r.old_mark).length;

        doc
        .fontSize(10)
        .font("Helvetica")
        .text(
            `Total Revisions: ${totalRevisions}   |   Increases: ${increases}   |   Decreases: ${decreases}`,
            { align: "center" }
        );

        doc.moveDown(1);

        const colWidths = [80, 65, 65, 65, 210, 110, 130];
        const colHeaders = ["Sub ID", "Old Mark", "New Mark", "Change", "Reason", "Revised By", "Revised Date"];
        const tableStartX = doc.page.margins.left;
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        let y = doc.y;
        const rowHeight = 22;

        const formatDate = (d) => {
        if (!d) return "N/A";
        return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        };

        const truncate = (text, max = 58) =>
        text && text.length > max ? text.substring(0, max) + "..." : text || "N/A";

        // Header row
        doc.rect(tableStartX, y, totalWidth, rowHeight).fill("#0d9488");
        let x = tableStartX;
        colHeaders.forEach((header, i) => {
        doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#ffffff")
            .text(header, x + 4, y + 7, { width: colWidths[i] - 8, ellipsis: true });
        x += colWidths[i];
        });
        y += rowHeight;

        // Data rows
        revisions.forEach((rev, idx) => {
        const rowBg = idx % 2 === 0 ? "#f9fafb" : "#ffffff";
        doc.rect(tableStartX, y, totalWidth, rowHeight).fill(rowBg);
        doc.rect(tableStartX, y, totalWidth, rowHeight).stroke("#edf1f5");

        const change = (rev.new_mark ?? 0) - (rev.old_mark ?? 0);
        const changeColor = change > 0 ? "#10b981" : change < 0 ? "#ef4444" : "#6b7280";
        const changeText = `${change > 0 ? "+" : ""}${change.toFixed(2)}`;

        const cells = [
            `SUB-${rev.submission_id}`,
            String(rev.old_mark ?? "N/A"),
            String(rev.new_mark ?? "N/A"),
            changeText,
            truncate(rev.revision_reason),   
            rev.revised_by || "N/A",         
            formatDate(rev.revised_at),     
        ];

        x = tableStartX;
        cells.forEach((cell, i) => {
            let cellColor = "#2e3b52";
            if (i === 1) cellColor = "#ef4444";
            else if (i === 2) cellColor = "#10b981";
            else if (i === 3) cellColor = changeColor;

            doc
            .fontSize(8)
            .font(i === 3 ? "Helvetica-Bold" : "Helvetica")
            .fillColor(cellColor)
            .text(cell, x + 4, y + 7, { width: colWidths[i] - 8, ellipsis: true });
            x += colWidths[i];
        });

        y += rowHeight;

        if (y > doc.page.height - doc.page.margins.bottom - 40) {
            doc.addPage();
            y = doc.page.margins.top;
        }
        });

        // --- Footer ---
        doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text("---- Generated by StructalQ Platform ----", tableStartX, doc.page.height - 40, {
            align: "center",
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        });

        doc.end();
    } catch (err) {
        console.error("Error generating audit report:", err);
        res.status(500).json({ success: false, message: "Failed to generate audit report" });
    }
}

