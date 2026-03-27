const sql    = require('mssql');
const config = require('../../config/db');

let sendEmail = async () => {};
try {
    sendEmail = require('../../services/emailService').sendEmail;
} catch (_) {
    console.warn('[evalSchedule] emailService not found — email notifications disabled');
}

// ───────── HELPERS ─────────
const toSqlTime = (t) => {
    if (!t) return null;
    const parts = t.split(':');
    if (parts.length === 2) t += ':00';
    return t;
};

const toMinutes = (t) => {
    if (!t) return 0;
    const parts = String(t).split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
};

const toTime = (mins) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:00`;

// ───────── ASSESSMENTS ─────────

// FIX: was duplicated and misplaced under SCHEDULE MANAGEMENT section
exports.getAllAssessments = async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .query(`SELECT assessment_id, assessment_title FROM Assessments ORDER BY assessment_title`);
        res.json(result.recordset);
    } catch (err) {
        console.error('[getAllAssessments]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── LOCATION MANAGEMENT ─────────

exports.createLocation = async (req, res) => {
    try {
        const { location_name, building_name, room_number, capacity, available_from, available_to } = req.body;

        if (!location_name?.trim() || !building_name?.trim() || !room_number?.trim()) {
            return res.status(400).json({ message: 'location_name, building_name, and room_number are required.' });
        }

        const fromTime = toSqlTime(available_from);
        const toSqlT   = toSqlTime(available_to);

        if (!fromTime || !toSqlT) {
            return res.status(400).json({ message: 'Invalid available_from or available_to time.' });
        }

        const pool = await sql.connect(config);
        await pool.request()
            .input('location_name',  sql.VarChar(255), location_name.trim())
            .input('building_name',  sql.VarChar(255), building_name.trim())
            .input('room_number',    sql.VarChar(50),  room_number.trim())
            .input('capacity',       sql.Int,          capacity ? Number(capacity) : null)
            .input('available_from', sql.Time,         fromTime)
            .input('available_to',   sql.Time,         toSqlT)
            .input('status',         sql.VarChar(20),  'ACTIVE')
            .query(`
                INSERT INTO evaluation_location
                    (location_name, building_name, room_number, capacity, available_from, available_to, status)
                VALUES
                    (@location_name, @building_name, @room_number, @capacity, @available_from, @available_to, @status)
            `);

        res.status(201).json({ message: 'Location created' });
    } catch (err) {
        console.error('[createLocation]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAllLocations = async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT
                    location_id,
                    location_name,
                    building_name,
                    room_number,
                    capacity,
                    CONVERT(VARCHAR, available_from, 108) AS available_from,
                    CONVERT(VARCHAR, available_to,   108) AS available_to,
                    status
                FROM evaluation_location
                ORDER BY location_name
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('[getAllLocations]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'Invalid location ID.' });

        const { location_name, building_name, room_number, capacity, available_from, available_to } = req.body;

        if (!location_name?.trim() || !building_name?.trim() || !room_number?.trim()) {
            return res.status(400).json({ message: 'location_name, building_name, and room_number are required.' });
        }

        const fromTime = toSqlTime(available_from);
        const toSqlT   = toSqlTime(available_to);

        if (!fromTime || !toSqlT) {
            return res.status(400).json({ message: 'Invalid available_from or available_to time.' });
        }

        const pool  = await sql.connect(config);
        const check = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT location_id FROM evaluation_location WHERE location_id = @id`);

        if (!check.recordset.length) return res.status(404).json({ message: 'Location not found.' });

        await pool.request()
            .input('id',             sql.Int,          id)
            .input('location_name',  sql.VarChar(255), location_name.trim())
            .input('building_name',  sql.VarChar(255), building_name.trim())
            .input('room_number',    sql.VarChar(50),  room_number.trim())
            .input('capacity',       sql.Int,          capacity ? Number(capacity) : null)
            .input('available_from', sql.Time,         fromTime)
            .input('available_to',   sql.Time,         toSqlT)
            .query(`
                UPDATE evaluation_location SET
                    location_name  = @location_name,
                    building_name  = @building_name,
                    room_number    = @room_number,
                    capacity       = @capacity,
                    available_from = @available_from,
                    available_to   = @available_to
                WHERE location_id = @id
            `);

        res.json({ message: 'Location updated' });
    } catch (err) {
        console.error('[updateLocation]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteLocation = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'Invalid location ID.' });

        const pool = await sql.connect(config);

        const check = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT COUNT(*) AS cnt
                FROM evaluation_schedule
                WHERE location_id = @id AND status IN ('DRAFT', 'PUBLISHED')
            `);

        if (check.recordset[0].cnt > 0) {
            return res.status(400).json({ message: 'Cannot delete: location is used in active schedules.' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query(`UPDATE evaluation_location SET status = 'INACTIVE' WHERE location_id = @id`);

        res.json({ message: 'Location deactivated', status: 'INACTIVE' });
    } catch (err) {
        console.error('[deleteLocation]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── SCHEDULE MANAGEMENT ─────────

exports.createSchedule = async (req, res) => {
    const {
        assessment_id,
        location_id,
        schedule_title,
        date,
        start_time,
        end_time,
        duration_per_group_minutes,
        buffer_minutes,
        total_groups,
        created_by
    } = req.body;

    try {
        const pool = await sql.connect(config);

        // Check for location conflicts
        const conflict = await pool.request()
            .input('location_id', sql.Int,  location_id)
            .input('date',        sql.Date, date)
            .input('start_time',  sql.Time, start_time)
            .input('end_time',    sql.Time, end_time)
            .query(`
                SELECT COUNT(*) AS cnt
                FROM evaluation_schedule
                WHERE location_id = @location_id
                  AND date = @date
                  AND status <> 'CANCELLED'
                  AND (start_time < @end_time AND end_time > @start_time)
            `);

        if (conflict.recordset[0].cnt > 0) {
            return res.status(409).json({ message: 'Location conflict detected for the selected date and time.' });
        }

        // Insert schedule
        const insert = await pool.request()
            .input('assessment_id',             sql.Int,           assessment_id)
            .input('location_id',               sql.Int,           location_id)
            .input('schedule_title',            sql.NVarChar(200), schedule_title)
            .input('date',                      sql.Date,          date)
            .input('start_time',                sql.Time,          start_time)
            .input('end_time',                  sql.Time,          end_time)
            .input('duration_per_group_minutes',sql.Int,           duration_per_group_minutes)
            .input('buffer_minutes',            sql.Int,           buffer_minutes)
            .input('total_groups',              sql.Int,           total_groups)
            .input('created_by',                sql.Int,           created_by)
            .query(`
                INSERT INTO evaluation_schedule
                (assessment_id, location_id, schedule_title, date, start_time, end_time,
                 duration_per_group_minutes, buffer_minutes, total_groups, created_by, status, draft_version_no)
                VALUES
                (@assessment_id, @location_id, @schedule_title, @date, @start_time, @end_time,
                 @duration_per_group_minutes, @buffer_minutes, @total_groups, @created_by, 'DRAFT', 1);

                SELECT SCOPE_IDENTITY() AS scheduleId;
            `);

        const scheduleId = insert.recordset[0].scheduleId;

        // Auto-generate time slots
        const startMins = toMinutes(start_time);
        const slotSize  = Number(duration_per_group_minutes) + Number(buffer_minutes);
        const count     = Number(total_groups);

        for (let i = 0; i < count; i++) {
            const slotStart = startMins + i * slotSize;
            const slotEnd   = slotStart + Number(duration_per_group_minutes);

            // FIX: buffer_applied is a BIT column — store 1 or 0, not the minute count
            await pool.request()
                .input('schedule_id',      sql.Int,         scheduleId)
                .input('slot_sequence_no', sql.Int,         i + 1)
                .input('slot_start_time',  sql.VarChar(8),  toTime(slotStart))
                .input('slot_end_time',    sql.VarChar(8),  toTime(slotEnd))
                .input('buffer_applied',   sql.Bit,         i < count - 1 ? 1 : 0)
                .input('slot_status',      sql.VarChar(20), 'AVAILABLE')
                .query(`
                    INSERT INTO evaluation_slot
                        (evaluation_schedule_id, slot_sequence_no, slot_start_time,
                         slot_end_time, buffer_applied, slot_status)
                    VALUES
                        (@schedule_id, @slot_sequence_no, @slot_start_time,
                         @slot_end_time, @buffer_applied, @slot_status)
                `);
        }

        res.json({ scheduleId });
    } catch (err) {
        console.error('[createSchedule]', err);
        res.status(500).json({ message: 'Failed to create schedule.', error: err.message });
    }
};

// FIX: removed broken joins on a.offering_id (column does not exist in Assessments table)
exports.getSchedules = async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                es.evaluation_schedule_id,
                es.schedule_title,
                es.date,
                CONVERT(VARCHAR, es.start_time, 108) AS start_time,
                CONVERT(VARCHAR, es.end_time,   108) AS end_time,
                es.total_groups,
                es.status,
                es.draft_version_no,
                es.published_by,
                es.published_at,
                ISNULL(a.assessment_title, '—') AS assessment_name,
                ISNULL(el.location_name,   '—') AS location_name,
                ISNULL(el.room_number,     '—') AS room_number,
                (
                    SELECT COUNT(*)
                    FROM evaluation_slot sl
                    WHERE sl.evaluation_schedule_id = es.evaluation_schedule_id
                      AND sl.slot_status = 'ASSIGNED'
                ) AS assigned_count
            FROM evaluation_schedule es
            LEFT JOIN evaluation_location el ON es.location_id   = el.location_id
            LEFT JOIN Assessments          a  ON es.assessment_id = a.assessment_id
            ORDER BY es.date DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('[getSchedules]', err);
        res.status(500).json({ message: 'Failed to load schedules.', error: err.message });
    }
};

exports.publishSchedule = async (req, res) => {
    try {
        const scheduleId  = Number(req.params.id);
        const publishedBy = req.body.published_by ? Number(req.body.published_by) : null;

        if (!scheduleId) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool = await sql.connect(config);

        const check = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`SELECT evaluation_schedule_id, status FROM evaluation_schedule WHERE evaluation_schedule_id = @id`);

        if (!check.recordset.length) return res.status(404).json({ message: 'Schedule not found.' });

        const schedule = check.recordset[0];
        if (schedule.status !== 'DRAFT') {
            return res.status(400).json({ message: `Schedule is already ${schedule.status}.` });
        }

        await pool.request()
            .input('id',   sql.Int, scheduleId)
            .input('user', sql.Int, publishedBy)
            .query(`
                UPDATE evaluation_schedule
                SET status       = 'PUBLISHED',
                    is_published = 1,
                    published_at = GETDATE(),
                    published_by = @user
                WHERE evaluation_schedule_id = @id
            `);

        let emailsSent = 0;

        try {
            const students = await pool.request()
                .query(`SELECT user_id, email FROM [user] WHERE role = 'STUDENT' AND status = 'ACTIVE'`);

            for (const student of students.recordset) {
                let deliveryStatus = 'SENT';
                try {
                    await sendEmail(
                        student.email,
                        'Evaluation Schedule Published',
                        'Your evaluation schedule is now available. Please log in to view your assigned slot.'
                    );
                    emailsSent++;
                } catch (emailErr) {
                    console.error(`[publishSchedule] Email failed for ${student.email}:`, emailErr.message);
                    deliveryStatus = 'FAILED';
                }

                try {
                    await pool.request()
                        .input('sid',    sql.Int,         scheduleId)
                        .input('uid',    sql.Int,         student.user_id)
                        .input('status', sql.VarChar(20), deliveryStatus)
                        .query(`
                            INSERT INTO evaluation_email_log
                                (evaluation_schedule_id, recipient_user_id, email_type, sent_at, delivery_status, retry_count)
                            VALUES (@sid, @uid, 'SCHEDULE_PUBLISHED', GETDATE(), @status, 0)
                        `);
                } catch (logErr) {
                    console.error('[publishSchedule] Email log insert failed:', logErr.message);
                }
            }
        } catch (studentErr) {
            console.error('[publishSchedule] Failed to query students:', studentErr.message);
        }

        res.json({ message: 'Schedule published', emailsSent });

    } catch (err) {
        console.error('[publishSchedule]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.cancelSchedule = async (req, res) => {
    try {
        const scheduleId = Number(req.params.id);
        if (!scheduleId) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool = await sql.connect(config);

        const check = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`SELECT evaluation_schedule_id, status FROM evaluation_schedule WHERE evaluation_schedule_id = @id`);

        if (!check.recordset.length) return res.status(404).json({ message: 'Schedule not found.' });

        if (check.recordset[0].status === 'CANCELLED') {
            return res.status(400).json({ message: 'Schedule is already cancelled.' });
        }

        await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`UPDATE evaluation_schedule SET status = 'CANCELLED' WHERE evaluation_schedule_id = @id`);

        res.json({ message: 'Schedule cancelled' });

    } catch (err) {
        console.error('[cancelSchedule]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── SLOT + GROUP ASSIGNMENT ─────────

exports.getSlotsBySchedule = async (req, res) => {
    try {
        const scheduleId = Number(req.params.id);

        if (!scheduleId) {
            return res.status(400).json({ message: 'Missing schedule id.' });
        }

        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('schedule_id', sql.Int, scheduleId)
            .query(`
                SELECT
                    sl.evaluation_slot_id,
                    sl.evaluation_schedule_id,
                    sl.slot_sequence_no,
                    CONVERT(VARCHAR, sl.slot_start_time, 108) AS slot_start_time,
                    CONVERT(VARCHAR, sl.slot_end_time,   108) AS slot_end_time,
                    sl.buffer_applied,
                    sl.slot_status,
                    ga.group_id,
                    ga.attendance_status,
                    ga.evaluation_completed,
                    ga.remarks
                FROM evaluation_slot sl
                LEFT JOIN evaluation_group_assignment ga
                    ON ga.evaluation_slot_id = sl.evaluation_slot_id
                WHERE sl.evaluation_schedule_id = @schedule_id
                ORDER BY sl.slot_sequence_no
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('[getSlotsBySchedule]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.assignGroupToSlot = async (req, res) => {
    try {
        const slotId = Number(req.params.slotId);
        const { group_id, assigned_by, remarks } = req.body;

        if (!slotId || !group_id) {
            return res.status(400).json({ message: 'slotId and group_id are required.' });
        }

        const pool = await sql.connect(config);

        const slotCheck = await pool.request()
            .input('slot', sql.Int, slotId)
            .query(`SELECT slot_status, evaluation_schedule_id FROM evaluation_slot WHERE evaluation_slot_id = @slot`);

        if (!slotCheck.recordset.length) {
            return res.status(404).json({ message: 'Slot not found.' });
        }
        if (slotCheck.recordset[0].slot_status !== 'AVAILABLE') {
            return res.status(400).json({ message: 'Slot is already assigned or unavailable.' });
        }

        const scheduleId = slotCheck.recordset[0].evaluation_schedule_id;

        const dupCheck = await pool.request()
            .input('scheduleId', sql.Int, scheduleId)
            .input('groupId',    sql.Int, Number(group_id))
            .query(`
                SELECT COUNT(*) AS cnt
                FROM evaluation_slot sl
                JOIN evaluation_group_assignment ga ON ga.evaluation_slot_id = sl.evaluation_slot_id
                WHERE sl.evaluation_schedule_id = @scheduleId
                  AND ga.group_id = @groupId
            `);

        if (dupCheck.recordset[0].cnt > 0) {
            return res.status(400).json({ message: 'This group is already assigned to a slot in this schedule.' });
        }

        await pool.request()
            .input('slot', sql.Int, slotId)
            .query(`UPDATE evaluation_slot SET slot_status = 'ASSIGNED' WHERE evaluation_slot_id = @slot`);

        await pool.request()
            .input('slot',    sql.Int,          slotId)
            .input('group',   sql.Int,          Number(group_id))
            .input('user',    sql.Int,          assigned_by ? Number(assigned_by) : null)
            .input('remarks', sql.VarChar(500),  remarks || null)
            .query(`
                INSERT INTO evaluation_group_assignment
                    (evaluation_slot_id, group_id, assigned_by, remarks)
                VALUES
                    (@slot, @group, @user, @remarks)
            `);

        // Send email to group members (non-blocking)
        try {
            const students = await pool.request()
                .input('gid', sql.Int, Number(group_id))
                .query(`
                    SELECT u.user_id, u.email
                    FROM group_member gm
                    JOIN [user] u ON u.user_id = gm.student_id
                    WHERE gm.group_id = @gid
                `);

            for (const s of students.recordset) {
                let deliveryStatus = 'SENT';
                try {
                    await sendEmail(
                        s.email,
                        'Evaluation Slot Assigned',
                        'Your evaluation slot has been assigned. Please log in to view your schedule.'
                    );
                } catch (emailErr) {
                    console.error(`[assignGroupToSlot] Email failed for ${s.email}:`, emailErr.message);
                    deliveryStatus = 'FAILED';
                }

                try {
                    await pool.request()
                        .input('sid',    sql.Int,         scheduleId)
                        .input('uid',    sql.Int,         s.user_id)
                        .input('status', sql.VarChar(20), deliveryStatus)
                        .query(`
                            INSERT INTO evaluation_email_log
                                (evaluation_schedule_id, recipient_user_id, email_type, sent_at, delivery_status, retry_count)
                            VALUES (@sid, @uid, 'SLOT_ASSIGNED', GETDATE(), @status, 0)
                        `);
                } catch (logErr) {
                    console.error('[assignGroupToSlot] Email log failed:', logErr.message);
                }
            }
        } catch (studentErr) {
            console.error('[assignGroupToSlot] Student fetch failed:', studentErr.message);
        }

        res.json({ message: 'Group assigned successfully.' });

    } catch (err) {
        console.error('[assignGroupToSlot]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── CONFLICT LOG ─────────

exports.getConflicts = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT *
                FROM evaluation_conflict_log
                WHERE evaluation_schedule_id = @id
                ORDER BY detected_at DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('[getConflicts]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── EMAIL NOTIFICATION LOG ─────────

exports.getEmailLogs = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    el.email_log_id,
                    el.evaluation_schedule_id,
                    el.recipient_user_id,
                    el.email_type,
                    el.sent_at,
                    el.delivery_status,
                    el.retry_count,
                    u.email      AS recipient_email,
                    u.first_name,
                    u.last_name,
                    u.role       AS recipient_role
                FROM evaluation_email_log el
                LEFT JOIN [user] u ON u.user_id = el.recipient_user_id
                WHERE el.evaluation_schedule_id = @id
                ORDER BY el.sent_at DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('[getEmailLogs]', err);
        res.status(500).json({ error: err.message });
    }
};