const {sql, connectDB} = require('../config/db');

exports.createConcern = async (req, res) => {
    try {
        const {student_id, student_name, student_email, academic_yr, concern_message} = req.body;
        const pdfBuffer = req.file ? req.file.buffer : null; // Binary file data

        let priority = 'LOW'; //priority ditection by keywords function will develop in nxt updates
        
        const db = await connectDB;
        await db.request()
            .input('student_id', sql.VarChar, student_id)
            .input('student_name', sql.VarChar, student_name)
            .input('student_email', sql.VarChar, student_email)
            .input('academic_year', sql.VarChar, academic_yr)
            .input('assesment_pdf', sql.VarBinary(sql.MAX), pdfBuffer)
            .input('concern_message', sql.NVarChar(sql.MAX), concern_message)
            .input('priority', sql.VarChar, priority)
            .query(`INSERT INTO mark_concern 
                    (student_id, student_name, student_email, academic_year, assessment_pdf, concern_message, priority_level) 
                    VALUES (@student_id, @student_name, @student_email, @academic_year, @assesment_pdf, @concern_message, @priority)`);
            
            res.json({ message: "Concern Updated Successfully" });

    } catch (err) {
        res.status(500).json({error: err.nessage});
    }
}