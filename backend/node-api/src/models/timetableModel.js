const { sql, pool, poolConnect } = require('../config/db');

const TABLE = 'exam_timetable';

let cachedIsFlat = null;

async function getPool() {
  await poolConnect;
  return pool;
}

/**
 * Flat DDL (exam_timetable.sql) has columns subject + exam_date on exam_timetable.
 * ERD DDL uses exam_timetable as header + exam_session rows.
 */
async function isFlatSchema(pool) {
  if (cachedIsFlat != null) return cachedIsFlat;
  const r = await pool.request().query(`
    SELECT 1 AS ok
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.exam_timetable') AND name = N'subject'
  `);
  cachedIsFlat = r.recordset.length > 0;
  return cachedIsFlat;
}

function parseSubjectLine(line) {
  const s = String(line || '').trim();
  const dash = s.indexOf(' - ');
  if (dash > 0) {
    return {
      code: s.slice(0, dash).trim(),
      name: s.slice(dash + 3).trim() || s.slice(0, dash).trim(),
    };
  }
  const space = s.indexOf(' ');
  if (space > 0) {
    return { code: s.slice(0, space).trim(), name: s.slice(space + 1).trim() };
  }
  return { code: s, name: s };
}

async function getDefaultCreatedBy(transaction) {
  const req = new sql.Request(transaction);
  const r = await req.query(`
    SELECT TOP 1 user_id AS uid FROM dbo.[user] ORDER BY user_id
  `);
  const uid = r.recordset[0]?.uid;
  if (uid == null) {
    throw new Error(
      'Database has no users. Insert at least one row into dbo.[user] (created_by is required for exam_timetable).',
    );
  }
  return uid;
}

async function ensureSubject(transaction, subjectLine) {
  const { code, name } = parseSubjectLine(subjectLine);
  await new sql.Request(transaction)
    .input('code', sql.NVarChar(255), code)
    .input('name', sql.NVarChar(255), name)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.subject WHERE subject_code = @code)
      BEGIN
        INSERT INTO dbo.subject (subject_code, subject_name, status, created_at, updated_at)
        VALUES (@code, @name, N'ACTIVE', GETDATE(), GETDATE())
      END
    `);
  const r2 = await new sql.Request(transaction)
    .input('code', sql.NVarChar(255), code)
    .query(`SELECT subject_id FROM dbo.subject WHERE subject_code = @code`);
  return r2.recordset[0].subject_id;
}

async function ensureRoom(transaction, hall) {
  const h = String(hall || '').trim();
  await new sql.Request(transaction).input('hall', sql.NVarChar(255), h).query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.exam_room WHERE room_name = @hall)
    BEGIN
      INSERT INTO dbo.exam_room (room_name, created_at)
      VALUES (@hall, GETDATE())
    END
  `);
  const r2 = await new sql.Request(transaction)
    .input('hall', sql.NVarChar(255), h)
    .query(`SELECT room_id FROM dbo.exam_room WHERE room_name = @hall`);
  return r2.recordset[0].room_id;
}

/** --- Flat schema (original) --- */

async function getFirstConflictFlat({ examDate, hall, startTime, endTime, excludeId }) {
  const pool = await getPool();
  const request = pool
    .request()
    .input('exam_date', sql.Date, examDate)
    .input('hall', sql.NVarChar(200), hall)
    .input('start_time', sql.VarChar(16), startTime)
    .input('end_time', sql.VarChar(16), endTime);

  let q = `
    SELECT TOP 1
      id AS conflict_id,
      subject,
      exam_date,
      start_time,
      end_time,
      hall
    FROM ${TABLE}
    WHERE exam_date = @exam_date
      AND hall = @hall
      AND CAST(start_time AS TIME) < CAST(@end_time AS TIME)
      AND CAST(end_time AS TIME) > CAST(@start_time AS TIME)
  `;
  if (excludeId != null) {
    request.input('exclude_id', sql.Int, excludeId);
    q += ` AND id <> @exclude_id`;
  }
  const result = await request.query(q);
  const row = result.recordset[0] ?? null;
  return row ? mapSessionRow(row) : null;
}

