const sql = require('mssql');

//Suggest prirority levels for concerns
async function priorityDetector (student_id, academic_year, concern_message, submission_id) {
    try {
        let score = 0;
        const pool =  await sql.connect();
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
        } else {
            return 'Low';
        }

    } catch(err) {
        console.error(err);
    }
}

exports.createConcern = async (req, res, next) => {
    try {
        const {student_id, student_name, student_email, academic_year, concern_message, submission_id} = req.body;
        const pdfBuffer = req.file ? req.file.buffer : null; // Binary file data

        const priority = await priorityDetector(student_id, academic_year,concern_message,submission_id);
        
        const pool = await sql.connect();
        await pool.request()
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
                    VALUES (@student_id, @student_name, @student_email, @academic_year, @submission_id,  @assessment_pdf, @concern_message, @priority_level)`);
            
            res.json({ message: "Concern Created Successfully" });

    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getAllConcerns = async (req, res, next) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query(
            'SELECT * FROM mark_concern'
        );

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.updateConcern = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {concern_status, revised_by, revised_on, lecturer_comment} = req.body;

        const pool = await sql.connect();
        await pool.request()
            .input('concern_status', sql.VarChar, concern_status)
            .input('revised_by', sql.VarChar, revised_by)
            .input('revised_on', sql.DateTime, revised_on)
            .input('lecturer_comment', sql.VarChar, lecturer_comment)
            .input('concern_id', sql.Int, id)
            .query(`
                UPDATE mark_concern 
                SET 
                    concern_status = @concern_status, 
                    revised_by = @revised_by, 
                    revised_on = @revised_on, 
                    lecturer_comment = @lecturer_comment
                WHERE concern_id = @concern_id`
            );
        
            res.json({ message: "Concern Updated Successfully" });

    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.deleteConcern = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect();
        await pool.request()
            .input('concern_id', sql.Int, id)
            .query(
                'DELETE FROM mark_concern WHERE concern_id = @concern_id'  
            );

        res.json({ message: 'Concern Deleted Successfully'});

    } catch (err) {
        console.error(err);
        next(err);
    }
    
}