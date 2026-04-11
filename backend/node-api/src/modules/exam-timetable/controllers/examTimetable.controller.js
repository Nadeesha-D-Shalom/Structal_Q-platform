const examTimetableModel = require('../models/examTimetable.model');

function formatConflictPayload(conflict) {
  const dateRaw = conflict?.exam_date;
  const dateStr =
    dateRaw instanceof Date
      ? dateRaw.toISOString().slice(0, 10)
      : String(dateRaw ?? '').slice(0, 10);
  const subject = String(conflict?.subject ?? 'Another exam').trim() || 'Another exam';
  const hall = String(conflict?.hall ?? '').trim();
  const st = String(conflict?.start_time ?? '').trim();
  const et = String(conflict?.end_time ?? '').trim();
  const message = `Schedule conflict: "${subject}" is already booked in ${hall || 'this venue'} on ${dateStr || '(unknown date)'} from ${st} to ${et}. Use a different time, date, or location.`;
  return {
    code: 'TIMETABLE_CONFLICT',
    message,
    conflict: {
      subject,
      exam_date: dateStr,
      hall,
      start_time: st,
      end_time: et,
      id: conflict?.conflict_id ?? conflict?.id,
    },
  };
}

/** ISO date YYYY-MM-DD */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Time HH:MM or HH:MM:SS (24h) */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Parses a time string to comparable minutes-from-midnight (for ordering validation).
 */
function timeToMinutes(t) {
  const parts = t.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts[2] != null ? parseInt(parts[2], 10) : 0;
  return h * 60 + m + s / 60;
}

/**
 * Validates required body fields for create/update.
 */
function validateTimetableBody(body) {
  const { subject, exam_date, start_time, end_time, hall, status } = body;

  if (!subject || String(subject).trim() === '') {
    return { ok: false, message: 'Field "subject" is required.' };
  }
  if (!exam_date || !DATE_RE.test(String(exam_date).trim())) {
    return { ok: false, message: 'Field "exam_date" must be in YYYY-MM-DD format.' };
  }
  if (!start_time || !TIME_RE.test(String(start_time).trim())) {
    return {
      ok: false,
      message: 'Field "start_time" must be in HH:MM or HH:MM:SS (24-hour) format.',
    };
  }
  if (!end_time || !TIME_RE.test(String(end_time).trim())) {
    return {
      ok: false,
      message: 'Field "end_time" must be in HH:MM or HH:MM:SS (24-hour) format.',
    };
  }
  if (!hall || String(hall).trim() === '') {
    return { ok: false, message: 'Field "hall" is required.' };
  }

  if (!status || !['Draft', 'Published'].includes(String(status))) {
    return {
      ok: false,
      message: 'Field "status" is required and must be "Draft" or "Published".',
    };
  }

  const st = String(start_time).trim();
  const et = String(end_time).trim();
  if (timeToMinutes(et) <= timeToMinutes(st)) {
    return { ok: false, message: 'end_time must be after start_time.' };
  }

  return { ok: true };
}

/**
 * POST /api/timetable — Admin only. Creates a timetable; checks hall/time conflicts.
 */
async function create(req, res) {
  const v = validateTimetableBody(req.body);
  if (!v.ok) {
    return res.status(400).json({ message: v.message });
  }

  const {
    subject,
    exam_date,
    start_time,
    end_time,
    hall,
    status,
    academic_year,
    semester,
    title,
  } = req.body;
  const row = {
    subject: String(subject).trim(),
    exam_date: String(exam_date).trim(),
    start_time: String(start_time).trim(),
    end_time: String(end_time).trim(),
    hall: String(hall).trim(),
    status: String(status),
    academic_year:
      academic_year != null && String(academic_year).trim() !== ''
        ? String(academic_year).trim()
        : undefined,
    semester:
      semester != null && String(semester).trim() !== '' ? String(semester).trim() : undefined,
    title: title != null && String(title).trim() !== '' ? String(title).trim() : undefined,
  };

  try {
    const conflict = await examTimetableModel.getFirstConflict({
      examDate: row.exam_date,
      hall: row.hall,
      startTime: row.start_time,
      endTime: row.end_time,
      excludeId: null,
    });
    if (conflict) {
      return res.status(409).json(formatConflictPayload(conflict));
    }

    const id = await examTimetableModel.createTimetable(row);
    const created = await examTimetableModel.findById(id);
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message || 'Server error',
      error: err.message,
    });
  }
}

/**
 * GET /api/timetable — Student sees only Published; Admin sees all.
 */