async function createTimetableFlat(row) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('subject', sql.NVarChar(300), row.subject)
    .input('exam_date', sql.Date, row.exam_date)
    .input('start_time', sql.VarChar(16), row.start_time)
    .input('end_time', sql.VarChar(16), row.end_time)
    .input('hall', sql.NVarChar(200), row.hall)
    .input('status', sql.NVarChar(20), row.status)
    .query(`
      INSERT INTO ${TABLE} (subject, exam_date, start_time, end_time, hall, status, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES (@subject, @exam_date, CAST(@start_time AS TIME), CAST(@end_time AS TIME), @hall, @status, GETDATE(), GETDATE())
    `);
  return result.recordset[0].id;
}

async function findAllFlat({ publishedOnly, subject }) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];
  if (publishedOnly) where.push(`status = N'Published'`);
  if (subject) {
    request.input('subject_like', sql.NVarChar(300), `%${String(subject).trim()}%`);
    where.push(`subject LIKE @subject_like`);
  }
  let q = `SELECT id, subject, exam_date, start_time, end_time, hall, status, created_at, updated_at FROM ${TABLE}`;
  if (where.length) q += ` WHERE ${where.join(' AND ')}`;
  q += ` ORDER BY exam_date, start_time, hall`;
  const result = await request.query(q);
  return result.recordset;
}

function normalizeTimeCell(v) {
  if (v == null) return v;
  if (v instanceof Date) {
    const h = v.getHours();
    const m = v.getMinutes();
    const s = v.getSeconds();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${s ? `:${String(s).padStart(2, '0')}` : ''}`;
  }
  return v;
}

function mapSessionRow(r) {
  if (!r) return r;
  return {
    ...r,
    exam_date: r.exam_date instanceof Date ? r.exam_date.toISOString().slice(0, 10) : r.exam_date,
    start_time: normalizeTimeCell(r.start_time),
    end_time: normalizeTimeCell(r.end_time),
  };
}

async function findByIdFlat(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(
      `SELECT id, subject, exam_date, start_time, end_time, hall, status, created_at, updated_at FROM ${TABLE} WHERE id = @id`,
    );
  const row = result.recordset[0] ?? null;
  return row ? mapSessionRow(row) : null;
}

async function updateTimetableFlat(id, row) {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('subject', sql.NVarChar(300), row.subject)
    .input('exam_date', sql.Date, row.exam_date)
    .input('start_time', sql.VarChar(16), row.start_time)
    .input('end_time', sql.VarChar(16), row.end_time)
    .input('hall', sql.NVarChar(200), row.hall)
    .input('status', sql.NVarChar(20), row.status)
    .query(`
      UPDATE ${TABLE}
      SET subject = @subject, exam_date = @exam_date,
          start_time = CAST(@start_time AS TIME), end_time = CAST(@end_time AS TIME),
          hall = @hall, status = @status, updated_at = GETDATE()
      WHERE id = @id
    `);
}

async function deleteTimetableFlat(id) {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, id).query(`DELETE FROM ${TABLE} WHERE id = @id`);
  return result.rowsAffected[0] > 0;
}

async function publishTimetableFlat(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE ${TABLE}
      SET status = N'Published', updated_at = GETDATE()
      WHERE id = @id AND status = N'Draft'
    `);
  return result.rowsAffected[0] > 0;
}

/** --- ERD schema (exam_timetable + exam_session) --- */

async function getFirstConflictErd({ examDate, hall, startTime, endTime, excludeId }) {
  const pool = await getPool();
  const request = pool
    .request()
    .input('exam_date', sql.Date, examDate)
    .input('hall', sql.NVarChar(255), hall)
    .input('start_time', sql.VarChar(16), startTime)
    .input('end_time', sql.VarChar(16), endTime);

  let q = `
    SELECT TOP 1
      es.exam_session_id AS conflict_id,
      LTRIM(RTRIM(
        CASE WHEN NULLIF(LTRIM(RTRIM(s.subject_code)), N'') IS NULL THEN N''
        ELSE s.subject_code + N' - ' END + ISNULL(s.subject_name, N'')
      )) AS subject,
      es.exam_date AS exam_date,
      LEFT(CONVERT(varchar(8), es.start_time, 108), 5) AS start_time,
      LEFT(CONVERT(varchar(8), es.end_time, 108), 5) AS end_time,
      r.room_name AS hall
    FROM dbo.exam_session es
    INNER JOIN dbo.exam_room r ON r.room_id = es.room_id
    INNER JOIN dbo.subject s ON s.subject_id = es.subject_id
    WHERE es.exam_date = @exam_date
      AND r.room_name = @hall
      AND CAST(es.start_time AS time) < CAST(@end_time AS time)
      AND CAST(es.end_time AS time) > CAST(@start_time AS time)
  `;
  if (excludeId != null) {
    const bid = typeof excludeId === 'bigint' ? excludeId : BigInt(excludeId);
    request.input('exclude_id', sql.BigInt, bid);
    q += ` AND es.exam_session_id <> @exclude_id`;
  }
  const result = await request.query(q);
  const row = result.recordset[0] ?? null;
  return row ? mapSessionRow(row) : null;
}

