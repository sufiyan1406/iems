'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('admin');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Role-based routing
      if (data.user.role === 'student') {
        router.push('/student');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'admin') {
      setEmail('admin@iems.edu');
      setPassword('admin123');
      setLoginType('admin');
    } else {
      setEmail('aarav.sharma@student.iems.edu');
      setPassword('student123');
      setLoginType('student');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="icon">🎓</div>
          <h1>IEMS</h1>
          <p>Integrated Education Management System</p>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '4px' }}>
          <button
            type="button"
            onClick={() => fillDemo('admin')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
              background: loginType === 'admin' ? 'var(--gradient-primary)' : 'transparent',
              color: loginType === 'admin' ? 'white' : 'var(--text-muted)',
            }}
          >
            🛡️ Admin / Faculty
          </button>
          <button
            type="button"
            onClick={() => fillDemo('student')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
              background: loginType === 'student' ? 'var(--gradient-primary)' : 'transparent',
              color: loginType === 'student' ? 'white' : 'var(--text-muted)',
            }}
          >
            👨‍🎓 Student
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder={loginType === 'admin' ? 'admin@iems.edu' : 'name@student.iems.edu'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && <div className="error-msg">{error}</div>}
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '4px' }}>👤 Admin: admin@iems.edu / admin123</p>
          <p>👨‍🎓 Student: aarav.sharma@student.iems.edu / student123</p>
        </div>
      </div>
    </div>
  );
}
