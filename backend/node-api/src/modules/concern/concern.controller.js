const { pool, sql } = require("../../config/db");

//Suggest prirority levels for concerns
async function priorityDetector (student_id, academic_year, concern_message, submission_id) {
    try {
        let score = 0;
        const result = await pool.request()
            .input('student_id', sql.VarChar, student_id)
            .input('submission_id', sql.VarChar, submission_id)
            .query(
                `
                    SELECT total_marks_awarded 
                    FROM final_mark
                    WHERE student_id = @student_id AND submission_id = @submission_id;
                `
            );   

        const keywordWeights = {
            'medical issue': 30,
            'emergency': 30,
            'calculation error': 15,
            'wrong': 10,
            'review': 5
        }

        const finalMark = result.recordset[0]?.total_marks_awarded;

        const lowerMsg = concern_message.toLowerCase();
        Object.keys(keywordWeights).forEach(word => {
            if (lowerMsg.includes(word)) score += keywordWeights[word];
        });

        if (academic_year == 'Y3S1' || academic_year == 'Y3S2') {
            score += 15;
        } else if (academic_year == 'Y4S1' || academic_year == 'Y4S2')  {
            score += 25;
        }

        if (lowerMsg.includes('calculation error') && (finalMark > 40 && finalMark < 45)) {
            score += 20;
        }

        if (score > 70) {
            return 'High';
        } else if (score > 50) {
            return 'Medium';
        }
        return 'Low';
    } catch(err) {
        console.error(err);
        return 'Low';
    }
}

exports.createConcern = async (req, res, next) => {
    try {
        const {student_id, student_name, student_email, academic_year, concern_message, submission_id} = req.body;
        const pdfBuffer = req.file ? req.file.buffer : null; // Binary file data

        const priority = await priorityDetector(student_id, academic_year,concern_message,submission_id);
        
        const result = await pool.request()
            .input('student_id', sql.VarChar, student_id)
            .input('student_name', sql.VarChar, student_name)
            .input('student_email', sql.VarChar, student_email)
            .input('academic_year', sql.VarChar, academic_year)
            .input('submission_id', sql.VarChar, submission_id)
            .input('assessment_pdf', sql.VarBinary(sql.MAX), pdfBuffer)
            .input('concern_message', sql.NVarChar(sql.MAX), concern_message)
            .input('priority_level', sql.VarChar, priority)
            .query(`INSERT INTO mark_concern 
                    (student_id, student_name, student_email, academic_year, submission_id, assessment_pdf, concern_message, priority_level) 
                    OUTPUT inserted.id
                    VALUES (@student_id, @student_name, @student_email, @academic_year, @submission_id,  @assessment_pdf, @concern_message, @priority_level)`);
            
        // Generate specific ids for concerns
        const numericId = result.recordset[0].id;
        const formattedId = `CO-${String(numericId).padStart(4, '0')}`;
        await pool.request()
            .input('concern_id', sql.VarChar, formattedId)
            .input('id', sql.Int, numericId)
            .query(`
                UPDATE mark_concern
                SET concern_id = @concern_id
                WHERE id = @id
            `);
    
        res.json({ success: true, message: "Concern created successfully." });

    } catch (err) {
        console.error(err);
        next(err);
    }
}

function mapConcernRow(r) {
    const mark = r.total_marks_awarded != null ? Number(r.total_marks_awarded) : null;
    return {
        id: r.concern_id || String(r.id),
        dbId: r.id,
        numericId: r.id,
        student: r.student_name,
        student_email: r.student_email,
        student_id: r.student_id,
        assignment: r.assignment_name || "—",
        subject: r.subject_name || "—",
        subject_code: r.subject_code || "",
        originalMark: mark != null ? mark : 0,
        status: r.concern_status || "Pending",
        priority: r.priority_level || "Low",
        date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
        message: r.concern_message || "",
        submission_id: r.submission_id,
        response: r.lecturer_comment || null,
        responseDate: r.revised_on ? new Date(r.revised_on).toLocaleDateString() : null,
        revisedMark: r.revised_mark != null ? Number(r.revised_mark) : null,
    };
}

exports.getAllConcerns = async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                mc.*,
                a.assessment_title AS assignment_name,
                sub.subject_name,
                sub.subject_code,
                (SELECT TOP 1 fm.total_marks_awarded FROM final_mark fm WHERE fm.submission_id = s.submission_id) AS total_marks_awarded
            FROM mark_concern mc
            LEFT JOIN submission s ON CAST(mc.submission_id AS NVARCHAR(64)) = CAST(s.submission_id AS NVARCHAR(64))
            LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
            LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
            LEFT JOIN subject sub ON so.subject_id = sub.subject_id
            ORDER BY mc.id DESC
        `);

        const data = (result.recordset || []).map(mapConcernRow);
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getConcernsByStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const result = await pool
            .request()
            .input("student_id", sql.VarChar, String(studentId))
            .query(`
                SELECT 
                    mc.*,
                    a.assessment_title AS assignment_name,
                    sub.subject_name,
                    sub.subject_code,
                    (SELECT TOP 1 fm.total_marks_awarded FROM final_mark fm WHERE fm.submission_id = s.submission_id) AS total_marks_awarded
                FROM mark_concern mc
                LEFT JOIN submission s ON CAST(mc.submission_id AS NVARCHAR(64)) = CAST(s.submission_id AS NVARCHAR(64))
                LEFT JOIN assessment a ON s.assessment_id = a.assessment_id
                LEFT JOIN subject_offering so ON a.offering_id = so.offering_id
                LEFT JOIN subject sub ON so.subject_id = sub.subject_id
                WHERE CAST(mc.student_id AS NVARCHAR(64)) = @student_id
                ORDER BY mc.id DESC
            `);

        const data = (result.recordset || []).map(mapConcernRow);
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// Backward-compatible alias for older route naming.
exports.getConcernsForSpecificStudent = exports.getConcernsByStudent;

exports.updateConcern = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { concern_status, revised_by, revised_on, lecturer_comment } = req.body;

        await pool
            .request()
            .input("concern_status", sql.VarChar, concern_status)
            .input("revised_by", sql.VarChar, revised_by)
            .input("revised_on", sql.DateTime, revised_on || new Date())
            .input("lecturer_comment", sql.NVarChar(sql.MAX), lecturer_comment)
            .input("id", sql.Int, id)
            .query(`
                UPDATE mark_concern 
                SET 
                    concern_status = @concern_status, 
                    revised_by = @revised_by, 
                    revised_on = @revised_on, 
                    lecturer_comment = @lecturer_comment
                WHERE id = @id
            `);

        res.json({ success: true, message: "Concern Updated Successfully" });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.deleteConcern = async (req, res, next) => {
    const { id } = req.params;
    try {
        await pool.request().input("id", sql.Int, id).query("DELETE FROM mark_concern WHERE id = @id");

        res.json({ success: true, message: "Concern Deleted Successfully" });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// Keep route registration valid until PDF export implementation is added.
exports.exportConcernsToPDF = async (_req, res) => {
    res.status(501).json({
        success: false,
        message: "Export PDF is not implemented yet."
    });
};