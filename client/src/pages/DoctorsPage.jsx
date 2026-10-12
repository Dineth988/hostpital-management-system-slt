import React, { useState, useEffect } from 'react';
import { doctors as doctorsApi, fmt } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { Spinner } from '../components/PatientDrawer.jsx';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { can } = useAuth();
  const { openDrawer } = useApp();

  useEffect(() => {
    doctorsApi.list().then(setDoctors).finally(() => setLoading(false));
  }, []);

  const DAYS_ORDER = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>Doctors & Schedules</div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doctors.filter(d => d.active).length} active doctors</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <Spinner />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {doctors.map(doc => (
              <div key={doc.id} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                overflow: 'hidden', opacity: doc.active ? 1 : 0.6,
              }}>
                <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-muted)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>ðŸ©º</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{doc.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{doc.specialty}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '4px' }}>{fmt.lkr(doc.consultFee)}</div>
                    </div>
                    {!doc.active && <span className="badge badge-noshow" style={{ fontSize: '10px' }}>Inactive</span>}
                  </div>
                </div>

                <div style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Schedule Â· {doc.slotMinutes}min slots</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {DAYS_ORDER.map(day => {
                      const h = doc.schedule[day];
                      return h ? (
                        <div key={day} style={{ fontSize: '11px', padding: '3px 8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{day.slice(0,2)}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>{h[0]}â€“{h[1]}</span>
                        </div>
                      ) : (
                        <div key={day} style={{ fontSize: '11px', padding: '3px 6px', color: 'var(--text-disabled)', borderRadius: '4px' }}>{day.slice(0,2)}</div>
                      );
                    })}
                  </div>

                  {doc.leaveBlocks.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '6px 8px', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--status-cancelled-text)', fontWeight: 600 }}>Leave: </span>
                      {doc.leaveBlocks.map(lb => (
                        <span key={lb.date} style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>{lb.date}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

