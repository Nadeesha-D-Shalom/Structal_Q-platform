import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { getTimetable, updateTimetable } from '../services/timetableService';

function getErrorMessage(err) {
  return err?.response?.data?.message || err?.response?.data || err?.message || 'Request failed.';
}

function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.timetable)) return data.timetable;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export default function EditTimetable() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    hall: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadSelected() {
      setLoading(true);
      setError('');

      try {
        const res = await getTimetable();
        if (!mounted) return;
        const items = normalizeItems(res.data);

        const selected = items.find((item) => String(item?._id ?? item?.id) === String(id));
        if (!selected) {
          setError('Timetable entry not found.');
          return;
        }

        setForm({
          subject: selected?.subject ?? selected?.Subject ?? '',
          date: selected?.date ?? selected?.Date ?? '',
          startTime: selected?.startTime ?? selected?.start_time ?? selected?.StartTime ?? '',
          endTime: selected?.endTime ?? selected?.end_time ?? selected?.EndTime ?? '',
          hall: selected?.hall ?? selected?.Hall ?? '',
        });
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSelected();
    return () => {
      mounted = false;
    };
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await updateTimetable(id, form);
      navigate('/view');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Edit Timetable</h2>

        {loading ? <p>Loading...</p> : null}
        {error ? <p style={{ color: '#b00020' }}>{String(error)}</p> : null}

        {!loading ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              Subject
              <input name="subject" value={form.subject} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              Date
              <input type="date" name="date" value={form.date} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9' }} />
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                Start Time
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                End Time
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9' }} />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              Hall
              <input name="hall" value={form.hall} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9' }} />
            </label>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" disabled={submitting} style={{ padding: 10, borderRadius: 6, border: 'none', background: '#2f6fed', color: '#fff' }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/view')}
                disabled={submitting}
                style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </main>
    </div>
  );
}

