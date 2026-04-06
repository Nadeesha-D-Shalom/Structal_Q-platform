import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  getTimetable,
  TIMETABLE_REFRESH_KEY,
  TIMETABLE_UPDATED_EVENT,
} from '../../services/timetableService';
import './ViewTimetableStudent.css';

function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.timetable)) return data.timetable;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

function getItemField(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value != null) return value;
  }
  return '';
}

function getErrorMessage(err) {
  return err?.response?.data?.message || err?.response?.data || err?.message || 'Request failed.';
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function formatDateForDisplay(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return raw;
  return date.toLocaleDateString('en-GB');
}

function parseYearNumber(value) {
  const s = normalizeText(value);
  const m = s.match(/[1-4]/);
  return m ? Number(m[0]) : null;
}

function parseSemesterNumber(value) {
  const s = normalizeText(value);
  if (!s) return null;
  if (s.includes('1') || s.includes('first') || s.includes('s1')) return 1;
  if (s.includes('2') || s.includes('second') || s.includes('s2')) return 2;
  return null;
}

export default function ViewTimetableStudent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!mounted) return;
      setLoading(true);
      setError('');
      try {
        const dbFilters = {
          academic_year: academicYearFilter === 'all' ? undefined : academicYearFilter,
          semester: semesterFilter === 'all' ? undefined : semesterFilter,
          subject: subjectFilter === 'all' ? undefined : subjectFilter,
        };
        const res = await getTimetable('Student', dbFilters);
        if (!mounted) return;
        setItems(normalizeItems(res.data));
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    /** Another tab (admin) published — refresh this view. */
    function onStorage(e) {
      if (e.key === TIMETABLE_REFRESH_KEY && e.newValue) load();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener(TIMETABLE_UPDATED_EVENT, load);

    /** Same machine: tab back to student view after admin publishes. */
    function onVisible() {
      if (document.visibilityState === 'visible') load();
    }
    document.addEventListener('visibilitychange', onVisible);

    /** Timetable can change while this page stays open. */
    const pollMs = 45000;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, pollMs);

    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(TIMETABLE_UPDATED_EVENT, load);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [academicYearFilter, semesterFilter, subjectFilter]);

  const subjectOptions = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      const subject = String(getItemField(item, ['subject', 'Subject'])).trim();
      if (subject) set.add(subject);
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const subject = String(getItemField(item, ['subject', 'Subject']));
      const academicYear = String(
        getItemField(item, ['academicYear', 'academic_year', 'year', 'Year', 'batch', 'Batch'])
      );
      const semester = String(getItemField(item, ['semester', 'Semester', 'term', 'Term']));

      const matchesAcademicYear =
        academicYearFilter === 'all' || (() => {
          const dbYear = parseYearNumber(academicYear);
          const selectedYear = parseYearNumber(academicYearFilter);
          if (dbYear != null && selectedYear != null) return dbYear === selectedYear;
          return normalizeText(academicYear) === normalizeText(academicYearFilter);
        })();
      if (!matchesAcademicYear) return false;

      const matchesSemester =
        semesterFilter === 'all' || (() => {
          const dbSem = parseSemesterNumber(semester);
          const selectedSem = parseSemesterNumber(semesterFilter);
          if (dbSem != null && selectedSem != null) return dbSem === selectedSem;
          return normalizeText(semester) === normalizeText(semesterFilter);
        })();
      if (!matchesSemester) return false;

      const matchesSubject =
        subjectFilter === 'all' || normalizeText(subject) === normalizeText(subjectFilter);
      return matchesSubject;
    });
  }, [items, academicYearFilter, semesterFilter, subjectFilter]);

  function handleExportPdf() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const now = new Date();
    const left = 40;
    let y = 44;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Student Exam Timetable', left, y);

    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated: ${now.toLocaleString()}`, left, y);

    y += 18;
    const filtersText = [
      `Academic Year: ${academicYearFilter === 'all' ? 'All' : academicYearFilter}`,
      `Semester: ${semesterFilter === 'all' ? 'All' : semesterFilter}`,
      `Subject: ${subjectFilter === 'all' ? 'All' : subjectFilter}`,
    ].join('   |   ');
    doc.text(filtersText, left, y);

    y += 22;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);

    const columns = [
      { label: 'Subject', x: 40, w: 240 },
      { label: 'Date', x: 290, w: 140 },
      { label: 'Time', x: 440, w: 200 },
      { label: 'Hall', x: 650, w: 130 },
    ];

    columns.forEach((col) => doc.text(col.label, col.x, y));
    y += 8;
    doc.setDrawColor(203, 213, 225);
    doc.line(left, y, 800, y);
    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (!filtered.length) {
      doc.text('No timetable entries found for selected filters.', left, y);
    } else {
      filtered.forEach((item) => {
        const subject = String(getItemField(item, ['subject', 'Subject'])) || '—';
        const date = formatDateForDisplay(getItemField(item, ['exam_date', 'date', 'Date']));
        const startTime = String(getItemField(item, ['startTime', 'start_time', 'StartTime']));
        const endTime = String(getItemField(item, ['endTime', 'end_time', 'EndTime']));
        const hall = String(getItemField(item, ['hall', 'Hall', 'location', 'Location', 'venue', 'Venue'])) || '—';
        const timeText = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || '—';

        if (y > 560) {
          doc.addPage();
          y = 52;
        }

        doc.text(subject.slice(0, 38), 40, y);
        doc.text(date, 290, y);
        doc.text(timeText.slice(0, 25), 440, y);
        doc.text(hall.slice(0, 20), 650, y);
        y += 18;
      });
    }

    const filename = `student-timetable-${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }

  return (
    <section className="vts">
      <header className="vts__header">
        <h2 className="vts__title">Student Timetable</h2>
        <p className="vts__subtitle">View upcoming exams and class timetable entries.</p>
      </header>

      <div className="vts__toolbar">
        <label className="vts__filterField">
          <span className="vts__filterLabel">Academic Year</span>
          <select
            className="vts__control vts__select"
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
          >
            <option value="all">All Academic Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </label>

        <label className="vts__filterField">
          <span className="vts__filterLabel">Semester</span>
          <select
            className="vts__control vts__select"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="all">All Semesters</option>
            <option value="First Semester">First Semester</option>
            <option value="Second Semester">Second Semester</option>
          </select>
        </label>

        <label className="vts__filterField vts__filterField--grow">
          <span className="vts__filterLabel">Subject</span>
          <select
            className="vts__control vts__select"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjectOptions
              .filter((opt) => opt !== 'all')
              .map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
          </select>
        </label>

        <button type="button" className="vts__exportBtn" onClick={handleExportPdf}>
          Export PDF
        </button>
      </div>

      <div className="vts__card">
        <table className="vts__table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Date</th>
              <th>Time</th>
              <th>Hall</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="vts__state">
                  Loading...
                </td>
              </tr>
            ) : null}

            {error ? (
              <tr>
                <td colSpan={4} className="vts__state vts__state--error">
                  {String(error)}
                </td>
              </tr>
            ) : null}

            {!loading && !error && !filtered.length ? (
              <tr>
                <td colSpan={4} className="vts__state">
                  No timetable entries found.
                </td>
              </tr>
            ) : null}

            {!loading && !error
              ? filtered.map((item) => {
                  const subject = String(getItemField(item, ['subject', 'Subject']));
                  const date = String(getItemField(item, ['exam_date', 'date', 'Date']));
                  const startTime = String(getItemField(item, ['startTime', 'start_time', 'StartTime']));
                  const endTime = String(getItemField(item, ['endTime', 'end_time', 'EndTime']));
                  const hall = String(getItemField(item, ['hall', 'Hall', 'location', 'Location', 'venue', 'Venue']));
                  const id = getItemField(item, ['_id', 'id']) || `${subject}-${date}-${startTime}-${hall}`;

                  return (
                    <tr key={String(id)}>
                      <td className="vts__subject">{subject || '—'}</td>
                      <td>{date || '—'}</td>
                      <td>{startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || '—'}</td>
                      <td>{hall || '—'}</td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

