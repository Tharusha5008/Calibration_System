import React, { useEffect, useState } from 'react';
import api from '../api/api.js';

export default function TechniciansCRUD() {
  const [technicians, setTechnicians] = useState([]);

  const load = () => api.get('/users', { params: { role: 'technician' } }).then((res) => setTechnicians(res.data.users));
  useEffect(() => { load(); }, []);

  const resetPassword = async (t) => {
    const newPassword = prompt(`New password for ${t.full_name} (min 8 chars):`);
    if (!newPassword) return;
    await api.post(`/users/${t.id}/reset-password`, { newPassword });
    alert('Password reset.');
  };

  const remove = async (t) => {
    if (!confirm(`Remove technician ${t.full_name}?`)) return;
    await api.delete(`/users/${t.id}`);
    load();
  };

  return (
    <div>
      <h2>Technicians</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Create new technician accounts from the Users page (role: technician). Manage existing ones here.
      </p>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {technicians.map((t) => (
              <tr key={t.id}>
                <td>{t.full_name}</td>
                <td>{t.email}</td>
                <td><span className={`badge ${t.is_active ? 'approved' : 'rejected'}`}>{t.is_active ? 'active' : 'disabled'}</span></td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn secondary" onClick={() => resetPassword(t)}>Reset password</button>
                  <button className="btn danger" onClick={() => remove(t)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
