import { useEffect, useMemo, useState } from 'react';
import './EditExamTimetable.css';

const EMPTY_FORM = {
  subject: '',
  date: '',
  startTime: '',
  endTime: '',
  hall: '',
};

function normalizeForm(data) {
  if (!data) return { ...EMPTY_FORM };
  return {
    subject: data.subject ?? data.Subject ?? '',
    date: data.date ?? data.Date ?? '',
    startTime: data.startTime ?? data.start_time ?? data.StartTime ?? '',
    endTime: data.endTime ?? data.end_time ?? data.EndTime ?? '',
    hall: data.hall ?? data.Hall ?? data.location ?? data.Location ?? '',
  };
}

function getAutoStatus(form) {
  const hasRequired = form.subject.trim() && form.date.trim() && form.startTime.trim() && form.endTime.trim() && form.hall.trim();
  if (!hasRequired) return 'Draft';
  if (form.startTime >= form.endTime) return 'Conflict';
  return 'Published';
}

export default function EditExamTimetable({ initialData, loading = false, onCancel, onSave }) {
  const [form, setForm] = useState(() => normalizeForm(initialData));
  const [errors, setErrors] = useState({});
  const autoStatus = useMemo(() => getAutoStatus(form), [form]);

  useEffect(() => {
    setForm(normalizeForm(initialData));
    setErrors({});
  }, [initialData]);

  const canSubmit = useMemo(() => {
    return (
      form.subject.trim() &&
      form.date.trim() &&
      form.startTime.trim() &&
      form.endTime.trim() &&
      form.hall.trim() &&
      !loading
    );
  }, [form, loading]);

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
    if (!form.hall.trim()) nextErrors.hall = 'Hall is required.';

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      nextErrors.endTime = 'End time should be later than start time.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (onSave) onSave({ ...form, status: autoStatus });
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
            <span className="eet__label">Subject</span>
            <input className="eet__control" value={form.subject} onChange={(e) => setField('subject', e.target.value)} placeholder="CS302: Advanced Algorithms" />
            {errors.subject ? <span className="eet__error">{errors.subject}</span> : null}
          </label>

          <label className="eet__field">
            <span className="eet__label">Status</span>
            <input className="eet__control" value={autoStatus} readOnly />
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

