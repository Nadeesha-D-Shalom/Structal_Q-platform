const sql = require('mssql');


// Create location
exports.createLocation = async (req, res) => {
    const {
        location_name,
        building_name,
        room_number,
        capacity,
        available_from,
        available_to
    } = req.body;

    if (!location_name)
        return res.status(400).json({ message: "location_name is required" });

    try {
        const pool = await sql.connect();

        await pool.request()
            .input('location_name', sql.VarChar(150), location_name)
            .input('building_name', sql.VarChar(150), building_name)
            .input('room_number', sql.VarChar(50), room_number)
            .input('capacity', sql.Int, capacity)
            .input('available_from', sql.Time, available_from)
            .input('available_to', sql.Time, available_to)
            .query(`
                INSERT INTO evaluation_location
                (location_name, building_name, room_number,
                 capacity, available_from, available_to)
                VALUES
                (@location_name, @building_name, @room_number,
                 @capacity, @available_from, @available_to)
            `);

        res.status(201).json({ message: "Location created successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get all active locations
exports.getAllLocations = async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request()
            .query(`
                SELECT * FROM evaluation_location
                WHERE status = 'ACTIVE'
                ORDER BY location_name ASC
            `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



//Managing schedules

// Create schedule + Auto slot generation
exports.createSchedule = async (req, res) => {

    const {
        assessment_id,
        location_id,
        schedule_title,
        date,
        start_time,
        end_time,
        duration_per_group_minutes,
        buffer_minutes = 5,
        total_groups,
        created_by
    } = req.body;

    if (!assessment_id || !location_id || !date || !start_time || !end_time || !total_groups || !created_by)
        return res.status(400).json({ message: "Missing required fields" });

    try {
        const pool = await sql.connect();

        //Location conflict chcek
        const conflict = await pool.request()
            .input('location_id', sql.Int, location_id)
            .input('date', sql.Date, date)
            .input('start_time', sql.Time, start_time)
            .input('end_time', sql.Time, end_time)
            .query(`
                SELECT evaluation_schedule_id
                FROM evaluation_schedule
                WHERE location_id = @location_id
                  AND date = @date
                  AND status IN ('DRAFT','PUBLISHED')
                  AND NOT (@end_time <= start_time OR @start_time >= end_time)
            `);

        if (conflict.recordset.length > 0) {

            await pool.request()
                .input('evaluation_schedule_id', sql.Int, conflict.recordset[0].evaluation_schedule_id)
                .input('conflict_type', sql.VarChar(50), 'LOCATION_CONFLICT')
                .input('conflict_description', sql.VarChar(500),
                    `Location already booked on ${date}`)
                .query(`
                    INSERT INTO evaluation_conflict_log
                    (evaluation_schedule_id, conflict_type, conflict_description)
                    VALUES
                    (@evaluation_schedule_id, @conflict_type, @conflict_description)
                `);

            return res.status(409).json({ message: "Location conflict detected" });
        }

        //Insert scehdule
        const result = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .input('location_id', sql.Int, location_id)
            .input('schedule_title', sql.VarChar(200), schedule_title)
            .input('date', sql.Date, date)
            .input('start_time', sql.Time, start_time)
            .input('end_time', sql.Time, end_time)
            .input('duration', sql.Int, duration_per_group_minutes)
            .input('buffer', sql.Int, buffer_minutes)
            .input('total_groups', sql.Int, total_groups)
            .input('created_by', sql.Int, created_by)
            .query(`
                INSERT INTO evaluation_schedule
                (assessment_id, location_id, schedule_title,
                 date, start_time, end_time,
                 duration_per_group_minutes,
                 buffer_minutes, total_groups, created_by)
                OUTPUT INSERTED.evaluation_schedule_id
                VALUES
                (@assessment_id, @location_id, @schedule_title,
                 @date, @start_time, @end_time,
                 @duration, @buffer, @total_groups, @created_by)
            `);

        const scheduleId = result.recordset[0].evaluation_schedule_id;

        //Auto slot generation
        const toMinutes = t => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const toTime = mins =>
            `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

        let current = toMinutes(start_time);
        const end = toMinutes(end_time);

        for (let i = 1; i <= total_groups; i++) {

            const slotEnd = current + duration_per_group_minutes;
            if (slotEnd > end) break;

            await pool.request()
                .input('sid', sql.Int, scheduleId)
                .input('seq', sql.Int, i)
                .input('st', sql.Time, toTime(current))
                .input('et', sql.Time, toTime(slotEnd))
                .query(`
                    INSERT INTO evaluation_slot
                    (evaluation_schedule_id, slot_sequence_no,
                     slot_start_time, slot_end_time)
                    VALUES
                    (@sid, @seq, @st, @et)
                `);

            current = slotEnd + buffer_minutes;
        }

        res.status(201).json({
            message: "Schedule created with slots",
            schedule_id: scheduleId
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



//Publish schedule

exports.publishSchedule = async (req, res) => {

    const { published_by } = req.body;

    if (!published_by)
        return res.status(400).json({ message: "published_by required" });

    try {
        const pool = await sql.connect();

        // Update Schedule
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('published_by', sql.Int, published_by)
            .query(`
                UPDATE evaluation_schedule
                SET is_published = 1,
                    published_at = GETDATE(),
                    published_by = @published_by,
                    status = 'PUBLISHED',
                    draft_version_no = draft_version_no + 1
                WHERE evaluation_schedule_id = @id
            `);

        // Record publication history
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('published_by', sql.Int, published_by)
            .query(`
                INSERT INTO evaluation_publication_status
                (evaluation_schedule_id, published_by)
                VALUES (@id, @published_by)
            `);

        res.json({ message: "Schedule published successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



//Assign groups to slot

exports.assignGroupToSlot = async (req, res) => {

    const { group_id, assigned_by } = req.body;

    if (!group_id || !assigned_by)
        return res.status(400).json({ message: "group_id and assigned_by required" });

    try {
        const pool = await sql.connect();

        await pool.request()
            .input('slot_id', sql.Int, req.params.slotId)
            .input('group_id', sql.Int, group_id)
            .input('assigned_by', sql.Int, assigned_by)
            .query(`
                INSERT INTO evaluation_group_assignment
                (evaluation_slot_id, group_id, assigned_by)
                VALUES (@slot_id, @group_id, @assigned_by)
            `);

        await pool.request()
            .input('slot_id', sql.Int, req.params.slotId)
            .query(`
                UPDATE evaluation_slot
                SET slot_status = 'ASSIGNED'
                WHERE evaluation_slot_id = @slot_id
            `);

        res.status(201).json({ message: "Group assigned successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



//Cancel schedule

exports.cancelSchedule = async (req, res) => {
    try {
        const pool = await sql.connect();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE evaluation_schedule
                SET status = 'CANCELLED',
                    updated_at = GETDATE()
                WHERE evaluation_schedule_id = @id
            `);

        res.json({ message: "Schedule cancelled successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


//Get conflicts

exports.getConflicts = async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT * FROM evaluation_conflict_log
                WHERE evaluation_schedule_id = @id
                ORDER BY detected_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};