async function getAll(req, res) {
  const publishedOnly = req.userRole === 'Student';
  const academicYear =
    req.query?.academic_year != null && String(req.query.academic_year).trim() !== ''
      ? String(req.query.academic_year).trim()
      : undefined;
  const semester =
    req.query?.semester != null && String(req.query.semester).trim() !== ''
      ? String(req.query.semester).trim()
      : undefined;
  const subject =
    req.query?.subject != null && String(req.query.subject).trim() !== ''
      ? String(req.query.subject).trim()
      : undefined;

  function normalizeText(v) {
    return String(v ?? '').trim().toLowerCase();
  }

  function parseYearNumber(v) {
    const s = normalizeText(v);
    const m = s.match(/[1-4]/);
    return m ? Number(m[0]) : null;
  }

  function parseSemesterNumber(v) {
    const s = normalizeText(v);
    if (!s) return null;
    if (s.includes('1') || s.includes('first') || s.includes('s1')) return 1;
    if (s.includes('2') || s.includes('second') || s.includes('s2')) return 2;
    return null;
  }

  try {
    const rows = await examTimetableModel.findAll({
      publishedOnly,
      subject,
    });

    const filteredRows = rows.filter((row) => {
      if (academicYear) {
        const rowYear = parseYearNumber(row?.academic_year ?? row?.academicYear);
        const selectedYear = parseYearNumber(academicYear);
        const isYearMatch =
          rowYear != null && selectedYear != null
            ? rowYear === selectedYear
            : normalizeText(row?.academic_year ?? row?.academicYear) === normalizeText(academicYear);
        if (!isYearMatch) return false;
      }

      if (semester) {
        const rowSemester = parseSemesterNumber(row?.semester);
        const selectedSemester = parseSemesterNumber(semester);
        const isSemesterMatch =
          rowSemester != null && selectedSemester != null
            ? rowSemester === selectedSemester
            : normalizeText(row?.semester) === normalizeText(semester);
        if (!isSemesterMatch) return false;
      }

      return true;
    });

    return res.status(200).json(filteredRows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * GET /api/timetable/:id — Student may only open Published; Admin any.
 */
async function getById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid timetable id.' });
  }

  try {
    const row = await examTimetableModel.findById(id);
    if (!row) {
      return res.status(404).json({ message: 'Timetable not found.' });
    }
    if (req.userRole === 'Student' && row.status !== 'Published') {
      return res.status(403).json({
        message: 'Forbidden: only published timetables are visible to students.',
      });
    }
    return res.status(200).json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * PUT /api/timetable/:id — Admin only. Updates row; checks conflicts excluding this id.
 */
async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid timetable id.' });
  }

  const v = validateTimetableBody(req.body);
  if (!v.ok) {
    return res.status(400).json({ message: v.message });
  }

  const { subject, exam_date, start_time, end_time, hall, status } = req.body;
  const existing = await examTimetableModel.findById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Timetable not found.' });
  }

  const row = {
    subject: String(subject).trim(),
    exam_date: String(exam_date).trim(),
    start_time: String(start_time).trim(),
    end_time: String(end_time).trim(),
    hall: String(hall).trim(),
    status: String(status),
  };

  try {
    const conflict = await examTimetableModel.getFirstConflict({
      examDate: row.exam_date,
      hall: row.hall,
      startTime: row.start_time,
      endTime: row.end_time,
      excludeId: id,
    });
    if (conflict) {
      return res.status(409).json(formatConflictPayload(conflict));
    }

    await examTimetableModel.updateTimetable(id, row);
    const updated = await examTimetableModel.findById(id);
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * DELETE /api/timetable/:id — Admin only.
 */
async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid timetable id.' });
  }

  try {
    const ok = await examTimetableModel.deleteTimetable(id);
    if (!ok) {
      return res.status(404).json({ message: 'Timetable not found.' });
    }
    return res.status(200).json({ message: 'Timetable deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * PUT /api/timetable/publish/:id — Admin only. Draft → Published.
 */
async function publish(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid timetable id.' });
  }

  try {
    const existing = await examTimetableModel.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Timetable not found.' });
    }
    if (existing.status === 'Published') {
      return res.status(200).json({
        message: 'Timetable is already published.',
        data: existing,
      });
    }

    const examDate =
      existing.exam_date instanceof Date
        ? existing.exam_date.toISOString().slice(0, 10)
        : String(existing.exam_date ?? '').trim().slice(0, 10);

    const publishConflict = await examTimetableModel.getFirstConflict({
      examDate,
      hall: String(existing.hall ?? '').trim(),
      startTime: String(existing.start_time ?? '').trim(),
      endTime: String(existing.end_time ?? '').trim(),
      excludeId: id,
    });
    if (publishConflict) {
      return res.status(409).json(formatConflictPayload(publishConflict));
    }

    const changed = await examTimetableModel.publishTimetable(id);
    if (!changed) {
      return res.status(400).json({ message: 'Could not publish timetable.' });
    }
    const updated = await examTimetableModel.findById(id);
    return res.status(200).json({
      message: 'Timetable published successfully.',
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  publish,
};
