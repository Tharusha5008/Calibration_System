import React, { useEffect, useState } from 'react';
import api from '../api/api.js';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function currentMonthISO() {
  return new Date().toISOString().slice(0, 7);
}

const STATUS_LABELS = {
  pending_review: 'Pending review',
  token_booked: 'Token booked',
  technician_accepted: 'Technician accepted',
  equipment_handed_over: 'Handed over',
  calibration_in_progress: 'In progress',
  calibrated_released: 'Calibrated & released',
  certificate_pending_approval: 'Certificate pending approval',
  certificate_approved: 'Certificate approved',
  certificate_rejected: 'Certificate rejected',
  closed: 'Closed',
};

export default function Reports() {
  const [mode, setMode] = useState('daily'); // 'daily' | 'monthly'
  const [date, setDate] = useState(todayISO());
  const [month, setMonth] = useState(currentMonthISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    const req = mode === 'daily'
      ? api.get('/reports/daily', { params: { date } })
      : api.get('/reports/monthly', { params: { month } });
    req
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Calibration reports</h2>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button className={`btn ${mode === 'daily' ? '' : 'secondary'}`} onClick={() => setMode('daily')}>Daily</button>
          <button className={`btn ${mode === 'monthly' ? '' : 'secondary'}`} onClick={() => setMode('monthly')}>Monthly</button>
          {mode === 'daily' ? (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto' }} />
          ) : (
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 'auto' }} />
          )}
          <button className="btn secondary" onClick={load}>Refresh</button>
          <button className="btn" onClick={() => window.print()} disabled={!report}>Print</button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {error && <p style={{ color: 'var(--color-fail)' }}>{error}</p>}

      {report && (
        <div id="report-content" className="card">
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>Equipment Calibration Report</div>
            <div style={{ color: 'var(--color-text-muted)' }}>
              {report.period === 'daily' ? `Daily report — ${report.date}` : `Monthly report — ${report.month}`}
              {' · generated '}{new Date().toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ background: 'var(--color-surface-raised)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total requests</div>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)' }}>{report.totals.total_requests}</div>
            </div>
            <div className="card" style={{ background: 'var(--color-surface-raised)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Needing calibration</div>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)' }}>{report.totals.needing_calibration}</div>
            </div>
            <div className="card" style={{ background: 'var(--color-surface-raised)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Completed (closed)</div>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)' }}>{report.totals.completed}</div>
            </div>
          </div>

          <h3>By equipment type</h3>
          <table style={{ marginBottom: '1.5rem' }}>
            <thead><tr><th>Type</th><th>Requests</th><th>Needing calibration</th><th>Avg predicted error %</th><th>Completed</th></tr></thead>
            <tbody>
              {report.byEquipmentType.map((r) => (
                <tr key={r.equipment_type}>
                  <td>{r.equipment_type}</td>
                  <td>{r.total_requests}</td>
                  <td>{r.needing_calibration}</td>
                  <td>{r.avg_predicted_error_pct ?? '—'}</td>
                  <td>{r.completed}</td>
                </tr>
              ))}
              {report.byEquipmentType.length === 0 && (
                <tr><td colSpan="5" style={{ color: 'var(--color-text-muted)' }}>No requests in this period.</td></tr>
              )}
            </tbody>
          </table>

          <h3>Request status breakdown</h3>
          <table style={{ marginBottom: '1.5rem' }}>
            <thead><tr><th>Status</th><th>Count</th></tr></thead>
            <tbody>
              {report.statusBreakdown.map((s) => (
                <tr key={s.status}><td>{STATUS_LABELS[s.status] || s.status}</td><td>{s.count}</td></tr>
              ))}
              {report.statusBreakdown.length === 0 && (
                <tr><td colSpan="2" style={{ color: 'var(--color-text-muted)' }}>No requests in this period.</td></tr>
              )}
            </tbody>
          </table>

          <h3>Certificates issued</h3>
          <table style={{ marginBottom: report.dailyTrend ? '1.5rem' : 0 }}>
            <thead><tr><th>Result</th><th>Approval status</th><th>Count</th></tr></thead>
            <tbody>
              {report.certificates.map((c, i) => (
                <tr key={i}><td>{c.result}</td><td>{c.approval_status}</td><td>{c.count}</td></tr>
              ))}
              {report.certificates.length === 0 && (
                <tr><td colSpan="3" style={{ color: 'var(--color-text-muted)' }}>No certificates issued in this period.</td></tr>
              )}
            </tbody>
          </table>

          {report.dailyTrend && (
            <>
              <h3>Daily trend</h3>
              <table>
                <thead><tr><th>Day</th><th>Requests</th><th>Needing calibration</th></tr></thead>
                <tbody>
                  {report.dailyTrend.map((d) => (
                    <tr key={d.day}><td>{d.day}</td><td>{d.total_requests}</td><td>{d.needing_calibration}</td></tr>
                  ))}
                  {report.dailyTrend.length === 0 && (
                    <tr><td colSpan="3" style={{ color: 'var(--color-text-muted)' }}>No activity this month.</td></tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
