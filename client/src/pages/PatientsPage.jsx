import React, { useState, useEffect, useCallback } from 'react';
import { patients as patientsApi, fmt } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { Spinner } from '../components/PatientDrawer.jsx';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const { can } = useAuth();
  const { openDrawer } = useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await patientsApi.list({ search, active: showInactive ? undefined : true });
      setPatients(results);
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="form-input" style={{ paddingLeft: '28px', height: '30px' }}
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, NIC, phone, patient IDâ€¦"
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
          Show Inactive
        </label>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '60px', fontFamily: 'var(--font-mono)' }}>{patients.length} records</div>
        {can('patient:create') && (
          <button className="btn btn-primary btn-sm" onClick={() => openDrawer('new-patient')}>+ New Patient</button>
        )}
      </div>

      {/* Table */}
      <div className="dense-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>ðŸ‘¤</div>
            <div style={{ fontSize: '13px' }}>{search ? `No patients matching "${search}"` : 'No patients registered'}</div>
            {can('patient:create') && !search && (
              <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => openDrawer('new-patient')}>Register First Patient</button>
            )}
          </div>
        ) : (
          <table className="dense-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age / DOB</th>
                <th>NIC</th>
                <th>Phone</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="clickable" onClick={() => openDrawer('patient-detail', { patientId: p.id })}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{p.pid}</td>
                  <td style={{ fontWeight: 500 }}>
                    {p.name}
                    {p.guardian && <span style={{ fontSize: '10px', color: 'var(--accent)', marginLeft: '6px' }}>Minor</span>}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {fmt.age(p.dob)} <span style={{ color: 'var(--text-muted)' }}>{fmt.date(p.dob)}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{p.nic || 'â€”'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{p.phone}</td>
                  <td>
                    {p.active
                      ? <span className="badge badge-checkedin">Active</span>
                      : <span className="badge badge-noshow">Inactive</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-subtle btn-sm" onClick={() => openDrawer('patient-detail', { patientId: p.id })}>
                      View â†’
                    </button>
                    {can('appointment:create') && p.active && (
                      <button className="btn btn-subtle btn-sm" style={{ marginLeft: '4px' }} onClick={() => openDrawer('new-appointment', { prePatientId: p.id })}>
                        Book
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