async function createTimetableErd(row) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const createdBy = await getDefaultCreatedBy(transaction);
    const subjectId = await ensureSubject(transaction, row.subject);
    const roomId = await ensureRoom(transaction, row.hall);

    const isPublished = String(row.status) === 'Published' ? 1 : 0;
    const academicYear = row.academic_year || '2023 / 2024';
    const semester = row.semester || 'First Semester';
    const title = (row.title || row.subject || 'Exam timetable').slice(0, 255);

    const insTt = await new sql.Request(transaction)
      .input('academic_year', sql.NVarChar(255), academicYear)
      .input('semester', sql.NVarChar(255), semester)
      .input('title', sql.NVarChar(255), title)
      .input('is_published', sql.Bit, isPublished)
      .input('created_by', sql.BigInt, BigInt(createdBy))
      .input('status', sql.NVarChar(50), row.status)
      .query(`
        INSERT INTO dbo.exam_timetable (
          academic_year, semester, title, draft_version_no,
          is_published, published_at, created_by, created_at, updated_at, status
        )
        OUTPUT INSERTED.exam_timetable_id AS tid
        VALUES (
          @academic_year, @semester, @title, 1,
          @is_published,
          CASE WHEN @is_published = 1 THEN GETDATE() ELSE NULL END,
          @created_by, GETDATE(), GETDATE(), @status
        )
      `);

    const timetableId = insTt.recordset[0].tid;
    const sessionStatus = isPublished ? 'PUBLISHED' : 'DRAFT';

    const insEs = await new sql.Request(transaction)
      .input('exam_timetable_id', sql.BigInt, BigInt(timetableId))
      .input('subject_id', sql.BigInt, BigInt(subjectId))
      .input('room_id', sql.BigInt, BigInt(roomId))
      .input('exam_date', sql.Date, row.exam_date)
      .input('start_time', sql.VarChar(16), row.start_time)
      .input('end_time', sql.VarChar(16), row.end_time)
      .input('session_status', sql.NVarChar(50), sessionStatus)
      .query(`
        INSERT INTO dbo.exam_session (
          exam_timetable_id, subject_id, room_id, exam_type,
          exam_date, start_time, end_time, session_status, created_at, updated_at
        )
        OUTPUT INSERTED.exam_session_id AS sid
        VALUES (
          @exam_timetable_id, @subject_id, @room_id, N'THEORY',
          @exam_date, CAST(@start_time AS time), CAST(@end_time AS time),
          @session_status, GETDATE(), GETDATE()
        )
      `);

    const sessionId = insEs.recordset[0].sid;
    await transaction.commit();

    return typeof sessionId === 'bigint' ? Number(sessionId) : sessionId;
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

