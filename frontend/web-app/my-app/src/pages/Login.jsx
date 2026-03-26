import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }

    navigate('/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 420, margin: '30px auto', padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 10, borderRadius: 6, border: '1px solid #d9d9d9' }}
            />
          </label>
          {error ? <p style={{ color: '#b00020', margin: 0 }}>{error}</p> : null}
          <button type="submit" style={{ padding: 10, borderRadius: 6, border: 'none', background: '#2f6fed', color: '#fff' }}>
            Login
          </button>
        </form>
      </main>
    </div>
  );
}
