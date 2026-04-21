'use strict';

const { pool: dbPool, poolConnect, sql, dbConfig: config } = require('../../config/db');
const notificationService = require('../notification/notification.service');

// Load typed email helpers; fall back to no-ops if service is missing
// AFTER
let sendSchedulePublishedEmail      = async () => {};
let sendSlotAssignedEmail           = async () => {};
let sendGroupSlotAssignedEmail      = async () => {};
let sendGroupReminderEmail          = async () => {};
let sendReminderEmail               = async () => {};
let sendScheduleUpdatedEmail        = async () => {};
let sendRescheduleNotificationEmail = async () => {};
let sendEmailRaw                    = async () => {};
// Compliance: all email sending is disabled in this platform version.

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

const isPositiveInt = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isNonNegativeInt = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;
const FIXED_BUFFER_MINUTES = 5;

/**
 * Check if [user] table exists in the database.
 * Cached per process start.
 */
let _userTableExists = null;
async function userTableExists(pool) {
    if (_userTableExists !== null) return _userTableExists;
    try {
        await pool.request().query(`SELECT TOP 1 user_id FROM users`);
        _userTableExists = true;
    } catch (_) {
        _userTableExists = false;
    }
    return _userTableExists;
}

/**
 * Insert a row into evaluation_email_log.
 * Non-throwing — logs errors internally.
 */
async function logEmail(pool, { scheduleId, userId, emailType, status, retryCount = 0, recipientCount = null, recipientEmails = null, groupLabel = null }) {
    try {
        await pool.request()
            .input('sid',             sql.Int,           scheduleId)
            .input('uid',             sql.Int,           userId || null)
            .input('emailType',       sql.VarChar(50),   emailType)
            .input('status',          sql.VarChar(20),   status)
            .input('retry',           sql.Int,           retryCount)
            .input('recipientCount',  sql.Int,           recipientCount)
            .input('recipientEmails', sql.NVarChar(2000), recipientEmails)
            .input('groupLabel',      sql.VarChar(100),  groupLabel)
            .query(`
                INSERT INTO evaluation_email_log
                    (evaluation_schedule_id, recipient_user_id, email_type,
                     sent_at, delivery_status, retry_count,
                     recipient_count, recipient_emails, group_label)
                VALUES
                    (@sid, @uid, @emailType, GETDATE(), @status, @retry,
                     @recipientCount, @recipientEmails, @groupLabel)
            `);
    } catch (err) {
        console.error('[logEmail] Failed to insert email log:', err.message);
    }
}
/**
 * Update retry_count and delivery_status on an existing email log row.
 */
async function updateEmailLog(pool, { logId, status, retryCount }) {
    try {
        await pool.request()
            .input('logId',  sql.Int,         logId)
            .input('status', sql.VarChar(20),  status)
            .input('retry',  sql.Int,          retryCount)
            .query(`
                UPDATE evaluation_email_log
                SET delivery_status = @status,
                    retry_count     = @retry,
                    sent_at         = GETDATE()
                WHERE email_log_id = @logId
            `);
    } catch (err) {
        console.error('[updateEmailLog]', err.message);
    }
}

async function getAssignedRecipients(pool, scheduleId) {
    const hasUserTable = await userTableExists(pool);
    if (!hasUserTable) return [];

    try {
        const result = await pool.request()
            .input('scheduleId', sql.Int, scheduleId)
            .query(`
                SELECT DISTINCT
                    u.user_id,
                    u.email,
                    ISNULL(u.first_name, '') AS first_name,
                    ISNULL(u.last_name, '') AS last_name,
                    CONVERT(VARCHAR, sl.slot_start_time, 108) AS slot_start_time,
                    CONVERT(VARCHAR, sl.slot_end_time, 108) AS slot_end_time,
                    CONCAT('Group ID: ', ga.group_id) AS group_label
                FROM evaluation_slot sl
                JOIN evaluation_group_assignment ga ON ga.evaluation_slot_id = sl.evaluation_slot_id
                JOIN group_member gm ON gm.group_id = ga.group_id
                JOIN users u ON u.user_id = gm.student_id
                WHERE sl.evaluation_schedule_id = @scheduleId
                  AND u.status = 'ACTIVE'
            `);

        return result.recordset;
    } catch (err) {
        console.warn('[getAssignedRecipients] Could not query assigned recipients:', err.message);
        return [];
    }
}

function getManualRecipients({ email, name, scheduleInfo = {} }) {
    if (!email || !String(email).trim()) return [];

    return String(email)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((recipientEmail, index) => ({
            user_id: null,
            email: recipientEmail,
            first_name: name ? String(name).trim() : `Demo Recipient ${index + 1}`,
            last_name: '',
            slot_start_time: scheduleInfo.slot_start_time || null,
            slot_end_time: scheduleInfo.slot_end_time || null,
            group_label: scheduleInfo.group_label || 'Demo Recipient',
        }));
}

async function sendTypedScheduleEmail(emailType, recipientEmail, recipientName, scheduleInfo) {
    if (emailType === 'SCHEDULE_PUBLISHED') {
        return sendSchedulePublishedEmail(recipientEmail, recipientName, scheduleInfo);
    }
    if (emailType === 'SCHEDULE_UPDATED') {
        return sendScheduleUpdatedEmail(recipientEmail, recipientName, scheduleInfo);
    }
    if (emailType === 'RESCHEDULE_NOTIFICATION') {
        return sendRescheduleNotificationEmail(recipientEmail, recipientName, scheduleInfo);
    }
    throw new Error(`Unsupported schedule email type: ${emailType}`);
}

async function notifyScheduleRecipients(pool, { scheduleId, recipients, emailType, scheduleInfo }) {
    // No-op: email sending and email log writes are disabled.
    return { emailsSent: 0, emailsFailed: 0 };
}

