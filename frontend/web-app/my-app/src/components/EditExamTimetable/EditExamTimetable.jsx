import { useEffect, useMemo, useState } from 'react';
import './EditExamTimetable.css';
import { FALLBACK_SUBJECT_LABELS, fetchSubjectLabels } from '../../services/subjectService';

/** YYYY-MM-DD in local timezone (same as CreateTimetable). */
function getLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const EMPTY_FORM = {
  subject: '',
  date: '',
  startTime: '',
  endTime: '',
  hall: '',
  status: 'Draft',
};

function normalizeStatus(value) {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'published' ? 'Published' : 'Draft';
}

function normalizeForm(data) {
  if (!data) return { ...EMPTY_FORM };
  return {
    subject: data.subject ?? data.Subject ?? '',
    date: data.date ?? data.Date ?? '',
    startTime: data.startTime ?? data.start_time ?? data.StartTime ?? '',
    endTime: data.endTime ?? data.end_time ?? data.EndTime ?? '',
    hall: data.hall ?? data.Hall ?? data.location ?? data.Location ?? '',
    status: normalizeStatus(data.status ?? data.Status),
  };
}

export default function EditExamTimetable({ initialData, loading = false, onCancel, onSave }) {
  const [form, setForm] = useState(() => normalizeForm(initialData));
  const [errors, setErrors] = useState({});
  const [subjectOptions, setSubjectOptions] = useState([]);

  useEffect(() => {
    setForm(normalizeForm(initialData));
    setErrors({});
  }, [initialData]);

  useEffect(() => {
    let mounted = true;
    fetchSubjectLabels().then((labels) => {
      if (mounted) setSubjectOptions(labels);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const subjectSelectOptions = useMemo(() => {
    const base = subjectOptions.length ? subjectOptions : FALLBACK_SUBJECT_LABELS;
    const cur = form.subject.trim();
    if (cur && !base.includes(cur)) return [cur, ...base];
    return base;
  }, [subjectOptions, form.subject]);

  const canSubmit =
    !!(
      form.subject.trim() &&
      form.date.trim() &&
      form.startTime.trim() &&
      form.endTime.trim() &&
      form.hall.trim() &&
      !loading
    );

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.';
    if (!form.date.trim()) nextErrors.date = 'Date is required.';
    if (!form.startTime.trim()) nextErrors.startTime = 'Start time is required.';
    if (!form.endTime.trim()) nextErrors.endTime = 'End time is required.';
    const hallTrimmed = form.hall.trim();
    if (!hallTrimmed) nextErrors.hall = 'Hall is required.';
    else if (hallTrimmed.length < 3 || hallTrimmed.length > 80) {
      nextErrors.hall = 'Location / venue must be between 3 and 80 characters.';
    }

    const todayStr = getLocalDateString();
    if (form.date && form.date < todayStr) {
      nextErrors.date = 'Exam date cannot be in the past.';
    }

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      nextErrors.endTime = 'End time should be later than start time.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (onSave) onSave({ ...form, status: form.status });
  }

  return (
    <form className="eet" onSubmit={handleSubmit}>
      <button type="button" className="eet__backLink" onClick={onCancel}>
        <span aria-hidden="true">
            ←
        </span>
        Back to Timetable
      </button>

      <header className="eet__header">
        <h2 className="eet__title">Edit Exam Schedule</h2>
        <p className="eet__subtitle">Modify the current schedule for {form.subject || 'selected subject'}.</p>
      </header>

      <div className="eet__card">
        <div className="eet__grid">
          <label className="eet__field">
            <span className="eet__label">Exam Date</span>
            <input type="date" className="eet__control" value={form.date} onChange={(e) => setField('date', e.target.value)} />
            {errors.date ? <span className="eet__error">{errors.date}</span> : null}
          </label>

          <label className="eet__field">
            <span className="eet__label">Start Time</span>
            <input type="time" className="eet__control" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} />
            {errors.startTime ? <span className="eet__error">{errors.startTime}</span> : null}
          </label>

          <label className="eet__field">
            <span className="eet__label">End Time</span>
            <input type="time" className="eet__control" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} />
            {errors.endTime ? <span className="eet__error">{errors.endTime}</span> : null}
          </label>

          <label className="eet__field">
            <span className="eet__label">Examination Hall / Room</span>
            <input className="eet__control" value={form.hall} onChange={(e) => setField('hall', e.target.value)} placeholder="Grand Lecture Hall - Block C, Level 4" />
            {errors.hall ? <span className="eet__error">{errors.hall}</span> : null}
          </label>

          <label className="eet__field">
            <span className="eet__label">Subject / Course</span>
            <select className="eet__control" value={form.subject} onChange={(e) => setField('subject', e.target.value)}>
              {!form.subject.trim() ? (
                <option value="" disabled>
                  Select subject…
                </option>
              ) : null}
              {subjectSelectOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            {errors.subject ? <span className="eet__error">{errors.subject}</span> : null}
          </label>

          <label className="eet__field">
            <span className="eet__label">Status</span>
            <select className="eet__control" value={form.status} onChange={(e) => setField('status', e.target.value)}>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </label>
        </div>

        <div className="eet__actions">
          <button type="submit" className="eet__btn eet__btn--primary" disabled={!canSubmit}>
            {loading ? 'SAVING...' : 'UPDATE SCHEDULE'}
          </button>
          <button type="button" className="eet__btn eet__btn--secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