async function findAllErd({ publishedOnly, academicYear, semester, subject }) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];
  if (publishedOnly) {
    where.push(`(et.is_published = 1 OR LOWER(LTRIM(RTRIM(ISNULL(et.status, N'')))) LIKE N'%publish%')`);
  }
  if (academicYear) {
    request.input('academic_year', sql.NVarChar(255), String(academicYear).trim());
    where.push(`LOWER(LTRIM(RTRIM(ISNULL(et.academic_year, N'')))) = LOWER(LTRIM(RTRIM(@academic_year)))`);
  }
  if (semester) {
    request.input('semester', sql.NVarChar(255), String(semester).trim());
    where.push(`LOWER(LTRIM(RTRIM(ISNULL(et.semester, N'')))) = LOWER(LTRIM(RTRIM(@semester)))`);
  }
  if (subject) {
    request.input('subject_like', sql.NVarChar(255), `%${String(subject).trim()}%`);
    where.push(
      `(s.subject_code LIKE @subject_like OR s.subject_name LIKE @subject_like OR (ISNULL(s.subject_code, N'') + N' - ' + ISNULL(s.subject_name, N'')) LIKE @subject_like)`
    );
  }

  let q = `
    SELECT
      es.exam_session_id AS id,
      LTRIM(RTRIM(
        CASE WHEN NULLIF(LTRIM(RTRIM(s.subject_code)), N'') IS NULL THEN N''
        ELSE s.subject_code + N' - ' END + ISNULL(s.subject_name, N'')
      )) AS subject,
      es.exam_date AS exam_date,
      LEFT(CONVERT(varchar(8), es.start_time, 108), 5) AS start_time,
      LEFT(CONVERT(varchar(8), es.end_time, 108), 5) AS end_time,
      r.room_name AS hall,
      et.academic_year AS academic_year,
      et.semester AS semester,
      CASE WHEN et.is_published = 1 OR LOWER(LTRIM(RTRIM(ISNULL(et.status, N'')))) LIKE N'%publish%'
        THEN N'Published' ELSE N'Draft' END AS status,
      es.created_at AS created_at,
      es.updated_at AS updated_at
    FROM dbo.exam_session es
    INNER JOIN dbo.exam_timetable et ON et.exam_timetable_id = es.exam_timetable_id
    INNER JOIN dbo.subject s ON s.subject_id = es.subject_id
    INNER JOIN dbo.exam_room r ON r.room_id = es.room_id
  `;
  if (where.length) q += ` WHERE ${where.join(' AND ')}`;
  q += ` ORDER BY es.exam_date, es.start_time, r.room_name`;
  const result = await request.query(q);
  return result.recordset.map(mapSessionRow);
}

async function findByIdErd(id) {
  const pool = await getPool();
  const bid = typeof id === 'bigint' ? id : BigInt(id);
  const result = await pool.request().input('id', sql.BigInt, bid).query(`
    SELECT TOP 1
      es.exam_session_id AS id,
      LTRIM(RTRIM(
        CASE WHEN NULLIF(LTRIM(RTRIM(s.subject_code)), N'') IS NULL THEN N''
        ELSE s.subject_code + N' - ' END + ISNULL(s.subject_name, N'')
      )) AS subject,
      es.exam_date AS exam_date,
      LEFT(CONVERT(varchar(8), es.start_time, 108), 5) AS start_time,
      LEFT(CONVERT(varchar(8), es.end_time, 108), 5) AS end_time,
      r.room_name AS hall,
      CASE WHEN et.is_published = 1 OR LOWER(LTRIM(RTRIM(ISNULL(et.status, N'')))) LIKE N'%publish%'
        THEN N'Published' ELSE N'Draft' END AS status,
      es.created_at AS created_at,
      es.updated_at AS updated_at
    FROM dbo.exam_session es
    INNER JOIN dbo.exam_timetable et ON et.exam_timetable_id = es.exam_timetable_id
    INNER JOIN dbo.subject s ON s.subject_id = es.subject_id
    INNER JOIN dbo.exam_room r ON r.room_id = es.room_id
    WHERE es.exam_session_id = @id
  `);
  const row = result.recordset[0] ?? null;
  return row ? mapSessionRow(row) : null;
}

async function updateTimetableErd(id, row) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const subjectId = await ensureSubject(transaction, row.subject);
    const roomId = await ensureRoom(transaction, row.hall);
    const bid = typeof id === 'bigint' ? id : BigInt(id);
    const sessionStatus = String(row.status) === 'Published' ? 'PUBLISHED' : 'DRAFT';

    await new sql.Request(transaction)
      .input('id', sql.BigInt, bid)
      .input('subject_id', sql.BigInt, BigInt(subjectId))
      .input('room_id', sql.BigInt, BigInt(roomId))
      .input('exam_date', sql.Date, row.exam_date)
      .input('start_time', sql.VarChar(16), row.start_time)
      .input('end_time', sql.VarChar(16), row.end_time)
      .input('session_status', sql.NVarChar(50), sessionStatus)
      .query(`
        UPDATE es
        SET subject_id = @subject_id,
            room_id = @room_id,
            exam_date = @exam_date,
            start_time = CAST(@start_time AS time),
            end_time = CAST(@end_time AS time),
            session_status = @session_status,
            updated_at = GETDATE()
        FROM dbo.exam_session es
        WHERE es.exam_session_id = @id
      `);

    const isPublished = String(row.status) === 'Published' ? 1 : 0;
    await new sql.Request(transaction)
      .input('id', sql.BigInt, bid)
      .input('is_published', sql.Bit, isPublished)
      .input('status', sql.NVarChar(50), row.status)
      .query(`
        UPDATE et
        SET is_published = @is_published,
            status = @status,
            published_at = CASE WHEN @is_published = 1 THEN COALESCE(et.published_at, GETDATE()) ELSE et.published_at END,
            updated_at = GETDATE()
        FROM dbo.exam_timetable et
        INNER JOIN dbo.exam_session es ON es.exam_timetable_id = et.exam_timetable_id AND es.exam_session_id = @id
      `);

    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

