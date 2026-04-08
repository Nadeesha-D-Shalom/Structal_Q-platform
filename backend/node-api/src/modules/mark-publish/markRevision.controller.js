const { pool, sql } = require("../../config/db");

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
        // Get lecturer_name from session
        //const lecturer_name = session?.user?.user_name || session?.lecturer_name;
        const lecturer_name= "Dr Robert Fox";
        
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
        // Get lecturer_id from session
        // const lecturer_id = session?.user?.user_id || session?.lecturer_id;
        
        // if (!lecturer_id) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Unauthorized: Please login'
        //     });
        // }
        
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

