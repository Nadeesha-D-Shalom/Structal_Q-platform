const { pool, poolConnect, sql } = require('../../config/db');
const notificationService = require('../notification/notification.service');

function normalizeTimeForSql(t) {
    if (t == null || t === '') return null;
    const s = String(t).trim();
    if (s.length === 5 && s[2] === ':') return `${s}:00`;
    return s;
}

/** Returns true if examDateStr (YYYY-MM-DD) is strictly before today in local server TZ. */
function isExamDateInPast(examDateStr) {
    const m = String(examDateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return true;
    const exam = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);
    return exam < today;
}

function parseTimeToMinutes(t) {
    const p = String(t || '')
        .trim()
        .split(':')
        .map((x) => parseInt(x, 10));
    if (p.length < 2 || p.some((n) => Number.isNaN(n))) return null;
    return p[0] * 60 + p[1];
}

exports.getExamRooms = async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT
                room_id,
                room_name,
                ISNULL(building, '') AS building,
                ISNULL(capacity, 0) AS capacity
            FROM exam_room
            ORDER BY room_name
        `);
        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

exports.getAllTimetables = async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT 
                et.exam_timetable_id,
                et.title,
                et.status,
                et.created_at,
                et.published_at,
                u.first_name + ' ' + u.last_name AS created_by_name
            FROM exam_timetable et
            JOIN users u ON et.created_by = u.user_id
            ORDER BY et.created_at DESC
        `);
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.createTimetable = async (req, res) => {
    try {
        await poolConnect;
        const { title, description, academic_year, semester } = req.body;
        const created_by = req.user.user_id;

        const result = await pool.request()
            .input('title', sql.NVarChar, title)
            // DB schema has no description column; keep it accepted but ignored.
            .input('academic_year', sql.NVarChar, academic_year || null)
            .input('semester', sql.NVarChar, semester || null)
            .input('created_by', sql.Int, created_by)
            .query(`
                INSERT INTO exam_timetable (academic_year, semester, title, draft_version_no, is_published, status, created_by, created_at, updated_at)
                OUTPUT INSERTED.exam_timetable_id
                VALUES (
                  COALESCE(@academic_year, '2023 / 2024'),
                  COALESCE(@semester, 'First Semester'),
                  @title,
                  1,
                  0,
                  'DRAFT',
                  @created_by,
                  GETDATE(),
                  GETDATE()
                )
            `);

        res.json({
            success: true,
            message: "Timetable created successfully",
            timetable_id: result.recordset[0].exam_timetable_id
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.getTimetableById = async (req, res) => {
    try {
        await poolConnect;
        const { id } = req.params;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    et.*,
                    u.first_name + ' ' + u.last_name AS created_by_name
                FROM exam_timetable et
                JOIN users u ON et.created_by = u.user_id
                WHERE et.exam_timetable_id = @id
            `);

        if (!result.recordset.length) {
            return res.status(404).json({
                success: false,
                error: "Timetable not found"
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.updateTimetable = async (req, res) => {
    try {
        await poolConnect;
        const { id } = req.params;
        const { title, description, academic_year, semester } = req.body;

        await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, title)
            // DB schema has no description column; keep it accepted but ignored.
            .input('academic_year', sql.NVarChar, academic_year || null)
            .input('semester', sql.NVarChar, semester || null)
            .query(`
                UPDATE exam_timetable
                SET title = COALESCE(@title, title),
                    academic_year = COALESCE(@academic_year, academic_year),
                    semester = COALESCE(@semester, semester),
                    updated_at = GETDATE()
                WHERE exam_timetable_id = @id
            `);

        res.json({
            success: true,
            message: "Timetable updated successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.publishTimetable = async (req, res) => {
    try {
        await poolConnect;
        const { id } = req.params;

        const titleRow = await pool
            .request()
            .input('id', sql.Int, id)
            .query(`SELECT title FROM exam_timetable WHERE exam_timetable_id = @id`);

        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE exam_timetable
                SET status = 'PUBLISHED',
                    is_published = 1,
                    published_at = GETDATE(),
                    updated_at = GETDATE()
                WHERE exam_timetable_id = @id
            `);

        const ttitle = titleRow.recordset?.[0]?.title || 'Exam timetable';
        try {
            await notificationService.notifyAllActiveStudents(
                'Exam timetable published',
                `The exam timetable "${ttitle}" has been published. Open Timetable to view sessions.`,
                'EXAM_TIMETABLE_PUBLISHED'
            );
        } catch (e) {
            console.warn('[publishTimetable] notifications:', e.message);
        }

        res.json({
            success: true,
            message: "Timetable published successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.deleteTimetable = async (req, res) => {
    try {
        await poolConnect;
        const { id } = req.params;

        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM exam_timetable
                WHERE exam_timetable_id = @id
            `);

        res.json({
            success: true,
            message: "Timetable deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.getSessions = async (req, res) => {
    try {
        await poolConnect;
        const { id } = req.params;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    es.*,
                    er.room_name,
                    s.subject_code,
                    s.subject_name
                FROM exam_session es
                JOIN exam_room er ON es.room_id = er.room_id
                JOIN subject s ON es.subject_id = s.subject_id
                WHERE es.exam_timetable_id = @id
                ORDER BY es.exam_date, es.start_time
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.createSession = async (req, res) => {
    try {
        await poolConnect;
        const { id } = req.params;
        const { subject_id, exam_date, start_time, end_time, room_id, capacity } = req.body;

        const st = normalizeTimeForSql(start_time);
        const et = normalizeTimeForSql(end_time);

        if (!subject_id || !exam_date || !st || !et || !room_id) {
            return res.status(400).json({
                success: false,
                error: "subject_id, exam_date, start_time, end_time, and room_id are required",
            });
        }

        if (isExamDateInPast(exam_date)) {
            return res.status(400).json({
                success: false,
                error: "Exam date cannot be in the past",
            });
        }

        const sm = parseTimeToMinutes(st);
        const em = parseTimeToMinutes(et);
        if (sm == null || em == null || em <= sm) {
            return res.status(400).json({
                success: false,
                error: "End time must be after start time",
            });
        }

        if (!Number.isFinite(Number(capacity)) || Number(capacity) < 1) {
            return res.status(400).json({
                success: false,
                error: "capacity must be a positive number",
            });
        }

        // Check conflicts (same room / date / overlapping interval)
        const conflict = await pool.request()
            .input('room_id', sql.BigInt, room_id)
            .input('exam_date', sql.Date, exam_date)
            .input('start_time', sql.Time, st)
            .input('end_time', sql.Time, et)
            .query(`
                SELECT 1 FROM exam_session
                WHERE room_id = @room_id AND exam_date = @exam_date
                AND (start_time < @end_time AND end_time > @start_time)
            `);

        if (conflict.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                error: "Time conflict detected for this room",
            });
        }

        const result = await pool.request()
            .input('exam_timetable_id', sql.BigInt, id)
            .input('subject_id', sql.BigInt, subject_id)
            .input('exam_date', sql.Date, exam_date)
            .input('start_time', sql.Time, st)
            .input('end_time', sql.Time, et)
            .input('room_id', sql.BigInt, room_id)
            .input('capacity', sql.Int, capacity)
            .query(`
                INSERT INTO exam_session (exam_timetable_id, subject_id, exam_date, start_time, end_time, room_id, capacity)
                OUTPUT INSERTED.session_id
                VALUES (@exam_timetable_id, @subject_id, @exam_date, @start_time, @end_time, @room_id, @capacity)
            `);

        res.json({
            success: true,
            message: "Session created successfully",
            session_id: result.recordset[0].session_id
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.updateSession = async (req, res) => {
    try {
        await poolConnect;
        const { sessionId } = req.params;
        const { subject_id, exam_date, start_time, end_time, room_id, capacity } = req.body;

        const st = normalizeTimeForSql(start_time);
        const et = normalizeTimeForSql(end_time);

        if (!subject_id || !exam_date || !st || !et || !room_id) {
            return res.status(400).json({
                success: false,
                error: "subject_id, exam_date, start_time, end_time, and room_id are required",
            });
        }

        const sm = parseTimeToMinutes(st);
        const em = parseTimeToMinutes(et);
        if (sm == null || em == null || em <= sm) {
            return res.status(400).json({
                success: false,
                error: "End time must be after start time",
            });
        }

        if (!Number.isFinite(Number(capacity)) || Number(capacity) < 1) {
            return res.status(400).json({
                success: false,
                error: "capacity must be a positive number",
            });
        }

        // Allow editing sessions that already have a past exam date; block *new* past dates on update.
        const existing = await pool.request()
            .input('sessionId', sql.BigInt, sessionId)
            .query(
                `SELECT CONVERT(VARCHAR(10), exam_date, 23) AS exam_date FROM exam_session WHERE session_id = @sessionId`
            );
        const prevStr = String(existing.recordset?.[0]?.exam_date || '').slice(0, 10);
        const incoming = String(exam_date).slice(0, 10);
        if (incoming !== prevStr && isExamDateInPast(exam_date)) {
            return res.status(400).json({
                success: false,
                error: 'Exam date cannot be in the past',
            });
        }

        const conflict = await pool.request()
            .input('sessionId', sql.BigInt, sessionId)
            .input('room_id', sql.BigInt, room_id)
            .input('exam_date', sql.Date, exam_date)
            .input('start_time', sql.Time, st)
            .input('end_time', sql.Time, et)
            .query(`
                SELECT 1 FROM exam_session
                WHERE room_id = @room_id AND exam_date = @exam_date
                AND session_id <> @sessionId
                AND (start_time < @end_time AND end_time > @start_time)
            `);

        if (conflict.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                error: "Time conflict detected for this room",
            });
        }

        await pool.request()
            .input('sessionId', sql.BigInt, sessionId)
            .input('subject_id', sql.BigInt, subject_id)
            .input('exam_date', sql.Date, exam_date)
            .input('start_time', sql.Time, st)
            .input('end_time', sql.Time, et)
            .input('room_id', sql.BigInt, room_id)
            .input('capacity', sql.Int, capacity)
            .query(`
                UPDATE exam_session
                SET subject_id = @subject_id, exam_date = @exam_date, start_time = @start_time,
                    end_time = @end_time, room_id = @room_id, capacity = @capacity
                WHERE session_id = @sessionId
            `);

        res.json({
            success: true,
            message: "Session updated successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        await poolConnect;
        const { sessionId } = req.params;

        await pool.request()
            .input('sessionId', sql.BigInt, sessionId)
            .query(`
                DELETE FROM exam_session
                WHERE session_id = @sessionId
            `);

        res.json({
            success: true,
            message: "Session deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.getConflicts = async (req, res) => {
    try {
        await poolConnect;
        const { id } = req.params;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT * FROM exam_conflict_log
                WHERE exam_timetable_id = @id
                ORDER BY created_at DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.getStudentTimetableView = async (req, res) => {
    try {
        await poolConnect;

        const result = await pool.request().query(`
            SELECT 
                es.exam_date,
                es.start_time,
                es.end_time,
                er.room_name,
                s.subject_code,
                s.subject_name
            FROM exam_session es
            JOIN exam_room er ON es.room_id = er.room_id
            JOIN subject s ON es.subject_id = s.subject_id
            JOIN exam_timetable et ON es.exam_timetable_id = et.exam_timetable_id
            WHERE et.status = 'PUBLISHED'
            ORDER BY es.exam_date, es.start_time
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};