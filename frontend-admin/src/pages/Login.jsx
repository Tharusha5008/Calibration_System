import React, { useState } from 'react';
import api from '../api/api.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') {
        setError('This portal is for admin accounts only.');
        return;
      }
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 380, margin: '4rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Admin sign in</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ margin: '0.35rem 0 1rem' }} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ margin: '0.35rem 0 1rem' }} />
        {error && <p style={{ color: 'var(--color-fail)', fontSize: '0.9rem' }}>{error}</p>}
        <button className="btn" type="submit" style={{ width: '100%' }}>Sign in</button>
      </form>
    </div>
  );
}
