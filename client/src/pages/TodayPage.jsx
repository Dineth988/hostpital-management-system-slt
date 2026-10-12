import React, { useState, useEffect, useCallback } from 'react';
import { appointments as apptApi, patients as patientsApi, doctors as doctorsApi, fmt } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { StatusBadge } from '../components/AppointmentList.jsx';
import { Spinner } from '../components/PatientDrawer.jsx';

const ACTIVE_STATUSES = ['SCHEDULED', 'CHECKED_IN', 'COMPLETED'];
const INACTIVE_STATUSES = ['CANCELLED', 'NO_SHOW'];

export default function TodayPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState({});
  const [doctors, setDoctors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [doctorList, setDoctorList] = useState([]);
  const { user, can } = useAuth();
  const { openDrawer, showToast } = useApp();

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = { date: today };
      if (user.role === 'DOCTOR' && user.doctorId) query.doctorId = user.doctorId;
      const [appts, docList] = await Promise.all([
        apptApi.list(query),
        doctorsApi.list({ active: true }),
      ]);
      setDoctorList(docList);
      const docMap = {};
      docList.forEach(d => { docMap[d.id] = d; });
      setDoctors(docMap);
      const uniquePids = [...new Set(appts.map(a => a.patientId))];
      const pMap = {};
      await Promise.all(uniquePids.map(pid => patientsApi.get(pid).then(p => { pMap[pid] = p; }).catch(() => {})));
      setPatients(pMap);
      setAppointments(appts);
    } finally {
      setLoading(false);
    }
  }, [today, user]);

  useEffect(() => { load(); }, [load]);

  const handleCheckIn = async (appt) => {
    try {
      const { appointment, bill } = await apptApi.checkIn(appt.id);
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...appointment } : a));
      showToast(`${patients[appt.patientId]?.name} checked in. Bill created: ${bill.invoiceNo}`);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleCancel = async (appt) => {
    const reason = window.prompt('Cancel reason (required):');
    if (!reason?.trim()) return;
    try {
      const updated = await apptApi.cancel(appt.id, reason);
      setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a));
      showToast('Appointment cancelled', 'warning');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleComplete = async (appt) => {
    try {
      const updated = await apptApi.complete(appt.id);
      setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a));
      showToast('Appointment completed');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleNoShow = async (appt) => {
    try {
      const updated = await apptApi.markNoShow(appt.id);
      setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a));
      showToast('Marked as no-show', 'warning');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const filtered = appointments.filter(a => !filterDoctor || a.doctorId === filterDoctor);
  const activeAppts = filtered.filter(a => ACTIVE_STATUSES.includes(a.status));
  const inactiveAppts = filtered.filter(a => INACTIVE_STATUSES.includes(a.status));

  const columns = [
    { id: 'SCHEDULED', label: 'Scheduled', icon: '🕐', color: 'var(--status-scheduled-text)' },
    { id: 'CHECKED_IN', label: 'Checked In', icon: '✅', color: 'var(--status-checkedin-text)' },
    { id: 'COMPLETED', label: 'Completed', icon: '🐍', color: 'var(--status-completed-text)' },
  ];

  const todayDisplay = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={32} /></div>;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sub header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Today's Board</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{todayDisplay} Ã· {activeAppts.length} active</div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Doctor filter (receptionist/admin) */}
        {(user.role === 'RECEPTIONIST' || user.role === 'ADMIN') && (
          <select className="form-select" style={{ width: 'auto', height: '28px', fontSize: '12px' }} value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}>
            <option value="">All Doctors</option>
            {doctorList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        {can('appointment:create') && (
          <button className="btn btn-primary btn-sm" onClick={() => openDrawer('new-appointment')}>
            + Book
          </button>
        )}
        <button className="btn btn-subtle btn-sm" onClick={load}>Ã¢â Âº Refresh</button>
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
        {columns.map(col => {
          const colAppts = activeAppts.filter(a => a.status === col.id).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={col.id} style={{ background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Column header */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '14px' }}>{col.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: col.color }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: col.color, background: `rgba(${col.id === 'SCHEDULED' ? '56,189,248' : col.id === 'CHECKED_IN' ? '16,185,129' : '129,140,248'},0.1)`, padding: '1px 6px', borderRadius: '10px' }}>{colAppts.length}</span>
              </div>
              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {colAppts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-disabled)', fontSize: '12px', padding: '24px 0' }}>Empty</div>
                ) : (
                  colAppts.map(appt => (
                    <AppointmentCard
                      key={appt.id} appt={appt}
                      patient={patients[appt.patientId]}
                      doctor={doctors[appt.doctorId]}
                      onCheckIn={() => handleCheckIn(appt)}
                      onCancel={() => handleCancel(appt)}
                      onComplete={() => handleComplete(appt)}
                      onNoShow={() => handleNoShow(appt)}
                      onViewBill={() => openDrawer('bill-detail', { billId: appt.billId })}
                      onViewPatient={() => openDrawer('patient-detail', { patientId: appt.patientId })}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsed strip */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
        <button onClick={() => setShowInactive(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px',
        }}>
          <span style={{ transform: showInactive ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', display: 'inline-block' }}>Ã¢â¬Âº</span>
          <span>Cancelled &amp; No-show Ã¢â¬” {inactiveAppts.length} entries</span>
        </button>
        {showInactive && (
          <div style={{ padding: '4px 12px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {inactiveAppts.map(appt => (
              <div key={appt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '5px 10px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', fontSize: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{appt.time}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{patients[appt.patientId]?.name || 'Ã¢â¬Â¦'}</span>
                <StatusBadge status={appt.status} />
                {appt.cancelReason && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Ã¢â¬” {appt.cancelReason}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appt, patient, doctor, onCheckIn, onCancel, onComplete, onNoShow, onViewBill, onViewPatient }) {
  const { can, user } = useAuth();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        marginBottom: '6px', padding: '10px', background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)',
        transition: 'all 0.12s', borderColor: hovered ? 'var(--border-medium)' : 'var(--border-subtle)',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
      }}>
      {/* Time + badges */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '40px' }}>{appt.time}</span>
        {appt.walkIn && <span className="badge badge-walkin">Walk-in</span>}
        {appt.billId && (
          <button className="badge badge-bill" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer' }} onClick={onViewBill}>
            🧾 Bill
          </button>
        )}
      </div>
      {/* Patient */}
      <div style={{ marginBottom: '2px' }}>
        <button type="button" onClick={onViewPatient} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{patient?.name || 'Ã¢â¬Â¦'}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginLeft: '6px' }}>{patient?.pid}</span>
        </button>
      </div>
      {/* Doctor */}
      {user.role !== 'DOCTOR' && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          🩺 {doctor?.name || '—'}
        </div>
      )}
      {appt.reason && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontStyle: 'italic' }}>{appt.reason}</div>}

      {/* Actions (visible on hover) */}
      {hovered && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
          {appt.status === 'SCHEDULED' && can('appointment:checkin') && (
            <button className="btn btn-success btn-sm" onClick={onCheckIn}>Check In</button>
          )}
          {appt.status === 'CHECKED_IN' && (user.role === 'DOCTOR' || can('*')) && (
            <button className="btn btn-secondary btn-sm" onClick={onComplete}>Complete</button>
          )}
          {appt.status === 'SCHEDULED' && can('appointment:noshow') && (
            <button className="btn btn-subtle btn-sm" onClick={onNoShow}>No-show</button>
          )}
          {['SCHEDULED', 'CHECKED_IN'].includes(appt.status) && can('appointment:cancel') && (
            <button className="btn btn-danger btn-sm" onClick={onCancel}>Cancel</button>
          )}
        </div>
      )}
    </div>
  );
}