async function deleteTimetableErd(id) {
  const pool = await getPool();
  const bid = typeof id === 'bigint' ? id : BigInt(id);
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const r0 = await new sql.Request(transaction).input('id', sql.BigInt, bid).query(`
      SELECT exam_timetable_id FROM dbo.exam_session WHERE exam_session_id = @id
    `);
    const tid = r0.recordset[0]?.exam_timetable_id;
    if (tid == null) {
      await transaction.rollback();
      return false;
    }

    await new sql.Request(transaction).input('id', sql.BigInt, bid).query(`
      DELETE FROM dbo.exam_session WHERE exam_session_id = @id
    `);

    const r1 = await new sql.Request(transaction)
      .input('tid', sql.BigInt, BigInt(tid))
      .query(`SELECT COUNT(*) AS c FROM dbo.exam_session WHERE exam_timetable_id = @tid`);
    if (Number(r1.recordset[0]?.c ?? 0) === 0) {
      await new sql.Request(transaction)
        .input('tid', sql.BigInt, BigInt(tid))
        .query(`DELETE FROM dbo.exam_timetable WHERE exam_timetable_id = @tid`);
    }

    await transaction.commit();
    return true;
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

async function publishTimetableErd(id) {
  const pool = await getPool();
  const bid = typeof id === 'bigint' ? id : BigInt(id);
  const result = await pool.request().input('id', sql.BigInt, bid).query(`
    UPDATE et
    SET is_published = 1,
        status = N'Published',
        published_at = COALESCE(et.published_at, GETDATE()),
        updated_at = GETDATE()
    FROM dbo.exam_timetable et
    INNER JOIN dbo.exam_session es ON es.exam_timetable_id = et.exam_timetable_id AND es.exam_session_id = @id
    WHERE ISNULL(et.is_published, 0) = 0
  `);

  const ra = result.rowsAffected;
  const n = Array.isArray(ra) ? ra.reduce((a, b) => a + b, 0) : Number(ra || 0);
  if (n > 0) {
    await pool.request().input('id', sql.BigInt, bid).query(`
      UPDATE dbo.exam_session
      SET session_status = N'PUBLISHED', updated_at = GETDATE()
      WHERE exam_session_id = @id
    `);
  }
  return n > 0;
}

/** --- Public API --- */

async function getFirstConflict(params) {
  const db = await getPool();
  const flat = await isFlatSchema(db);
  return flat ? getFirstConflictFlat(params) : getFirstConflictErd(params);
}

async function hasTimeConflict(params) {
  const row = await getFirstConflict(params);
  return row != null;
}

async function createTimetable(row) {
  const db = await getPool();
  const flat = await isFlatSchema(db);
  return flat ? createTimetableFlat(row) : createTimetableErd(row);
}

async function findAll(opts) {
  const db = await getPool();
  const flat = await isFlatSchema(db);
  const rows = flat ? await findAllFlat(opts) : await findAllErd(opts);
  return rows.map((r) => mapSessionRow(r));
}

async function findById(id) {
  const db = await getPool();
  const flat = await isFlatSchema(db);
  return flat ? findByIdFlat(id) : findByIdErd(id);
}

async function updateTimetable(id, row) {
  const db = await getPool();
  const flat = await isFlatSchema(db);
  return flat ? updateTimetableFlat(id, row) : updateTimetableErd(id, row);
}

async function deleteTimetable(id) {
  const db = await getPool();
  const flat = await isFlatSchema(db);
  return flat ? deleteTimetableFlat(id) : deleteTimetableErd(id);
}

async function publishTimetable(id) {
  const db = await getPool();
  const flat = await isFlatSchema(db);
  return flat ? publishTimetableFlat(id) : publishTimetableErd(id);
}

module.exports = {
  TABLE,
  hasTimeConflict,
  getFirstConflict,
  createTimetable,
  findAll,
  findById,
  updateTimetable,
  deleteTimetable,
  publishTimetable,
};