async function resolveScheduleConflicts(pool, scheduleId) {
    try {
        await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                UPDATE evaluation_conflict_log
                SET resolved = 1,
                    resolved_at = GETDATE()
                WHERE evaluation_schedule_id = @id
                  AND ISNULL(resolved, 0) = 0
            `);
    } catch (err) {
        console.warn('[resolveScheduleConflicts] Failed to resolve conflicts:', err.message);
    }
}

// ───────── ASSESSMENTS ─────────

exports.getAllAssessments = async (req, res) => {
    try {
        await poolConnect;
        const result = await dbPool.request()
            .query(`SELECT assessment_id, assessment_title FROM assessment ORDER BY assessment_title`);
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

        await poolConnect;
        await dbPool.request()
            .input('location_name',  sql.VarChar(255), location_name.trim())
            .input('building_name',  sql.VarChar(255), building_name.trim())
            .input('room_number',    sql.VarChar(50),  room_number.trim())
            .input('capacity',       sql.Int,          capacity ? Number(capacity) : null)
            .input('available_from', sql.VarChar(8),   fromTime)
            .input('available_to',   sql.VarChar(8),   toSqlT)
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
        await poolConnect;
        const result = await dbPool.request()
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
                ORDER BY location_id DESC
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
            .input('available_from', sql.VarChar(8),   fromTime)
            .input('available_to',   sql.VarChar(8),   toSqlT)
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


//hardDeleteLocations

// ───────── HARD DELETE LOCATION (INACTIVE only) ─────────
// DELETE /api/evaluation-scheduling/locations/:id/hard

exports.hardDeleteLocation = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'Invalid location ID.' });

        const pool = await sql.connect(config);

        // 1. Check exists and is INACTIVE
        const check = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT location_id, status FROM evaluation_location WHERE location_id = @id`);

        if (!check.recordset.length)
            return res.status(404).json({ message: 'Location not found.' });

        if (check.recordset[0].status !== 'INACTIVE')
            return res.status(400).json({ message: 'Only INACTIVE locations can be permanently deleted.' });

        // 2. Safety check — no active schedules
        const activeCheck = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT COUNT(*) AS cnt FROM evaluation_schedule
                WHERE location_id = @id AND status IN ('DRAFT', 'PUBLISHED')
            `);

        if (activeCheck.recordset[0].cnt > 0)
            return res.status(400).json({ message: 'Cannot delete: location still referenced by active schedules.' });

        // 3. Cascade delete all linked data
        // 3a. Group assignments linked via slots
        await pool.request().input('id', sql.Int, id).query(`
            DELETE FROM evaluation_group_assignment
            WHERE evaluation_slot_id IN (
                SELECT sl.evaluation_slot_id FROM evaluation_slot sl
                JOIN evaluation_schedule es ON es.evaluation_schedule_id = sl.evaluation_schedule_id
                WHERE es.location_id = @id
            )
        `);

        // 3b. Slots
        await pool.request().input('id', sql.Int, id).query(`
            DELETE FROM evaluation_slot
            WHERE evaluation_schedule_id IN (
                SELECT evaluation_schedule_id FROM evaluation_schedule WHERE location_id = @id
            )
        `);

        // 3c. Email logs
        await pool.request().input('id', sql.Int, id).query(`
            DELETE FROM evaluation_email_log
            WHERE evaluation_schedule_id IN (
                SELECT evaluation_schedule_id FROM evaluation_schedule WHERE location_id = @id
            )
        `);

        // 3d. Conflict logs
        await pool.request().input('id', sql.Int, id).query(`
            DELETE FROM evaluation_conflict_log
            WHERE evaluation_schedule_id IN (
                SELECT evaluation_schedule_id FROM evaluation_schedule WHERE location_id = @id
            )
        `);

        // 3e. Cancelled/orphaned schedules referencing this location
        await pool.request().input('id', sql.Int, id).query(`
            DELETE FROM evaluation_schedule WHERE location_id = @id
        `);

        // 3f. Finally, delete the location itself
        await pool.request().input('id', sql.Int, id).query(`
            DELETE FROM evaluation_location WHERE location_id = @id
        `);

        res.json({ message: 'Location permanently deleted.' });
    } catch (err) {
        console.error('[hardDeleteLocation]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── SCHEDULE MANAGEMENT ─────────

exports.createSchedule = async (req, res) => {
    const {
        assessment_id, location_id, schedule_title, date,
        start_time, end_time, duration_per_group_minutes,
        buffer_minutes, total_groups, created_by,
        fallback_recipient_email, fallback_recipient_name
    } = req.body;

    try {
        if (!assessment_id || !location_id || !schedule_title?.trim() || !date || !start_time || !end_time) {
            return res.status(400).json({ message: 'assessment_id, location_id, schedule_title, date, start_time, and end_time are required.' });
        }

        if (!isPositiveInt(duration_per_group_minutes) || !isPositiveInt(total_groups) || !isNonNegativeInt(buffer_minutes)) {
            return res.status(400).json({ message: 'duration_per_group_minutes and total_groups must be positive integers, and buffer_minutes cannot be negative.' });
        }

        const startMins = toMinutes(start_time);
        const endMins = toMinutes(end_time);
        if (endMins <= startMins) {
            return res.status(400).json({ message: 'end_time must be later than start_time.' });
        }

        const durationMinutes = Number(duration_per_group_minutes);
        const bufferMinutes = FIXED_BUFFER_MINUTES;
        const groupCount = Number(total_groups);
        const requiredMinutes = (durationMinutes * groupCount) + (bufferMinutes * Math.max(groupCount - 1, 0));
        const availableMinutes = endMins - startMins;

        if (requiredMinutes > availableMinutes) {
            return res.status(400).json({
                message: `Only ${Math.floor((availableMinutes + bufferMinutes) / (durationMinutes + bufferMinutes))} groups fit in the selected time window.`,
            });
        }

        const pool = await sql.connect(config);

        const locationCheck = await pool.request()
            .input('location_id', sql.Int, Number(location_id))
            .query(`
                SELECT
                    location_id,
                    status,
                    CONVERT(VARCHAR, available_from, 108) AS available_from,
                    CONVERT(VARCHAR, available_to, 108) AS available_to
                FROM evaluation_location
                WHERE location_id = @location_id
            `);

        if (!locationCheck.recordset.length) {
            return res.status(404).json({ message: 'Selected location was not found.' });
        }

        const location = locationCheck.recordset[0];
        if (location.status !== 'ACTIVE') {
            return res.status(400).json({ message: 'Selected location is not active.' });
        }

        const availableFrom = toMinutes(location.available_from);
        const availableTo = toMinutes(location.available_to);
        if (startMins < availableFrom || endMins > availableTo) {
            return res.status(400).json({ message: 'Selected time window is outside the location availability.' });
        }

        // Check for location conflicts
        const conflict = await pool.request()
            .input('location_id', sql.Int,       location_id)
            .input('date',        sql.Date,       date)
            .input('start_time',  sql.VarChar(8), toSqlTime(start_time))
            .input('end_time',    sql.VarChar(8), toSqlTime(end_time))
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

        const insert = await pool.request()
            .input('assessment_id',              sql.Int,           assessment_id ? Number(assessment_id) : null)
            .input('location_id',                sql.Int,           Number(location_id))
            .input('schedule_title',             sql.NVarChar(200), schedule_title)
            .input('date',                       sql.Date,          date)
            .input('start_time',                 sql.VarChar(8),    toSqlTime(start_time))
            .input('end_time',                   sql.VarChar(8),    toSqlTime(end_time))
            .input('duration_per_group_minutes', sql.Int,           Number(duration_per_group_minutes))
            .input('buffer_minutes',             sql.Int,           bufferMinutes)
            .input('total_groups',               sql.Int,           Number(total_groups))
            .input('created_by',                 sql.Int,           created_by ? Number(created_by) : null)
            .input('fallback_recipient_email',   sql.VarChar(255),  fallback_recipient_email?.trim() || null)
            .input('fallback_recipient_name',    sql.VarChar(100),  fallback_recipient_name?.trim() || null)
            .query(`
                INSERT INTO evaluation_schedule
                (assessment_id, location_id, schedule_title, date, start_time, end_time,
                 duration_per_group_minutes, buffer_minutes, total_groups, created_by,
                 fallback_recipient_email, fallback_recipient_name, status, draft_version_no)
                VALUES
                (@assessment_id, @location_id, @schedule_title, @date, @start_time, @end_time,
                 @duration_per_group_minutes, @buffer_minutes, @total_groups, @created_by,
                 @fallback_recipient_email, @fallback_recipient_name, 'DRAFT', 1);
                SELECT SCOPE_IDENTITY() AS scheduleId;
            `);

        const scheduleId = insert.recordset[0].scheduleId;

        // Auto-generate time slots
        const slotSize  = Number(duration_per_group_minutes) + bufferMinutes;
        const count     = Number(total_groups);

        for (let i = 0; i < count; i++) {
            const slotStart = startMins + i * slotSize;
            const slotEnd   = slotStart + Number(duration_per_group_minutes);
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

exports.updateSchedule = async (req, res) => {
    try {
        const scheduleId = Number(req.params.id);
        if (!scheduleId) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool = await sql.connect(config);
        const currentRes = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                SELECT
                    es.evaluation_schedule_id,
                    es.assessment_id,
                    es.location_id,
                    es.schedule_title,
                    es.fallback_recipient_email,
                    es.fallback_recipient_name,
                    es.date,
                    CONVERT(VARCHAR, es.start_time, 108) AS start_time,
                    CONVERT(VARCHAR, es.end_time, 108) AS end_time,
                    es.duration_per_group_minutes,
                    es.total_groups,
                    es.status,
                    el.location_name,
                    el.room_number,
                    (
                        SELECT COUNT(*)
                        FROM evaluation_slot sl
                        WHERE sl.evaluation_schedule_id = es.evaluation_schedule_id
                          AND sl.slot_status = 'ASSIGNED'
                    ) AS assigned_count
                FROM evaluation_schedule es
                LEFT JOIN evaluation_location el ON el.location_id = es.location_id
                WHERE es.evaluation_schedule_id = @id
            `);

        if (!currentRes.recordset.length) return res.status(404).json({ message: 'Schedule not found.' });

        const current = currentRes.recordset[0];
        if (current.status === 'CANCELLED') {
            return res.status(400).json({ message: 'Cancelled schedules cannot be updated.' });
        }

        const nextValues = {
            assessment_id: req.body.assessment_id ?? current.assessment_id,
            location_id: req.body.location_id ?? current.location_id,
            schedule_title: req.body.schedule_title ?? current.schedule_title,
            fallback_recipient_email: req.body.fallback_recipient_email ?? current.fallback_recipient_email,
            fallback_recipient_name: req.body.fallback_recipient_name ?? current.fallback_recipient_name,
            date: req.body.date ?? new Date(current.date).toISOString().slice(0, 10),
            start_time: req.body.start_time ?? current.start_time,
            end_time: req.body.end_time ?? current.end_time,
            duration_per_group_minutes: req.body.duration_per_group_minutes ?? current.duration_per_group_minutes,
            total_groups: req.body.total_groups ?? current.total_groups,
        };

        if (!nextValues.assessment_id || !nextValues.location_id || !nextValues.schedule_title?.trim() || !nextValues.date || !nextValues.start_time || !nextValues.end_time) {
            return res.status(400).json({ message: 'assessment_id, location_id, schedule_title, date, start_time, and end_time are required.' });
        }

        if (!isPositiveInt(nextValues.duration_per_group_minutes) || !isPositiveInt(nextValues.total_groups)) {
            return res.status(400).json({ message: 'duration_per_group_minutes and total_groups must be positive integers.' });
        }

        const startMins = toMinutes(nextValues.start_time);
        const endMins = toMinutes(nextValues.end_time);
        if (endMins <= startMins) {
            return res.status(400).json({ message: 'end_time must be later than start_time.' });
        }

        const durationMinutes = Number(nextValues.duration_per_group_minutes);
        const totalGroups = Number(nextValues.total_groups);
        const requiredMinutes = (durationMinutes * totalGroups) + (FIXED_BUFFER_MINUTES * Math.max(totalGroups - 1, 0));
        const availableMinutes = endMins - startMins;

        if (requiredMinutes > availableMinutes) {
            return res.status(400).json({
                message: `Only ${Math.floor((availableMinutes + FIXED_BUFFER_MINUTES) / (durationMinutes + FIXED_BUFFER_MINUTES))} groups fit in the selected time window.`,
            });
        }

        const locationCheck = await pool.request()
            .input('location_id', sql.Int, Number(nextValues.location_id))
            .query(`
                SELECT
                    location_id,
                    location_name,
                    room_number,
                    status,
                    CONVERT(VARCHAR, available_from, 108) AS available_from,
                    CONVERT(VARCHAR, available_to, 108) AS available_to
                FROM evaluation_location
                WHERE location_id = @location_id
            `);

        if (!locationCheck.recordset.length) return res.status(404).json({ message: 'Selected location was not found.' });

        const location = locationCheck.recordset[0];
        if (location.status !== 'ACTIVE') {
            return res.status(400).json({ message: 'Selected location is not active.' });
        }

        const availableFrom = toMinutes(location.available_from);
        const availableTo = toMinutes(location.available_to);
        if (startMins < availableFrom || endMins > availableTo) {
            return res.status(400).json({ message: 'Selected time window is outside the location availability.' });
        }

        const conflict = await pool.request()
            .input('scheduleId', sql.Int, scheduleId)
            .input('location_id', sql.Int, Number(nextValues.location_id))
            .input('date', sql.Date, nextValues.date)
            .input('start_time', sql.VarChar(8), toSqlTime(nextValues.start_time))
            .input('end_time', sql.VarChar(8), toSqlTime(nextValues.end_time))
            .query(`
                SELECT COUNT(*) AS cnt
                FROM evaluation_schedule
                WHERE evaluation_schedule_id <> @scheduleId
                  AND location_id = @location_id
                  AND date = @date
                  AND status <> 'CANCELLED'
                  AND (start_time < @end_time AND end_time > @start_time)
            `);

        if (conflict.recordset[0].cnt > 0) {
            return res.status(409).json({ message: 'Location conflict detected for the selected date and time.' });
        }

        if (Number(current.assigned_count) > 0 && Number(nextValues.total_groups) !== Number(current.total_groups)) {
            return res.status(400).json({ message: 'total_groups cannot be changed after groups have been assigned.' });
        }

        await pool.request()
            .input('id', sql.Int, scheduleId)
            .input('assessment_id', sql.Int, Number(nextValues.assessment_id))
            .input('location_id', sql.Int, Number(nextValues.location_id))
            .input('schedule_title', sql.NVarChar(200), nextValues.schedule_title.trim())
            .input('date', sql.Date, nextValues.date)
            .input('start_time', sql.VarChar(8), toSqlTime(nextValues.start_time))
            .input('end_time', sql.VarChar(8), toSqlTime(nextValues.end_time))
            .input('duration_per_group_minutes', sql.Int, durationMinutes)
            .input('buffer_minutes', sql.Int, FIXED_BUFFER_MINUTES)
            .input('total_groups', sql.Int, totalGroups)
            .input('fallback_recipient_email', sql.VarChar(255), nextValues.fallback_recipient_email?.trim() || null)
            .input('fallback_recipient_name', sql.VarChar(100), nextValues.fallback_recipient_name?.trim() || null)
            .query(`
                UPDATE evaluation_schedule
                SET assessment_id = @assessment_id,
                    location_id = @location_id,
                    schedule_title = @schedule_title,
                    date = @date,
                    start_time = @start_time,
                    end_time = @end_time,
                    duration_per_group_minutes = @duration_per_group_minutes,
                    buffer_minutes = @buffer_minutes,
                    total_groups = @total_groups,
                    fallback_recipient_email = @fallback_recipient_email,
                    fallback_recipient_name = @fallback_recipient_name,
                    draft_version_no = CASE WHEN status = 'DRAFT' THEN draft_version_no + 1 ELSE draft_version_no END,
                    updated_at = GETDATE()
                WHERE evaluation_schedule_id = @id
            `);

        const slotRes = await pool.request()
            .input('scheduleId', sql.Int, scheduleId)
            .query(`
                SELECT evaluation_slot_id, slot_sequence_no
                FROM evaluation_slot
                WHERE evaluation_schedule_id = @scheduleId
                ORDER BY slot_sequence_no
            `);

        const existingSlots = slotRes.recordset;

        if (Number(current.assigned_count) === 0 && existingSlots.length !== totalGroups) {
            await pool.request()
                .input('scheduleId', sql.Int, scheduleId)
                .query(`DELETE FROM evaluation_slot WHERE evaluation_schedule_id = @scheduleId`);

            for (let i = 0; i < totalGroups; i++) {
                const slotStart = startMins + i * (durationMinutes + FIXED_BUFFER_MINUTES);
                const slotEnd = slotStart + durationMinutes;
                await pool.request()
                    .input('schedule_id', sql.Int, scheduleId)
                    .input('slot_sequence_no', sql.Int, i + 1)
                    .input('slot_start_time', sql.VarChar(8), toTime(slotStart))
                    .input('slot_end_time', sql.VarChar(8), toTime(slotEnd))
                    .input('buffer_applied', sql.Bit, i < totalGroups - 1 ? 1 : 0)
                    .input('slot_status', sql.VarChar(20), 'AVAILABLE')
                    .query(`
                        INSERT INTO evaluation_slot
                            (evaluation_schedule_id, slot_sequence_no, slot_start_time, slot_end_time, buffer_applied, slot_status)
                        VALUES
                            (@schedule_id, @slot_sequence_no, @slot_start_time, @slot_end_time, @buffer_applied, @slot_status)
                    `);
            }
        } else {
            for (let i = 0; i < existingSlots.length; i++) {
                const slotStart = startMins + i * (durationMinutes + FIXED_BUFFER_MINUTES);
                const slotEnd = slotStart + durationMinutes;
                await pool.request()
                    .input('slotId', sql.Int, existingSlots[i].evaluation_slot_id)
                    .input('slot_start_time', sql.VarChar(8), toTime(slotStart))
                    .input('slot_end_time', sql.VarChar(8), toTime(slotEnd))
                    .input('buffer_applied', sql.Bit, i < existingSlots.length - 1 ? 1 : 0)
                    .query(`
                        UPDATE evaluation_slot
                        SET slot_start_time = @slot_start_time,
                            slot_end_time = @slot_end_time,
                            buffer_applied = @buffer_applied
                        WHERE evaluation_slot_id = @slotId
                    `);
            }
        }

        await resolveScheduleConflicts(pool, scheduleId);

        const scheduleInfo = {
            schedule_title: nextValues.schedule_title.trim(),
            date: nextValues.date,
            start_time: toSqlTime(nextValues.start_time),
            end_time: toSqlTime(nextValues.end_time),
            location_name: location.location_name,
            room_number: location.room_number,
        };

        const originalDate = new Date(current.date).toISOString().slice(0, 10);
        const isRescheduled =
            String(nextValues.date) !== originalDate ||
            toSqlTime(nextValues.start_time) !== current.start_time ||
            toSqlTime(nextValues.end_time) !== current.end_time ||
            Number(nextValues.location_id) !== Number(current.location_id);

        let emailResult = { emailsSent: 0, emailsFailed: 0 };
        if (current.status === 'PUBLISHED') {
            const recipients = await getAssignedRecipients(pool, scheduleId);
            const manualRecipients = getManualRecipients({
                email: req.body.fallback_recipient_email ?? current.fallback_recipient_email,
                name: req.body.fallback_recipient_name ?? current.fallback_recipient_name,
                scheduleInfo,
            });
            const notifyRecipients = recipients.length > 0 ? recipients : manualRecipients;
            if (notifyRecipients.length > 0) {
                emailResult = await notifyScheduleRecipients(pool, {
                    scheduleId,
                    recipients: notifyRecipients,
                    emailType: isRescheduled ? 'RESCHEDULE_NOTIFICATION' : 'SCHEDULE_UPDATED',
                    scheduleInfo,
                });
            }
        }

        res.json({
            message: isRescheduled ? 'Schedule rescheduled successfully.' : 'Schedule updated successfully.',
            emailType: isRescheduled ? 'RESCHEDULE_NOTIFICATION' : 'SCHEDULE_UPDATED',
            ...emailResult,
        });
    } catch (err) {
        console.error('[updateSchedule]', err);
        res.status(500).json({ message: 'Failed to update schedule.', error: err.message });
    }
};

