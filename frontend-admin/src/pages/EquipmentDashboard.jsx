import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/api.js';

// Generalized across the 12 trained equipment types (thermometer, anemometer,
// pipette, sound_level_meter, torque_wrench, humidity_sensor, vernier_caliper,
// micrometer, pressure_gauge, flow_meter, digital_scale, ph_meter) — selectable below.

const CSV_HEADER_HINT =
  'equipment_type,standard_reference,unit,nominal_value,measured_value,measured_error,mpe_tolerance,error_pct_of_tolerance,needs_calibration,instrument_age_months,days_since_last_calibration,usage_hours_since_last_cal,ambient_temperature_c,ambient_humidity_pct,previous_calibration_result';

export default function EquipmentDashboard() {
  const [availableTypes, setAvailableTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [summary, setSummary] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [trainMsg, setTrainMsg] = useState('');

  const loadSummary = (equipmentType) => {
    api.get('/dashboard/equipment-summary', { params: equipmentType ? { equipmentType } : {} }).then((res) => {
      setSummary(res.data.summary);
      setAvailableTypes(res.data.availableTypes || []);
      setSelectedType(res.data.equipmentType || '');
    });
  };

  useEffect(() => {
    loadSummary();
    api.get('/ai/status').then((res) => setModelStatus(res.data)).catch(() => setModelStatus(null));
  }, []);

  const chartData = summary ? [
    { name: 'Total requests', value: Number(summary.total_requests || 0) },
    { name: 'Needing calibration', value: Number(summary.needing_calibration || 0) },
    { name: 'Completed', value: Number(summary.completed || 0) },
  ] : [];

  const trainFromCsv = async () => {
    setTrainMsg('Training...');
    const lines = csvText.trim().split('\n').filter(Boolean);
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',');
      const row = {};
      headers.forEach((h, i) => (row[h] = values[i]?.trim()));
      return row;
    });
    try {
      const { data } = await api.post('/ai/train', { rows });
      setTrainMsg(
        `Trained on ${data.trainingResult.trained_rows} rows. ` +
        `MAE: ${data.trainingResult.mean_absolute_error ?? 'n/a'} · ` +
        `Derived accuracy: ${data.trainingResult.derived_classification_accuracy ?? 'n/a'}`
      );
      api.get('/ai/status').then((res) => setModelStatus(res.data));
    } catch (err) {
      setTrainMsg(err.response?.data?.message || 'Training failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Equipment calibration — AI model overview</h2>
        <select value={selectedType} onChange={(e) => loadSummary(e.target.value)} style={{ width: 220 }}>
          {availableTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total requests ({selectedType || '—'})</div>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)' }}>{summary?.total_requests ?? '—'}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Avg predicted error</div>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)' }}>
            {summary?.avg_predicted_error_pct ? Number(summary.avg_predicted_error_pct).toFixed(2) + '%' : '—'}
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Needing calibration</div>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)' }}>{summary?.needing_calibration ?? '—'}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Model trained on</div>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)' }}>{modelStatus?.trained_rows ?? 0} rows</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            acc {modelStatus?.derived_classification_accuracy ? (modelStatus.derived_classification_accuracy * 100).toFixed(1) + '%' : '—'}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', height: 280 }}>
        <h3 style={{ marginTop: 0 }}>{selectedType || 'Equipment'} requests breakdown</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }} />
            <Bar dataKey="value" fill="#ff8a3d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Train / retrain the AI model</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Paste a CSV with header:<br /><code style={{ fontSize: '0.75rem' }}>{CSV_HEADER_HINT}</code>
        </p>
        <textarea rows={6} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="thermometer,ASTM E1-14,C,102.5,102.34,-0.1605,0.251,0.639,0,11,245,1499,29.7,28.9,pass&#10;..." />
        <div style={{ marginTop: '0.75rem' }}>
          <button className="btn" onClick={trainFromCsv}>Train model</button>
          {trainMsg && <span style={{ marginLeft: '1rem', color: 'var(--color-text-muted)' }}>{trainMsg}</span>}
        </div>
      </div>
    </div>
  );
}
