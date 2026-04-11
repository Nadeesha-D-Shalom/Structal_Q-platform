import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createTimetable,
  getTimetableConflictMessage,
  notifyTimetablePublished,
} from '../../services/timetableService';
import './CreateTimetable.css';

function getErrorMessage(err) {
  return err?.response?.data?.message || err?.response?.data || err?.message || 'Request failed.';
}

/** YYYY-MM-DD in local timezone (for `<input type="date" min>` and comparisons). */
function getLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CreateTimetable() {
  const navigate = useNavigate();
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [semester, setSemester] = useState('First Semester');
  const [subject, setSubject] = useState('CS402 - Advanced Algorithms');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hall, setHall] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handlePublish(e) {
    e.preventDefault();
    setError('');
    const hallTrimmed = hall.trim();
    if (hallTrimmed.length < 3 || hallTrimmed.length > 80) {
      setError('Location / venue must be between 3 and 80 characters.');
      return;
    }
    const todayStr = getLocalDateString();
    if (examDate && examDate < todayStr) {
      setError('Exam date cannot be in the past.');
      return;
    }
    setSubmitting(true);
    try {
      await createTimetable({
        subject: subject.trim(),
        exam_date: examDate,
        start_time: startTime,
        end_time: endTime,
        hall: hall.trim(),
        status: 'Published',
        academic_year: academicYear,
        semester,
        title: `${subject.trim()} — ${examDate}`,
      });
      notifyTimetablePublished();
      navigate('/view');
    } catch (err) {
      const conflictMessage = getTimetableConflictMessage(err);
      setError(conflictMessage || getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="createExamTimetable">
      <header className="createExamTimetable__header">
        <button type="button" className="createExamTimetable__back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Create Exam Timetable</h2>
        <p>Schedule new examinations and manage venue allocations for the upcoming academic period.</p>
      </header>

      <div className="card">
        {error ? (
          <p className="createExamTimetable__error">
            {String(error)}
          </p>
        ) : null}
        <form className="formGrid" onSubmit={handlePublish}>
          <div className="formGrid__row">
            <label className="field">
              <span>Academic Year</span>
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </label>

            <label className="field">
              <span>Semester</span>
              <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
              </select>
            </label>

            <label className="field">
              <span>Subject / Course</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="CS402 - Advanced Algorithms">CS402 - Advanced Algorithms</option>
              </select>
            </label>
          </div>

          <div className="formGrid__row">
            <label className="field">
              <span>Exam Date</span>
              <input
                type="date"
                min={getLocalDateString()}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Start Time</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required step={60} />
            </label>

            <label className="field">
              <span>End Time</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required step={60} />
            </label>

            <label className="field">
              <span>Location / Venue</span>
              <input
                placeholder="e.g. Grand Hall A, Room 302"
                value={hall}
                onChange={(e) => setHall(e.target.value)}
                required
                minLength={3}
                maxLength={80}
                aria-describedby="create-hall-hint"
              />
              <span id="create-hall-hint" className="field__hint">
                3–80 characters
              </span>
            </label>
          </div>

          <div className="statusBar">
            <div className="statusBar__info">
              <strong>Conflict Detection System</strong>
              <span>Server validates overlaps for the same hall and date.</span>
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish Exam Timetable'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
