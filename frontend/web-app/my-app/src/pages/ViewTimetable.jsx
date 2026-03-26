import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { getTimetable } from '../services/timetableService';

function getErrorMessage(err) {
  return err?.response?.data?.message || err?.response?.data || err?.message || 'Request failed.';
}

function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.timetable)) return data.timetable;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export default function ViewTimetable() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await getTimetable();
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

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>View Timetable</h2>

        {loading ? <p>Loading...</p> : null}
        {error ? <p style={{ color: '#b00020' }}>{String(error)}</p> : null}

        {!loading && !error ? (
          items.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5', padding: '10px 8px' }}>Subject</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5', padding: '10px 8px' }}>Date</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5', padding: '10px 8px' }}>Start Time</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5', padding: '10px 8px' }}>End Time</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5', padding: '10px 8px' }}>Hall</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5', padding: '10px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const id = item?._id ?? item?.id;
                  const subject = item?.subject ?? item?.Subject ?? '';
                  const date = item?.date ?? item?.Date ?? '';
                  const startTime = item?.startTime ?? item?.start_time ?? item?.StartTime ?? '';
                  const endTime = item?.endTime ?? item?.end_time ?? item?.EndTime ?? '';
                  const hall = item?.hall ?? item?.Hall ?? '';

                  return (
                    <tr key={String(id ?? `${subject}-${date}-${startTime}`)}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}>{subject}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}>{date}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}>{startTime}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}>{endTime}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}>{hall}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (id == null) return;
                            navigate(`/edit/${id}`);
                          }}
                          disabled={id == null}
                          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff', cursor: id == null ? 'not-allowed' : 'pointer' }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>No timetable entries found.</p>
          )
        ) : null}
      </main>
    </div>
  );
}

