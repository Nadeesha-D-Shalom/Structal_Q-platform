import Navbar from '../components/Navbar/Navbar';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Dashboard</h2>
        <p style={{ marginTop: 0 }}>Choose an action:</p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/create')}
            style={{ padding: 10, borderRadius: 6, border: 'none', background: '#2f6fed', color: '#fff' }}
          >
            Create Timetable
          </button>
          <button
            type="button"
            onClick={() => navigate('/view')}
            style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff' }}
          >
            View Timetable
          </button>
        </div>
      </main>
    </div>
  );
}

