import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTimetable, updateTimetable } from '../services/timetableService';
import EditExamTimetable from '../components/EditExamTimetable/EditExamTimetable';

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

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadSelected() {
      setLoading(true);
      setError('');

      try {
        const res = await getTimetable('Admin');
        if (!mounted) return;
        const items = normalizeItems(res.data);

        const selected = items.find((item) => String(item?._id ?? item?.id) === String(id));
        if (!selected) {
          setError('Timetable entry not found.');
          return;
        }

        const examDate = selected?.exam_date ?? selected?.date ?? selected?.Date ?? '';
        setSelectedEntry({
          subject: selected?.subject ?? selected?.Subject ?? '',
          date: examDate ? String(examDate).slice(0, 10) : '',
          startTime: selected?.startTime ?? selected?.start_time ?? selected?.StartTime ?? '',
          endTime: selected?.endTime ?? selected?.end_time ?? selected?.EndTime ?? '',
          hall: selected?.hall ?? selected?.Hall ?? '',
          status: selected?.status ?? selected?.Status ?? 'Draft',
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

  async function handleSave(data) {
    setError('');
    setSubmitting(true);

    try {
      await updateTimetable(id, {
        subject: data.subject.trim(),
        exam_date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        hall: data.hall.trim(),
        status: data.status === 'Published' ? 'Published' : 'Draft',
      });
      navigate('/view');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: '#b00020' }}>{String(error)}</p> : null}
      {!loading && selectedEntry ? (
        <EditExamTimetable
          initialData={selectedEntry}
          loading={submitting}
          onCancel={() => navigate('/view')}
          onSave={handleSave}
        />
      ) : null}
    </main>
  );
}

