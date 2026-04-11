const { pool, sql } = require("../../config/db");

exports.getMarks = async (req, res) => {
    try {
        const { student_id } = req.params;
        
        const result = await pool.request()
        .input('student_id', sql.BigInt, student_id)
        .query(`
            SELECT 
            fm.submission_id,
            fm.total_marks_awarded as mark,
            fm.published_at,
            fm.concern_window_open,
            
            a.assessment_title as assignment_name,
            a.total_marks as total,
            
            sub.subject_name,
            sub.subject_code,
            
            so.academic_year
            
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
        const result = await pool.request()
            .input('student_id', sql.BigInt, student_id)
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
        const { submission_id } = req.params;
    
        const result = await pool.request()
            .input('submission_id', sql.BigInt, submission_id)
            .query(`
                SELECT 
                fm.submission_id,
                fm.total_marks_awarded as mark,
                fm.published_at,
                fm.concern_window_open,
                
                a.assessment_title as assignment_name,
                a.total_marks as total,
                
                sub.subject_name,
                sub.subject_code,
                
                so.academic_year
                
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