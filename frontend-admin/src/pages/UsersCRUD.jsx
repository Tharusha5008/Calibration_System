import React, { useEffect, useState } from 'react';
import api from '../api/api.js';

const emptyForm = { fullName: '', email: '', password: '', role: 'user' };

export default function UsersCRUD() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const load = () => api.get('/users').then((res) => setUsers(res.data.users));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/users', form);
    setForm(emptyForm);
    load();
  };

  const toggleActive = async (u) => {
    await api.put(`/users/${u.id}`, { isActive: !u.is_active });
    load();
  };

  const remove = async (u) => {
    await api.delete(`/users/${u.id}`);
    load();
  };

  return (
    <div>
      <h2>Users</h2>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Create user / technician / admin</h3>
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <div><label>Full name</label><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">user</option>
              <option value="technician">technician</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <button className="btn" type="submit">Create</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td><span className={`badge ${u.is_active ? 'approved' : 'rejected'}`}>{u.is_active ? 'active' : 'disabled'}</span></td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn secondary" onClick={() => toggleActive(u)}>{u.is_active ? 'Disable' : 'Enable'}</button>
                  <button className="btn danger" onClick={() => remove(u)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