exports.getSchedules = async (req, res) => {
    try {
        await poolConnect;
        const result = await dbPool.request().query(`
            SELECT
                es.evaluation_schedule_id,
                es.assessment_id,
                es.location_id,
                es.schedule_title,
                es.date,
                CONVERT(VARCHAR, es.start_time, 108) AS start_time,
                CONVERT(VARCHAR, es.end_time,   108) AS end_time,
                es.duration_per_group_minutes,
                es.buffer_minutes,
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
            LEFT JOIN assessment           a  ON es.assessment_id = a.assessment_id
            ORDER BY es.date DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('[getSchedules]', err);
        res.status(500).json({ message: 'Failed to load schedules.', error: err.message });
    }
};

// ───────── PUBLISH — with full SCHEDULE_PUBLISHED emails ─────────

exports.publishSchedule = async (req, res) => {
    try {
        const scheduleId  = Number(req.params.id);
        const publishedBy = req.body.published_by ? Number(req.body.published_by) : null;

        if (!scheduleId) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool = await sql.connect(config);

        const check = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                SELECT es.evaluation_schedule_id, es.status, es.schedule_title, es.date,
                       CONVERT(VARCHAR, es.start_time, 108) AS start_time,
                       CONVERT(VARCHAR, es.end_time,   108) AS end_time,
                       es.fallback_recipient_email,
                       es.fallback_recipient_name,
                       el.location_name, el.room_number
                FROM evaluation_schedule es
                LEFT JOIN evaluation_location el ON es.location_id = el.location_id
                WHERE es.evaluation_schedule_id = @id
            `);

        if (!check.recordset.length) return res.status(404).json({ message: 'Schedule not found.' });

        const sched = check.recordset[0];
        if (sched.status !== 'DRAFT') {
            return res.status(400).json({ message: `Schedule is already ${sched.status}.` });
        }

        const assignmentSummary = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                SELECT
                    es.total_groups,
                    (
                        SELECT COUNT(*)
                        FROM evaluation_slot sl
                        WHERE sl.evaluation_schedule_id = es.evaluation_schedule_id
                          AND sl.slot_status = 'ASSIGNED'
                    ) AS assigned_count
                FROM evaluation_schedule es
                WHERE es.evaluation_schedule_id = @id
            `);

        const scheduleSummary = assignmentSummary.recordset[0];
        if (!scheduleSummary || Number(scheduleSummary.assigned_count) < Number(scheduleSummary.total_groups)) {
            return res.status(400).json({ message: 'Assign all groups before publishing the schedule.' });
        }

        const conflictSummary = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                SELECT COUNT(*) AS unresolved_count
                FROM evaluation_conflict_log
                WHERE evaluation_schedule_id = @id
                  AND ISNULL(resolved, 0) = 0
            `);

        if (Number(conflictSummary.recordset[0]?.unresolved_count || 0) > 0) {
            return res.status(409).json({ message: 'Resolve all schedule conflicts before publishing.' });
        }

        // Mark as published
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

        // ── Send SCHEDULE_PUBLISHED emails ───────────────────────────────────
        let emailsSent   = 0;
        let emailsFailed = 0;

        const recipients = await getAssignedRecipients(pool, scheduleId);
        const manualRecipients = getManualRecipients({
            email: req.body.fallback_recipient_email ?? sched.fallback_recipient_email,
            name: req.body.fallback_recipient_name ?? sched.fallback_recipient_name,
            scheduleInfo: {
                schedule_title: sched.schedule_title,
                date: sched.date,
                start_time: sched.start_time,
                end_time: sched.end_time,
                location_name: sched.location_name,
                room_number: sched.room_number,
            },
        });
        const notifyRecipients = recipients.length > 0 ? recipients : manualRecipients;

        if (notifyRecipients.length > 0) {
            const scheduleInfo = {
                schedule_title: sched.schedule_title,
                date:           sched.date,
                start_time:     sched.start_time,
                end_time:       sched.end_time,
                location_name:  sched.location_name,
                room_number:    sched.room_number,
            };

            ({ emailsSent, emailsFailed } = await notifyScheduleRecipients(pool, {
                scheduleId,
                recipients: notifyRecipients,
                emailType: 'SCHEDULE_PUBLISHED',
                scheduleInfo,
            }));
        } else {
            console.warn('[publishSchedule] No assigned recipients found for schedule publication emails');
        }

        try {
            const inAppRecipients = await getAssignedRecipients(pool, scheduleId);
            const st = sched.schedule_title || 'Evaluation schedule';
            for (const r of inAppRecipients) {
                if (r.user_id) {
                    await notificationService.insertForUser(
                        r.user_id,
                        'Evaluation schedule published',
                        `Your schedule "${st}" is published. Check date, time, and location in Evaluation.`,
                        'EVALUATION_SCHEDULE_PUBLISHED'
                    );
                }
            }
        } catch (e) {
            console.warn('[publishSchedule] in-app notifications:', e.message);
        }

        res.json({
            message:      'Schedule published',
            emailsSent,
            emailsFailed,
        });

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

// ───────── DELETE SCHEDULE ─────────

exports.deleteSchedule = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool = await sql.connect(config);

        const check = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT evaluation_schedule_id FROM evaluation_schedule
                    WHERE evaluation_schedule_id = @id`);

        if (!check.recordset.length)
            return res.status(404).json({ message: 'Schedule not found.' });

        // 1. Delete group assignments (linked via slot, not schedule directly)
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM evaluation_group_assignment
                    WHERE evaluation_slot_id IN (
                        SELECT evaluation_slot_id FROM evaluation_slot
                        WHERE evaluation_schedule_id = @id
                    )`);

        // 2. Delete slots
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM evaluation_slot WHERE evaluation_schedule_id = @id`);

        // 3. Delete email logs
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM evaluation_email_log WHERE evaluation_schedule_id = @id`);

        // 4. Delete conflict logs
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM evaluation_conflict_log WHERE evaluation_schedule_id = @id`);

        // 5. Delete the schedule itself
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM evaluation_schedule WHERE evaluation_schedule_id = @id`);

        res.json({ message: 'Schedule permanently deleted.' });
    } catch (err) {
        console.error('[deleteSchedule]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── SLOT + GROUP ASSIGNMENT ─────────

exports.getSlotsBySchedule = async (req, res) => {
    try {
        const scheduleId = Number(req.params.id);
        if (!scheduleId) return res.status(400).json({ message: 'Missing schedule id.' });

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
                    CAST(sl.buffer_applied AS INT)            AS buffer_applied,
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

        // Fetch buffer_minutes from parent schedule to render BufferPill correctly
        const schedResult = await pool.request()
            .input('schedule_id', sql.Int, scheduleId)
            .query(`SELECT buffer_minutes FROM evaluation_schedule WHERE evaluation_schedule_id = @schedule_id`);

        const bufferMinutes = schedResult.recordset[0]?.buffer_minutes ?? 5;

        const slots = result.recordset.map(s => ({
            ...s,
            buffer_minutes: s.buffer_applied ? bufferMinutes : 0,
        }));

        res.json(slots);
    } catch (err) {
        console.error('[getSlotsBySchedule]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── ASSIGN GROUP — with full SLOT_ASSIGNED emails ─────────

exports.assignGroupToSlot = async (req, res) => {
    try {
        const slotId = Number(req.params.slotId);
        const { group_id, assigned_by, remarks } = req.body;

        if (!slotId || !group_id) {
            return res.status(400).json({ message: 'slotId and group_id are required.' });
        }

        const pool = await sql.connect(config);
        const transaction = new sql.Transaction(pool);

        // Fetch slot + schedule + location info in one query for email enrichment
        const slotCheck = await pool.request()
            .input('slot', sql.Int, slotId)
            .query(`
                SELECT
                    sl.slot_status,
                    sl.evaluation_schedule_id,
                    sl.slot_sequence_no,
                    CONVERT(VARCHAR, sl.slot_start_time, 108) AS slot_start_time,
                    CONVERT(VARCHAR, sl.slot_end_time,   108) AS slot_end_time,
                    es.status AS schedule_status,
                    es.schedule_title,
                    es.date,
                    es.fallback_recipient_email,
                    es.fallback_recipient_name,
                    el.location_name,
                    el.room_number
                FROM evaluation_slot sl
                JOIN evaluation_schedule es ON es.evaluation_schedule_id = sl.evaluation_schedule_id
                LEFT JOIN evaluation_location el ON el.location_id = es.location_id
                WHERE sl.evaluation_slot_id = @slot
            `);

        if (!slotCheck.recordset.length) {
            return res.status(404).json({ message: 'Slot not found.' });
        }

        const slotRow    = slotCheck.recordset[0];
        const scheduleId = slotRow.evaluation_schedule_id;

        if (slotRow.schedule_status !== 'DRAFT') {
            return res.status(400).json({ message: `Groups can only be assigned while the schedule is in DRAFT status. Current status: ${slotRow.schedule_status}.` });
        }

        if (slotRow.slot_status !== 'AVAILABLE') {
            return res.status(400).json({ message: 'Slot is already assigned or unavailable.' });
        }

        // Prevent same group being assigned twice in the same schedule
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

        await transaction.begin();

        try {
            // Update slot status
            await new sql.Request(transaction)
                .input('slot', sql.Int, slotId)
                .query(`UPDATE evaluation_slot SET slot_status = 'ASSIGNED' WHERE evaluation_slot_id = @slot`);

            // Insert assignment record
            await new sql.Request(transaction)
                .input('slot',    sql.Int,         slotId)
                .input('group',   sql.Int,         Number(group_id))
                .input('user',    sql.Int,         assigned_by ? Number(assigned_by) : null)
                .input('remarks', sql.VarChar(500), remarks || null)
                .query(`
                    INSERT INTO evaluation_group_assignment
                        (evaluation_slot_id, group_id, assigned_by, remarks)
                    VALUES
                        (@slot, @group, @user, @remarks)
                `);

            await transaction.commit();
        } catch (dbErr) {
            if (transaction._aborted !== true) {
                await transaction.rollback();
            }

            if (
                dbErr.number === 2627 ||
                dbErr.number === 2601 ||
                /duplicate|unique|constraint/i.test(dbErr.message)
            ) {
                return res.status(409).json({ message: 'This slot assignment conflicts with existing assignment data.' });
            }

            if (/foreign key|reference constraint/i.test(dbErr.message)) {
                return res.status(400).json({ message: 'The selected group or assigned_by user is not valid for this assignment.' });
            }

            throw dbErr;
        }
        // Compliance: email sending disabled (no notification emails).
        return res.json({ message: 'Group assigned successfully.', emailsSent: 0, emailsFailed: 0 });

// ── Send SLOT_ASSIGNED email to entire group via BCC ─────────────────
        const hasUserTable = await userTableExists(pool);
        let emailsSent = 0;
        let emailsFailed = 0;

        if (hasUserTable) {
            let students = [];
            try {
                const sRes = await pool.request()
                    .input('gid', sql.Int, Number(group_id))
                    .query(`
                        SELECT u.user_id,
                               u.email,
                               ISNULL(u.first_name, '') AS first_name,
                               ISNULL(u.last_name,  '') AS last_name
                        FROM group_member gm
                        JOIN users u ON u.user_id = gm.student_id
                        WHERE gm.group_id = @gid
                          AND u.status    = 'ACTIVE'
                    `);
                students = sRes.recordset;
            } catch (err) {
                console.warn('[assignGroupToSlot] Could not fetch group members:', err.message);
            }

            const groupEmails = students.map(s => s.email).filter(Boolean);
            const groupLbl    = `Group ID: ${group_id}`;

            const slotInfo = {
                schedule_title:   slotRow.schedule_title,
                date:             slotRow.date,
                slot_start_time:  slotRow.slot_start_time,
                slot_end_time:    slotRow.slot_end_time,
                location_name:    slotRow.location_name,
                room_number:      slotRow.room_number,
                slot_sequence_no: slotRow.slot_sequence_no,
                group_label:      groupLbl,
            };

            // Use fallback if no students found in DB
            const emailTargets = groupEmails.length > 0
                ? groupEmails
                : [slotRow.fallback_recipient_email].filter(Boolean);

            let deliveryStatus = 'SENT';
            let retryCount     = 0;

            if (emailTargets.length > 0) {
                try {
                    const result = await sendGroupSlotAssignedEmail(emailTargets, groupLbl, slotInfo);
                    retryCount = result?.retryCount || 0;
                    emailsSent = 1;
                } catch (emailErr) {
                    console.error('[assignGroupToSlot] Group email failed:', emailErr.message);
                    deliveryStatus = 'FAILED';
                    retryCount     = emailErr.retryCount || 1;
                    emailsFailed   = 1;
                }

                await logEmail(pool, {
                    scheduleId,
                    userId:          null,
                    emailType:       'SLOT_ASSIGNED',
                    status:          deliveryStatus,
                    retryCount,
                    recipientCount:  emailTargets.length,
                    recipientEmails: emailTargets.join(', '),
                    groupLabel:      groupLbl,
                });
            }
        } else {
            console.warn('[assignGroupToSlot] [user] table not found — skipping email notifications');
        }

        return res.json({ message: 'Group assigned successfully.', emailsSent, emailsFailed });

    } catch (err) {
        console.error('[assignGroupToSlot]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── RETRY FAILED EMAILS ─────────
// POST /api/evaluation-scheduling/schedules/:id/retry-emails
// Retries all FAILED email log entries for a given schedule.

exports.retryFailedEmails = async (req, res) => {
    // Compliance: email retries disabled.
    return res.status(501).json({ message: "Email notifications are disabled." });
    try {
        const scheduleId = Number(req.params.id);
        if (!scheduleId) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool = await sql.connect(config);

        const hasUserTable = await userTableExists(pool);
        if (!hasUserTable) {
            return res.status(503).json({ message: '[user] table not available — cannot retry emails.' });
        }

        // Fetch all FAILED logs for this schedule with full recipient details
        const failedRes = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                SELECT
                    el.email_log_id,
                    el.recipient_user_id,
                    el.email_type,
                    el.retry_count,
                    u.email,
                    ISNULL(u.first_name, '') AS first_name,
                    ISNULL(u.last_name,  '') AS last_name
                FROM evaluation_email_log el
                JOIN users u ON u.user_id = el.recipient_user_id
                WHERE el.evaluation_schedule_id = @id
                  AND el.delivery_status = 'FAILED'
            `);

        if (!failedRes.recordset.length) {
            return res.json({ message: 'No failed emails to retry.', retried: 0 });
        }

        // Fetch schedule + location context for email building
        const schedRes = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                SELECT es.schedule_title, es.date,
                       CONVERT(VARCHAR, es.start_time, 108) AS start_time,
                       CONVERT(VARCHAR, es.end_time,   108) AS end_time,
                       el.location_name, el.room_number
                FROM evaluation_schedule es
                LEFT JOIN evaluation_location el ON el.location_id = es.location_id
                WHERE es.evaluation_schedule_id = @id
            `);

        const sched = schedRes.recordset[0];
        if (!sched) return res.status(404).json({ message: 'Schedule not found.' });

        let retried = 0;
        let success = 0;

        for (const log of failedRes.recordset) {
            const recipientName = `${log.first_name} ${log.last_name}`.trim() || 'Student';
            let newStatus = 'FAILED';

            try {
                if (log.email_type === 'SCHEDULE_PUBLISHED') {
                    await sendSchedulePublishedEmail(log.email, recipientName, {
                        schedule_title: sched.schedule_title,
                        date:           sched.date,
                        start_time:     sched.start_time,
                        end_time:       sched.end_time,
                        location_name:  sched.location_name,
                        room_number:    sched.room_number,
                    });
                } else if (log.email_type === 'SCHEDULE_UPDATED') {
                    await sendScheduleUpdatedEmail(log.email, recipientName, {
                        schedule_title: sched.schedule_title,
                        date:           sched.date,
                        start_time:     sched.start_time,
                        end_time:       sched.end_time,
                        location_name:  sched.location_name,
                        room_number:    sched.room_number,
                    });
                } else if (log.email_type === 'RESCHEDULE_NOTIFICATION') {
                    await sendRescheduleNotificationEmail(log.email, recipientName, {
                        schedule_title: sched.schedule_title,
                        date:           sched.date,
                        start_time:     sched.start_time,
                        end_time:       sched.end_time,
                        location_name:  sched.location_name,
                        room_number:    sched.room_number,
                    });
                } else if (log.email_type === 'SLOT_ASSIGNED') {
                    await sendEmailRaw(
                        log.email,
                        `Evaluation Slot Assigned — ${sched.schedule_title}`,
                        'Your evaluation slot has been assigned. Please log in to view your schedule.'
                    );
                }
                newStatus = 'SENT';
                success++;
            } catch (emailErr) {
                console.error(`[retryFailedEmails] Retry failed for ${log.email}:`, emailErr.message);
            }

            await updateEmailLog(pool, {
                logId:      log.email_log_id,
                status:     newStatus,
                retryCount: (log.retry_count || 0) + 1,
            });

            retried++;
        }

        res.json({
            message:  `Retried ${retried} email(s). ${success} succeeded.`,
            retried,
            success,
            failed:   retried - success,
        });

    } catch (err) {
        console.error('[retryFailedEmails]', err);
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
    // Compliance: email logs disabled.
    return res.status(501).json({ message: "Email notifications are disabled." });
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool           = await sql.connect(config);
        const hasUserTable   = await userTableExists(pool);

        let result;
        if (hasUserTable) {
            result = await pool.request()
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
                        COALESCE(u.email, es.fallback_recipient_email) AS recipient_email,
                        COALESCE(u.first_name, es.fallback_recipient_name) AS first_name,
                        u.last_name,
                        COALESCE(u.role, 'FALLBACK_RECIPIENT') AS recipient_role
                    FROM evaluation_email_log el
                    JOIN evaluation_schedule es ON es.evaluation_schedule_id = el.evaluation_schedule_id
                    LEFT JOIN users u ON u.user_id = el.recipient_user_id
                    WHERE el.evaluation_schedule_id = @id
                    ORDER BY el.sent_at DESC
                `);
        } else {
            result = await pool.request()
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
                        es.fallback_recipient_email AS recipient_email,
                        es.fallback_recipient_name  AS first_name,
                        NULL                        AS last_name,
                        'FALLBACK_RECIPIENT'        AS recipient_role
                    FROM evaluation_email_log el
                    JOIN evaluation_schedule es ON es.evaluation_schedule_id = el.evaluation_schedule_id
                    WHERE el.evaluation_schedule_id = @id
                    ORDER BY el.sent_at DESC
                `);
        }

        const all     = result.recordset;
        const sent    = all.filter(r => r.delivery_status === 'SENT').length;
        const failed  = all.filter(r => r.delivery_status === 'FAILED').length;
        const pending = all.filter(r => r.delivery_status === 'PENDING').length;

        res.json({
            logs: all,
            summary: { total: all.length, sent, failed, pending },
        });

    } catch (err) {
        console.error('[getEmailLogs]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── STUDENT SCHEDULE VIEW ─────────
// GET /api/evaluation-scheduling/student/schedules

exports.getStudentScheduleView = async (req, res) => {
    try {
        await poolConnect;
        const pool = dbPool;

        // ── 1. Fetch all PUBLISHED schedules with location + assessment info ──
        const scheduleRes = await pool.request().query(`
            SELECT
                es.evaluation_schedule_id,
                es.schedule_title,
                es.date,
                CONVERT(VARCHAR, es.start_time, 108)      AS start_time,
                CONVERT(VARCHAR, es.end_time,   108)      AS end_time,
                es.duration_per_group_minutes,
                es.buffer_minutes,
                es.total_groups,
                es.published_at,
                ISNULL(a.assessment_title, '—')           AS assessment_title,
                ISNULL(el.location_name,   '—')           AS location_name,
                ISNULL(el.building_name,   '—')           AS building_name,
                ISNULL(el.room_number,     '—')           AS room_number,
                ISNULL(el.capacity,        0)             AS capacity
            FROM evaluation_schedule es
            LEFT JOIN evaluation_location el ON el.location_id  = es.location_id
            LEFT JOIN assessment            a  ON a.assessment_id = es.assessment_id
            WHERE es.status = 'PUBLISHED'
            ORDER BY es.date DESC
        `);

        const schedules = scheduleRes.recordset;

        if (!schedules.length) {
            return res.json({ schedules: [] });
        }

        // ── 2. Fetch all slots for every published schedule in one query ──────
        //    Avoids N+1 — group them in JS afterwards.
        const scheduleIds = schedules.map(s => s.evaluation_schedule_id);
        const idParams    = scheduleIds.map((_, i) => `@id${i}`).join(', ');

        const slotReq = pool.request();
        scheduleIds.forEach((id, i) => slotReq.input(`id${i}`, sql.Int, id));

        const slotRes = await slotReq.query(`
            SELECT
                sl.evaluation_slot_id,
                sl.evaluation_schedule_id,
                sl.slot_sequence_no,
                CONVERT(VARCHAR, sl.slot_start_time, 108) AS slot_start_time,
                CONVERT(VARCHAR, sl.slot_end_time,   108) AS slot_end_time,
                CAST(sl.buffer_applied AS INT)            AS buffer_applied,
                sl.slot_status,
                ga.assignment_id,
                ga.group_id,
                ga.assigned_at,
                ga.attendance_status,
                ga.evaluation_completed,
                ga.remarks
            FROM evaluation_slot sl
            LEFT JOIN evaluation_group_assignment ga
                ON ga.evaluation_slot_id = sl.evaluation_slot_id
            WHERE sl.evaluation_schedule_id IN (${idParams})
            ORDER BY sl.evaluation_schedule_id, sl.slot_sequence_no
        `);

        // ── 3. Group slots under their parent schedule ────────────────────────
        const slotsBySchedule = {};
        for (const slot of slotRes.recordset) {
            const sid = slot.evaluation_schedule_id;
            if (!slotsBySchedule[sid]) slotsBySchedule[sid] = [];
            slotsBySchedule[sid].push({
                evaluation_slot_id:   slot.evaluation_slot_id,
                slot_sequence_no:     slot.slot_sequence_no,
                slot_start_time:      slot.slot_start_time,
                slot_end_time:        slot.slot_end_time,
                buffer_applied:       slot.buffer_applied,
                slot_status:          slot.slot_status,
                group_id:             slot.group_id    || null,
                group_label:          slot.group_id    ? `Group ID: ${slot.group_id}` : '—',
                assignment_id:        slot.assignment_id || null,
                assigned_at:          slot.assigned_at  || null,
                attendance_status:    slot.attendance_status  || null,
                evaluation_completed: !!slot.evaluation_completed,
                remarks:              slot.remarks || null,
            });
        }

        // ── 4. Assemble final response ────────────────────────────────────────
        const result = schedules.map(s => {
            const slots      = slotsBySchedule[s.evaluation_schedule_id] || [];
            const assigned   = slots.filter(sl => sl.slot_status === 'ASSIGNED').length;
            const unassigned = slots.length - assigned;

            return {
                evaluation_schedule_id:     s.evaluation_schedule_id,
                schedule_title:             s.schedule_title,
                assessment_title:           s.assessment_title,
                date:                       s.date,
                start_time:                 s.start_time,
                end_time:                   s.end_time,
                duration_per_group_minutes: s.duration_per_group_minutes,
                buffer_minutes:             s.buffer_minutes,
                total_groups:               s.total_groups,
                published_at:               s.published_at,
                location: {
                    location_name: s.location_name,
                    building_name: s.building_name,
                    room_number:   s.room_number,
                    capacity:      s.capacity,
                },
                summary: {
                    total_slots: slots.length,
                    assigned,
                    unassigned,
                },
                slots,
            };
        });

        res.json({ schedules: result });

    } catch (err) {
        console.error('[getStudentScheduleView]', err);
        res.status(500).json({ message: 'Failed to load student schedule view.', error: err.message });
    }
};

// ───────── SEND REMINDER EMAILS (manual blast from Screen 5.7) ─────────
// POST /api/evaluation-scheduling/schedules/:id/send-reminders

exports.sendReminderBlast = async (req, res) => {
    // Compliance: email reminders disabled.
    return res.status(501).json({ message: "Email notifications are disabled." });
    try {
        const scheduleId = Number(req.params.id);
        if (!scheduleId) return res.status(400).json({ message: 'Invalid schedule ID.' });

        const pool = await sql.connect(config);

        // Get schedule + location info
        const schedRes = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                SELECT es.schedule_title, es.date, es.status,
                       CONVERT(VARCHAR, es.start_time, 108) AS start_time,
                       CONVERT(VARCHAR, es.end_time,   108) AS end_time,
                       el.location_name, el.room_number
                FROM evaluation_schedule es
                LEFT JOIN evaluation_location el ON el.location_id = es.location_id
                WHERE es.evaluation_schedule_id = @id
            `);

        if (!schedRes.recordset.length)
            return res.status(404).json({ message: 'Schedule not found.' });

        const sched = schedRes.recordset[0];

       
      // continues with fallback email if no user table
const hasUserTable = await userTableExists(pool);

        const slotsRes = await pool.request()
            .input('id', sql.Int, scheduleId)
            .query(`
                SELECT
                    sl.evaluation_slot_id,
                    sl.slot_sequence_no,
                    CONVERT(VARCHAR, sl.slot_start_time, 108) AS slot_start_time,
                    CONVERT(VARCHAR, sl.slot_end_time,   108) AS slot_end_time,
                    ga.group_id
                FROM evaluation_slot sl
                JOIN evaluation_group_assignment ga
                    ON ga.evaluation_slot_id = sl.evaluation_slot_id
                WHERE sl.evaluation_schedule_id = @id
                  AND sl.slot_status = 'ASSIGNED'
            `);

        const slots = slotsRes.recordset;
        if (!slots.length)
            return res.status(400).json({ message: 'No assigned groups found for this schedule.' });

        let totalSent   = 0;
        let totalFailed = 0;

        for (const slot of slots) {
         // AFTER — uses fallback if no user table or no members found
let emails = [];
if (hasUserTable) {
    try {
        const membersRes = await pool.request()
            .input('gid', sql.Int, Number(slot.group_id))
            .query(`
                SELECT u.email
                FROM group_member gm
                JOIN users u ON u.user_id = gm.student_id
                WHERE gm.group_id = @gid AND u.status = 'ACTIVE'
            `);
        emails = membersRes.recordset.map(r => r.email).filter(Boolean);
    } catch (err) {
        console.warn('[sendReminderBlast] Could not fetch group members:', err.message);
    }
}

// Fall back to schedule-level fallback email
if (emails.length === 0 && sched.fallback_recipient_email) {
    emails = [sched.fallback_recipient_email];
}
            const groupLbl  = `Group ID: ${slot.group_id}`;

            if (!emails.length) continue;

            const slotInfo = {
                schedule_title:  sched.schedule_title,
                date:            sched.date,
                slot_start_time: slot.slot_start_time,
                slot_end_time:   slot.slot_end_time,
                location_name:   sched.location_name,
                room_number:     sched.room_number,
            };

            let deliveryStatus = 'SENT';
            let retryCount     = 0;

            try {
                const result = await sendGroupReminderEmail(emails, groupLbl, slotInfo);
                retryCount = result?.retryCount || 0;
                totalSent++;
            } catch (err) {
                console.error(`[sendReminderBlast] Failed for ${groupLbl}:`, err.message);
                deliveryStatus = 'FAILED';
                retryCount     = err.retryCount || 1;
                totalFailed++;
            }

            await logEmail(pool, {
                scheduleId,
                userId:          null,
                emailType:       'REMINDER',
                status:          deliveryStatus,
                retryCount,
                recipientCount:  emails.length,
                recipientEmails: emails.join(', '),
                groupLabel:      groupLbl,
            });
        }

        res.json({
            message:     `Reminders sent to ${totalSent} group(s). ${totalFailed} failed.`,
            totalSent,
            totalFailed,
        });

    } catch (err) {
        console.error('[sendReminderBlast]', err);
        res.status(500).json({ error: err.message });
    }
};

// ───────── RESEND EMAIL TO SPECIFIC GROUP (per-row action in 5.7) ─────────
// POST /api/evaluation-scheduling/email-logs/:logId/resend

exports.resendGroupEmail = async (req, res) => {
    // Compliance: email resend disabled.
    return res.status(501).json({ message: "Email notifications are disabled." });
    try {
        const logId = Number(req.params.logId);
        if (!logId) return res.status(400).json({ message: 'Invalid log ID.' });

        const pool = await sql.connect(config);

        const logRes = await pool.request()
            .input('id', sql.Int, logId)
            .query(`
                SELECT
                    el.email_log_id,
                    el.evaluation_schedule_id,
                    el.email_type,
                    el.recipient_emails,
                    el.group_label,
                    el.retry_count,
                    es.schedule_title, es.date,
                    CONVERT(VARCHAR, es.start_time, 108) AS start_time,
                    CONVERT(VARCHAR, es.end_time,   108) AS end_time,
                    loc.location_name, loc.room_number
                FROM evaluation_email_log el
                JOIN evaluation_schedule es  ON es.evaluation_schedule_id = el.evaluation_schedule_id
                LEFT JOIN evaluation_location loc ON loc.location_id = es.location_id
                WHERE el.email_log_id = @id
            `);

        if (!logRes.recordset.length)
            return res.status(404).json({ message: 'Email log not found.' });

        const log    = logRes.recordset[0];
        const emails = (log.recipient_emails || '').split(',').map(e => e.trim()).filter(Boolean);

        if (!emails.length)
            return res.status(400).json({ message: 'No recipient emails found for this log entry.' });

        const scheduleInfo = {
            schedule_title: log.schedule_title,
            date:           log.date,
            start_time:     log.start_time,
            end_time:       log.end_time,
            location_name:  log.location_name,
            room_number:    log.room_number,
        };

        let newStatus  = 'SENT';
        let retryCount = (log.retry_count || 0) + 1;

        try {
            if (log.email_type === 'SLOT_ASSIGNED') {
                await sendGroupSlotAssignedEmail(emails, log.group_label, scheduleInfo);
            } else if (log.email_type === 'REMINDER') {
                await sendGroupReminderEmail(emails, log.group_label, scheduleInfo);
            } else if (log.email_type === 'SCHEDULE_PUBLISHED') {
                await sendGroupSlotAssignedEmail(emails, log.group_label, scheduleInfo);
            } else {
                await sendGroupSlotAssignedEmail(emails, log.group_label, scheduleInfo);
            }
        } catch (err) {
            console.error('[resendGroupEmail] Failed:', err.message);
            newStatus = 'FAILED';
        }

        await updateEmailLog(pool, { logId, status: newStatus, retryCount });

        res.json({
            message:    newStatus === 'SENT' ? 'Email resent successfully.' : 'Resend failed.',
            status:     newStatus,
            retryCount,
        });

    } catch (err) {
        console.error('[resendGroupEmail]', err);
        res.status(500).json({ error: err.message });
    }
};