const { pool, poolConnect, sql } = require('../../config/db');
const notificationService = require('../notification/notification.service');
let _examSessionSchema = null;

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

function toSqlTimeValue(t) {
    const normalized = normalizeTimeForSql(t);
    if (!normalized) return null;
    const m = String(normalized).match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    const ss = Number(m[3] || 0);
    if (
        Number.isNaN(hh) || Number.isNaN(mm) || Number.isNaN(ss) ||
        hh < 0 || hh > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59
    ) {
        return null;
    }
    const d = new Date(Date.UTC(1970, 0, 1, hh, mm, ss, 0));
    return d;
}

function sanitizeText(v) {
    const s = String(v ?? '').trim();
    return s.length ? s : null;
}

async function getExamSessionSchema(poolConn) {
    if (_examSessionSchema) return _examSessionSchema;

    const colsRes = await poolConn.request().query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'exam_session'
    `);
    const cols = new Set((colsRes.recordset || []).map((r) => String(r.COLUMN_NAME).toLowerCase()));
    const has = (c) => cols.has(String(c).toLowerCase());

    _examSessionSchema = {
        sessionIdCol: has('session_id') ? 'session_id' : 'exam_session_id',
        capacityCol: has('capacity') ? 'capacity' : 'expected_students_count',
    };
    return _examSessionSchema;
}

async function resolveRoomId(poolConn, { room_id, room_name, building, location }) {
    const numericRoomId = Number(room_id);
    if (Number.isFinite(numericRoomId) && numericRoomId > 0) {
        return numericRoomId;
    }

    const roomName = sanitizeText(room_name);
    const roomBuilding = sanitizeText(building);
    const roomLocation = sanitizeText(location);
    if (!roomName) return null;

    const existing = await poolConn
        .request()
        .input('room_name', sql.NVarChar, roomName)
        .input('building', sql.NVarChar, roomBuilding)
        .input('location', sql.NVarChar, roomLocation)
        .query(`
            SELECT TOP 1 room_id
            FROM exam_room
            WHERE LOWER(LTRIM(RTRIM(ISNULL(room_name, '')))) = LOWER(LTRIM(RTRIM(@room_name)))
              AND (
                    @building IS NULL
                    OR LOWER(LTRIM(RTRIM(ISNULL(building, '')))) = LOWER(LTRIM(RTRIM(@building)))
                  )
              AND (
                    @location IS NULL
                    OR LOWER(LTRIM(RTRIM(ISNULL(floor, '')))) = LOWER(LTRIM(RTRIM(@location)))
                  )
            ORDER BY room_id DESC
        `);

    if (existing.recordset?.length) {
        return Number(existing.recordset[0].room_id);
    }

    const created = await poolConn
        .request()
        .input('room_name', sql.NVarChar, roomName)
        .input('building', sql.NVarChar, roomBuilding)
        .input('location', sql.NVarChar, roomLocation)
        .query(`
            INSERT INTO exam_room (
                room_name, building, floor, capacity, has_projector, has_ac, is_available, created_at
            )
            OUTPUT INSERTED.room_id
            VALUES (
                @room_name, @building, @location, NULL, 0, 0, 1, GETDATE()
            )
        `);

    return Number(created.recordset?.[0]?.room_id || 0) || null;
}

async function resolveSubjectId(poolConn, subjectInput) {
    const raw = sanitizeText(subjectInput);
    if (!raw) return null;

    const asNumber = Number(raw);
    if (Number.isFinite(asNumber) && asNumber > 0) {
        return asNumber;
    }

    const found = await poolConn
        .request()
        .input('subject_code', sql.NVarChar, raw)
        .input('subject_name', sql.NVarChar, raw)
        .query(`
            SELECT TOP 1 subject_id
            FROM subject
            WHERE LOWER(LTRIM(RTRIM(ISNULL(subject_code, '')))) = LOWER(LTRIM(RTRIM(@subject_code)))
               OR LOWER(LTRIM(RTRIM(ISNULL(subject_name, '')))) = LOWER(LTRIM(RTRIM(@subject_name)))
            ORDER BY subject_id DESC
        `);

    if (found.recordset?.length) {
        return Number(found.recordset[0].subject_id);
    }

    // Allow lecturer to enter a new subject code (e.g. SE2601) directly.
    const created = await poolConn
        .request()
        .input('subject_code', sql.NVarChar, raw)
        .input('subject_name', sql.NVarChar, raw)
        .query(`
            INSERT INTO subject (subject_code, subject_name, status, created_at, updated_at)
            OUTPUT INSERTED.subject_id
            VALUES (@subject_code, @subject_name, 'ACTIVE', GETDATE(), GETDATE())
        `);

    return Number(created.recordset?.[0]?.subject_id || 0) || null;
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
                et.timetable_type,
                et.academic_year,
                et.semester,
                et.section_name,
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
        const { title, description, academic_year, semester, timetable_type, section_name } = req.body;
        const created_by = req.user.user_id;
        const tt = sanitizeText(timetable_type) || 'GENERAL';
        const ay = sanitizeText(academic_year) || '2023 / 2024';
        const sem = sanitizeText(semester) || 'First Semester';
        const sec = sanitizeText(section_name);
        const resolvedTitle = sanitizeText(title) || [tt, ay, sem, sec].filter(Boolean).join(' - ');

        const result = await pool.request()
            .input('title', sql.NVarChar, resolvedTitle)
            // DB schema has no description column; keep it accepted but ignored.
            .input('academic_year', sql.NVarChar, ay)
            .input('semester', sql.NVarChar, sem)
            .input('timetable_type', sql.NVarChar, tt)
            .input('section_name', sql.NVarChar, sec)
            .input('created_by', sql.Int, created_by)
            .query(`
                INSERT INTO exam_timetable (academic_year, semester, title, timetable_type, section_name, draft_version_no, is_published, status, created_by, created_at, updated_at)
                OUTPUT INSERTED.exam_timetable_id
                VALUES (
                  COALESCE(@academic_year, '2023 / 2024'),
                  COALESCE(@semester, 'First Semester'),
                  @title,
                  @timetable_type,
                  @section_name,
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
        const { title, description, academic_year, semester, timetable_type, section_name } = req.body;

        await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, title)
            // DB schema has no description column; keep it accepted but ignored.
            .input('academic_year', sql.NVarChar, academic_year || null)
            .input('semester', sql.NVarChar, semester || null)
            .input('timetable_type', sql.NVarChar, sanitizeText(timetable_type))
            .input('section_name', sql.NVarChar, sanitizeText(section_name))
            .query(`
                UPDATE exam_timetable
                SET title = COALESCE(@title, title),
                    academic_year = COALESCE(@academic_year, academic_year),
                    semester = COALESCE(@semester, semester),
                    timetable_type = COALESCE(@timetable_type, timetable_type),
                    section_name = COALESCE(@section_name, section_name),
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
        const publishedBy = req.user?.user_id || null;

        const sessionCount = await pool
            .request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT COUNT(1) AS count
                FROM exam_session
                WHERE exam_timetable_id = @id
            `);
        if (Number(sessionCount.recordset?.[0]?.count || 0) === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot publish timetable without at least one session',
            });
        }

        const titleRow = await pool
            .request()
            .input('id', sql.Int, id)
            .query(`SELECT title FROM exam_timetable WHERE exam_timetable_id = @id`);

        await pool.request()
            .input('id', sql.BigInt, id)
            .input('published_by', sql.BigInt, publishedBy)
            .query(`
                UPDATE exam_timetable
                SET status = 'PUBLISHED',
                    is_published = 1,
                    published_at = GETDATE(),
                    published_by = COALESCE(@published_by, published_by),
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
        const schema = await getExamSessionSchema(pool);
        const tx = new sql.Transaction(pool);
        await tx.begin();
        try {
            const req = new sql.Request(tx);
            req.input('id', sql.BigInt, id);
            await req.query(`
                DELETE ect
                FROM exam_capacity_tracking ect
                JOIN exam_session es ON ect.exam_session_id = es.${schema.sessionIdCol}
                WHERE es.exam_timetable_id = @id;

                DELETE ecl
                FROM exam_conflict_log ecl
                JOIN exam_session es ON ecl.exam_session_id = es.${schema.sessionIdCol}
                WHERE es.exam_timetable_id = @id;

                DELETE enl
                FROM exam_notification_log enl
                JOIN exam_session es ON enl.exam_session_id = es.${schema.sessionIdCol}
                WHERE es.exam_timetable_id = @id;

                DELETE FROM exam_session
                WHERE exam_timetable_id = @id;

                DELETE FROM exam_timetable
                WHERE exam_timetable_id = @id;
            `);
            await tx.commit();
        } catch (e) {
            await tx.rollback();
            throw e;
        }

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
        const schema = await getExamSessionSchema(pool);

        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT 
                    es.${schema.sessionIdCol} AS session_id,
                    es.exam_timetable_id,
                    es.subject_id,
                    es.room_id,
                    es.exam_date,
                    es.start_time,
                    es.end_time,
                    es.${schema.capacityCol} AS capacity,
                    er.room_name,
                    ISNULL(er.building, '') AS room_building,
                    ISNULL(er.floor, '') AS room_location,
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
        const { subject_id, exam_date, start_time, end_time, room_id, room_name, building, location, capacity } = req.body;
        const schema = await getExamSessionSchema(pool);

        const st = normalizeTimeForSql(start_time);
        const et = normalizeTimeForSql(end_time);
        const stSql = toSqlTimeValue(st);
        const etSql = toSqlTimeValue(et);

        const resolvedSubjectId = await resolveSubjectId(pool, subject_id);
        const resolvedRoomId = await resolveRoomId(pool, { room_id, room_name, building, location });

        if (!resolvedSubjectId || !exam_date || !st || !et || !stSql || !etSql || !resolvedRoomId) {
            return res.status(400).json({
                success: false,
                error: "Valid subject (id/code), exam_date, start_time, end_time, and room details are required",
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
            .input('room_id', sql.BigInt, resolvedRoomId)
            .input('exam_date', sql.Date, exam_date)
            .input('start_time', sql.Time, stSql)
            .input('end_time', sql.Time, etSql)
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
            .input('subject_id', sql.BigInt, resolvedSubjectId)
            .input('exam_date', sql.Date, exam_date)
            .input('start_time', sql.Time, stSql)
            .input('end_time', sql.Time, etSql)
            .input('room_id', sql.BigInt, resolvedRoomId)
            .input('capacity', sql.Int, capacity)
            .query(`
                INSERT INTO exam_session (exam_timetable_id, subject_id, exam_date, start_time, end_time, room_id, ${schema.capacityCol}, created_at, updated_at)
                OUTPUT INSERTED.${schema.sessionIdCol} AS session_id
                VALUES (@exam_timetable_id, @subject_id, @exam_date, @start_time, @end_time, @room_id, @capacity, GETDATE(), GETDATE())
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
        const { subject_id, exam_date, start_time, end_time, room_id, room_name, building, location, capacity } = req.body;
        const schema = await getExamSessionSchema(pool);

        const st = normalizeTimeForSql(start_time);
        const et = normalizeTimeForSql(end_time);
        const stSql = toSqlTimeValue(st);
        const etSql = toSqlTimeValue(et);

        const resolvedSubjectId = await resolveSubjectId(pool, subject_id);
        const resolvedRoomId = await resolveRoomId(pool, { room_id, room_name, building, location });

        if (!resolvedSubjectId || !exam_date || !st || !et || !stSql || !etSql || !resolvedRoomId) {
            return res.status(400).json({
                success: false,
                error: "Valid subject (id/code), exam_date, start_time, end_time, and room details are required",
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
                `SELECT CONVERT(VARCHAR(10), exam_date, 23) AS exam_date FROM exam_session WHERE ${schema.sessionIdCol} = @sessionId`
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
            .input('room_id', sql.BigInt, resolvedRoomId)
            .input('exam_date', sql.Date, exam_date)
            .input('start_time', sql.Time, stSql)
            .input('end_time', sql.Time, etSql)
            .query(`
                SELECT 1 FROM exam_session
                WHERE room_id = @room_id AND exam_date = @exam_date
                AND ${schema.sessionIdCol} <> @sessionId
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
            .input('subject_id', sql.BigInt, resolvedSubjectId)
            .input('exam_date', sql.Date, exam_date)
            .input('start_time', sql.Time, stSql)
            .input('end_time', sql.Time, etSql)
            .input('room_id', sql.BigInt, resolvedRoomId)
            .input('capacity', sql.Int, capacity)
            .query(`
                UPDATE exam_session
                SET subject_id = @subject_id, exam_date = @exam_date, start_time = @start_time,
                    end_time = @end_time, room_id = @room_id, ${schema.capacityCol} = @capacity, updated_at = GETDATE()
                WHERE ${schema.sessionIdCol} = @sessionId
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
        const schema = await getExamSessionSchema(pool);

        await pool.request()
            .input('sessionId', sql.BigInt, sessionId)
            .query(`
                DELETE FROM exam_capacity_tracking WHERE exam_session_id = @sessionId;
                DELETE FROM exam_conflict_log WHERE exam_session_id = @sessionId;
                DELETE FROM exam_notification_log WHERE exam_session_id = @sessionId;
                DELETE FROM exam_session
                WHERE ${schema.sessionIdCol} = @sessionId
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
        const ttColsRes = await pool.request().query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'exam_timetable'
        `);
        const ttCols = new Set((ttColsRes.recordset || []).map((r) => String(r.COLUMN_NAME).toLowerCase()));
        const has = (c) => ttCols.has(String(c).toLowerCase());
        const academicYearExpr = has('academic_year') ? "ISNULL(et.academic_year, '')" : "''";
        const semesterExpr = has('semester') ? "ISNULL(et.semester, '')" : "''";
        const specializationExpr = has('section_name') ? "ISNULL(et.section_name, '')" : "''";
        const typeExpr = has('timetable_type') ? "ISNULL(et.timetable_type, '')" : "''";
        const publishedAtExpr = has('published_at') ? "et.published_at" : "NULL";
        const statusExpr = has('status') ? "et.status = 'PUBLISHED'" : "ISNULL(et.is_published, 0) = 1";

        const result = await pool.request().query(`
            SELECT 
                et.exam_timetable_id,
                et.title AS timetable_title,
                ${academicYearExpr} AS academic_year,
                ${semesterExpr} AS semester,
                ${specializationExpr} AS specialization,
                ${typeExpr} AS timetable_type,
                ${publishedAtExpr} AS published_at,
                es.exam_date,
                es.start_time,
                es.end_time,
                er.room_name,
                ISNULL(er.building, '') AS building_name,
                ISNULL(er.floor, '') AS floor_name,
                s.subject_code,
                s.subject_name
            FROM exam_session es
            JOIN exam_room er ON es.room_id = er.room_id
            JOIN subject s ON es.subject_id = s.subject_id
            JOIN exam_timetable et ON es.exam_timetable_id = et.exam_timetable_id
            WHERE ${statusExpr}
            ORDER BY et.exam_timetable_id DESC, es.exam_date, es.start_time
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