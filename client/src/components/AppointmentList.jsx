ï»¿import React, { useState, useEffect } from 'react';
import { appointments as apptApi, fmt } from '../api/api.js';
import { useApp } from '../context/AppContext.jsx';
import { EmptyState, Spinner } from './PatientDrawer.jsx';

export default function AppointmentList({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useApp();

  useEffect(() => {
    apptApi.list({ patientId }).then(setItems).finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <Spinner />;
  if (!items.length) return <EmptyState message="No appointments" icon="Ã°Å¸“…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).map(appt => (
        <div key={appt.id} style={{
          padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', minWidth: '80px' }}>
            <div>{fmt.date(appt.date + 'T12:00:00').replace(' ', '\n')}</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>{appt.time}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
              <StatusBadge status={appt.status} />
              {appt.walkIn && <span className="badge badge-walkin">Walk-in</span>}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{appt.reason}</div>
            {appt.cancelReason && <div style={{ fontSize: '11px', color: 'var(--status-cancelled-text)', marginTop: '2px' }}>Reason: {appt.cancelReason}</div>}
          </div>
          {appt.billId && (
            <button className="btn btn-subtle btn-sm" onClick={() => openDrawer('bill-detail', { billId: appt.billId })}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Bill
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    SCHEDULED: 'badge-scheduled',
    CHECKED_IN: 'badge-checkedin',
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
    NO_SHOW: 'badge-noshow',
  };
  const labels = {
    SCHEDULED: 'Scheduled', CHECKED_IN: 'Checked In', COMPLETED: 'Completed',
    CANCELLED: 'Cancelled', NO_SHOW: 'No-Show',
  };
  return <span className={`badge ${map[status] || ''}`}>{labels[status] || status}</span>;
}

