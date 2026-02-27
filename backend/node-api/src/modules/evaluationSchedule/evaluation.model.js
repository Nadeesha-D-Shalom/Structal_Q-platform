const sql = require("mssql");
const config = require("../../config/db");

exports.createSchedule = async (data) => {

  const pool = await sql.connect(config);

  const result = await pool.request()
    .input("assessment_id", sql.Int, data.assessment_id)
    .input("location_id", sql.Int, data.location_id)
    .input("date", sql.Date, data.date)
    .input("start_time", sql.Time, data.start_time)
    .input("end_time", sql.Time, data.end_time)
    .input("duration_per_group_minutes", sql.Int, data.duration_per_group_minutes)
    .input("buffer_minutes", sql.Int, data.buffer_minutes)
    .input("total_groups", sql.Int, data.total_groups)
    .query(`
      INSERT INTO evaluation_schedule
      (
        assessment_id,
        location_id,
        date,
        start_time,
        end_time,
        duration_per_group_minutes,
        buffer_minutes,
        total_groups,
        is_published,
        draft_version_no,
        status
      )
      OUTPUT INSERTED.evaluation_schedule_id
      VALUES
      (
        @assessment_id,
        @location_id,
        @date,
        @start_time,
        @end_time,
        @duration_per_group_minutes,
        @buffer_minutes,
        @total_groups,
        0,
        1,
        'DRAFT'
      )
    `);

  return result.recordset[0].evaluation_schedule_id;
};