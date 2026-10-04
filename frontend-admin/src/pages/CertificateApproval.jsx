import React, { useEffect, useState } from 'react';
import api from '../api/api.js';

export default function CertificateApproval() {
  const [certificates, setCertificates] = useState([]);
  const [filter, setFilter] = useState('pending');

  const load = () => api.get('/certificates', { params: filter ? { approvalStatus: filter } : {} }).then((res) => setCertificates(res.data.certificates));
  useEffect(() => { load(); }, [filter]);

  const decide = async (cert, decision) => {
    await api.post(`/certificates/${cert.id}/decision`, { decision });
    load();
  };

  return (
    <div>
      <h2>Certificate approvals</h2>
      <div style={{ marginBottom: '1rem' }}>
        {['pending', 'approved', 'rejected', ''].map((f) => (
          <button key={f} className={`btn ${filter === f ? '' : 'secondary'}`} style={{ marginRight: '0.5rem' }} onClick={() => setFilter(f)}>
            {f || 'all'}
          </button>
        ))}
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Certificate #</th><th>Token</th><th>Equipment</th><th>Technician</th><th>Result</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {certificates.map((c) => (
              <tr key={c.id}>
                <td className="token" style={{ fontFamily: 'var(--font-mono)' }}>{c.certificate_number}</td>
                <td>{c.tracking_token}</td>
                <td>{c.equipment_type}</td>
                <td>{c.technician_name}</td>
                <td>{c.result} ({c.final_error_pct}%)</td>
                <td><span className={`badge ${c.approval_status}`}>{c.approval_status}</span></td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  {c.approval_status === 'pending' && (
                    <>
                      <button className="btn" onClick={() => decide(c, 'approved')}>Approve</button>
                      <button className="btn danger" onClick={() => decide(c, 'rejected')}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
