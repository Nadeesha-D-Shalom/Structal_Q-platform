import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteTimetable,
  getTimetable,
} from '../../services/timetableService';
import './ViewTimetableLecturer.css';

function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.timetable)) return data.timetable;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

function getItemField(item, keys) {
  for (const key of keys) {
    const v = item?.[key];
    if (v != null) return v;
  }
  return undefined;
}

function getErrorMessage(err) {
  return err?.response?.data?.message || err?.response?.data || err?.message || 'Request failed.';
}

function normalizeText(value) {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
}

function toComparableDate(dateValue) {
  const s = String(dateValue ?? '').trim();
  const asDate = new Date(s);
  const t = asDate.getTime();
  return Number.isFinite(t) ? t : 0;
}

function getStatusTone(status) {
  const s = normalizeText(status);
  if (!s) return 'neutral';
  if (s.includes('draft')) return 'neutral';
  if (s.includes('conflict') || s.includes('error')) return 'danger';
  if (s.includes('publish') || s.includes('approved') || s.includes('active')) return 'success';
  return 'neutral';
}

export default function ViewTimetableLecturer({ lecturerFilter: lecturerFilterProp = '' }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await getTimetable('Admin');
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
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    // Sort by date, then start time (as string fallback).
    return items.slice().sort((a, b) => {
      const ad = toComparableDate(getItemField(a, ['exam_date', 'date', 'Date']));
      const bd = toComparableDate(getItemField(b, ['exam_date', 'date', 'Date']));
      if (ad !== bd) return ad - bd;

      const as = String(getItemField(a, ['startTime', 'start_time', 'StartTime']) ?? '');
      const bs = String(getItemField(b, ['startTime', 'start_time', 'StartTime']) ?? '');
      return as.localeCompare(bs);
    });
  }, [items]);

  async function handleDelete(rowId) {
    if (rowId == null) return;
    const ok = window.confirm('Are you sure you want to delete this timetable entry?');
    if (!ok) return;

    setError('');
    try {
      await deleteTimetable(Number(rowId));
      const res = await getTimetable('Admin');
      setItems(normalizeItems(res.data));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const paginated = useMemo(() => {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(total, startIdx + pageSize);
    return {
      total,
      totalPages,
      safePage,
      startIdx,
      endIdx,
      items: filtered.slice(startIdx, endIdx),
    };
  }, [filtered, page]);

  return (
    <section className="vt">
      <header className="vt__header">
        <div>
          <h2 className="vt__title">Exam Timetable Management</h2>
          <p className="vt__subtitle">Schedule, review, and publish final assessments for all departments.</p>
        </div>

        <button type="button" className="vt__primaryBtn" onClick={() => navigate('/create')}>
          Create New Schedule
        </button>
      </header>

      <div className="vt__card">
        <div className="vt__tableWrap">
          <table className="vt__table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Status</th>
                <th className="vt__thRight">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="vt__state">
                    Loading...
                  </td>
                </tr>
              ) : null}

              {error ? (
                <tr>
                  <td colSpan={6} className="vt__state vt__state--error">
                    {String(error)}
                  </td>
                </tr>
              ) : null}

              {!loading && !error && !paginated.items.length ? (
                <tr>
                  <td colSpan={6} className="vt__state">
                    No timetable entries found.
                  </td>
                </tr>
              ) : null}

              {!loading && !error
                ? paginated.items.map((item) => {
                    const subject = String(getItemField(item, ['subject', 'Subject']) ?? '');
                    const date = String(getItemField(item, ['exam_date', 'date', 'Date']) ?? '');
                    const startTime = String(getItemField(item, ['startTime', 'start_time', 'StartTime']) ?? '');
                    const endTime = String(getItemField(item, ['endTime', 'end_time', 'EndTime']) ?? '');
                    const hall = String(getItemField(item, ['hall', 'Hall', 'location', 'Location', 'venue', 'Venue']) ?? '');
                    const status = String(getItemField(item, ['status', 'Status']) ?? '');
                    const tone = getStatusTone(status);

                    const id = getItemField(item, ['_id', 'id']) ?? `${subject}-${date}-${startTime}-${hall}`;
                    const timeText = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || '—';

                    return (
                      <tr key={String(id)}>
                        <td>
                          <div className="vt__subject">{subject || '—'}</div>
                        </td>
                        <td className="vt__muted">{date || '—'}</td>
                        <td className="vt__muted">{timeText}</td>
                        <td className="vt__muted">{hall || '—'}</td>
                        <td>
                          <span className={`vt__pill vt__pill--${tone}`}>{status || '—'}</span>
                        </td>
                        <td className="vt__actions">
                          <button
                            type="button"
                            className="vt__iconBtn"
                            onClick={() => navigate(`/edit/${id}`)}
                            aria-label="Edit timetable"
                            title="Edit"
                          >
                            <img src="/Icon.svg" alt="" />
                          </button>
                          <button
                            type="button"
                            className="vt__iconBtn"
                            onClick={() => handleDelete(id)}
                            aria-label="Delete timetable"
                            title="Delete"
                          >
                            <img src="/Icon-delete.svg" alt="" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>

        <div className="vt__pagination">
          <div className="vt__muted">
            Showing <strong>{paginated.total ? paginated.startIdx + 1 : 0}</strong> to <strong>{paginated.endIdx}</strong> of <strong>{paginated.total}</strong> results
          </div>

          <div className="vt__pageBtns">
            <button type="button" className="vt__btn vt__btn--sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={paginated.safePage <= 1}>
              Prev
            </button>

            {Array.from({ length: paginated.totalPages }, (_, i) => i + 1)
              .slice(0, 5)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`vt__page ${p === paginated.safePage ? 'vt__page--active' : ''}`}
                  onClick={() => setPage(p)}
                  aria-current={p === paginated.safePage ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}

            <button
              type="button"
              className="vt__btn vt__btn--sm"
              onClick={() => setPage((p) => Math.min(paginated.totalPages, p + 1))}
              disabled={paginated.safePage >= paginated.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

