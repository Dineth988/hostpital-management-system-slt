import React, { useState, useEffect, useCallback } from 'react';
import { doctors as doctorsApi, users as usersApi, audit as auditApi, fmt } from '../api/api.js';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Drawer from '../components/Drawer.jsx';
import { Spinner } from '../components/PatientDrawer.jsx';

export default function AdminPage() {
  const [tab, setTab] = useState('doctors');
  const { user } = useAuth();

  const tabs = [
    { id: 'doctors', label: 'ðŸ©º Doctors' },
    { id: 'schedules', label: 'ðŸ“… Schedules' },
    { id: 'users', label: 'ðŸ‘¥ Users' },
    { id: 'audit', label: 'ðŸ“‹ Audit Log' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', gap: '4px', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            fontFamily: 'var(--font-sans)', transition: 'all 0.12s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'doctors' && <DoctorsTab />}
        {tab === 'schedules' && <SchedulesTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'audit' && <AuditTab />}
      </div>
    </div>
  );
}

// â”€â”€ Doctors Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DoctorsTab() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const { showToast } = useApp();

  const load = () => {
    setLoading(true);
    doctorsApi.list().then(setDoctors).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async (data) => {
    if (editDoc) {
      await doctorsApi.update(editDoc.id, data);
      showToast('Doctor updated');
    } else {
      await doctorsApi.create(data);
      showToast('Doctor created');
    }
    setDrawerOpen(false);
    setEditDoc(null);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{doctors.length} doctors</span>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditDoc(null); setDrawerOpen(true); }}>+ Add Doctor</button>
      </div>
      <div className="dense-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="dense-table">
          <thead><tr><th>Name</th><th>Specialty</th><th>Fee (LKR)</th><th>Slot</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {doctors.map(doc => (
              <tr key={doc.id}>
                <td style={{ fontWeight: 500 }}>{doc.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{doc.specialty}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{doc.consultFee.toLocaleString()}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{doc.slotMinutes}min</td>
                <td>{doc.active ? <span className="badge badge-checkedin">Active</span> : <span className="badge badge-noshow">Inactive</span>}</td>
                <td>
                  <button className="btn btn-subtle btn-sm" onClick={() => { setEditDoc(doc); setDrawerOpen(true); }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {drawerOpen && (
        <DoctorFormDrawer doc={editDoc} onClose={() => { setDrawerOpen(false); setEditDoc(null); }} onSave={handleSave} />
      )}
    </div>
  );
}

function DoctorFormDrawer({ doc, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', specialty: '', consultFee: 1500, slotMinutes: 15,
    schedule: { MON: null, TUE: null, WED: null, THU: null, FRI: null, SAT: null, SUN: null },
    active: true, ...doc,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.specialty.trim()) errs.specialty = 'Required';
    if (!form.consultFee || form.consultFee <= 0) errs.consultFee = 'Must be > 0';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (e) { setErrors({ _global: e.message }); setSaving(false); }
  };

  return (
    <Drawer title={doc ? 'Edit Doctor' : 'Add Doctor'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {errors._global && <div style={{ color: '#fb7185', fontSize: '12px', marginBottom: '12px', padding: '8px', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius)' }}>{errors._global}</div>}
        <div className="form-group">
          <label className="form-label">Full Name<span className="req">*</span></label>
          <input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          {errors.name && <div className="form-error">âš  {errors.name}</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div className="form-group">
            <label className="form-label">Specialty<span className="req">*</span></label>
            <input className={`form-input ${errors.specialty ? 'error' : ''}`} value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
            {errors.specialty && <div className="form-error">âš  {errors.specialty}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Consult Fee (LKR)<span className="req">*</span></label>
            <input className={`form-input ${errors.consultFee ? 'error' : ''}`} type="number" value={form.consultFee} onChange={e => setForm(f => ({ ...f, consultFee: parseFloat(e.target.value) }))} style={{ fontFamily: 'var(--font-mono)' }} />
            {errors.consultFee && <div className="form-error">âš  {errors.consultFee}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Slot (minutes)</label>
            <select className="form-select" value={form.slotMinutes} onChange={e => setForm(f => ({ ...f, slotMinutes: parseInt(e.target.value) }))}>
              <option value={10}>10</option><option value={15}>15</option><option value={20}>20</option><option value={30}>30</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
            <input type="checkbox" id="doc-active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} />
            <label htmlFor="doc-active" style={{ fontSize: '13px', cursor: 'pointer' }}>Active</label>
          </div>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>Schedule (Start â€“ End or leave blank)</div>
        {DAYS.map(day => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{day}</span>
            <input type="time" className="form-input" style={{ height: '28px', fontSize: '12px' }}
              value={form.schedule[day]?.[0] || ''}
              onChange={e => setForm(f => ({ ...f, schedule: { ...f.schedule, [day]: e.target.value ? [e.target.value, f.schedule[day]?.[1] || '17:00'] : null } }))} />
            <input type="time" className="form-input" style={{ height: '28px', fontSize: '12px' }}
              value={form.schedule[day]?.[1] || ''}
              onChange={e => setForm(f => ({ ...f, schedule: { ...f.schedule, [day]: f.schedule[day]?.[0] ? [f.schedule[day][0], e.target.value] : null } }))} />
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Savingâ€¦' : 'Save Doctor'}</button>
        </div>
      </form>
    </Drawer>
  );
}

// â”€â”€ Schedules / Leave Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SchedulesTab() {
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  useEffect(() => { doctorsApi.list({ active: true }).then(d => { setDoctors(d); if (d.length) setSelected(d[0]); }); }, []);

  const handleAddLeave = async () => {
    if (!leaveDate || !leaveReason.trim()) return;
    setSaving(true);
    try {
      const updated = await doctorsApi.addLeave(selected.id, leaveDate, leaveReason);
      setSelected(updated);
      setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
      setLeaveDate(''); setLeaveReason('');
      showToast('Leave added');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleRemoveLeave = async (date) => {
    const updated = await doctorsApi.removeLeave(selected.id, date);
    setSelected(updated);
    setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
    showToast('Leave removed', 'warning');
  };

  if (!selected) return <Spinner />;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px', alignItems: 'start' }}>
      {/* Doctor list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {doctors.map(d => (
          <button key={d.id} onClick={() => setSelected(d)} style={{
            padding: '8px 10px', border: `1px solid ${selected?.id === d.id ? 'rgba(245,158,11,0.4)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius)', background: selected?.id === d.id ? 'var(--accent-muted)' : 'var(--bg-surface)',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: selected?.id === d.id ? 'var(--accent)' : 'var(--text-primary)' }}>{d.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.specialty}</div>
          </button>
        ))}
      </div>

      {/* Schedule detail */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>{selected.name}</div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' }}>Weekly Schedule</div>
          {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => {
            const h = selected.schedule[day];
            return (
              <div key={day} style={{ display: 'flex', gap: '12px', padding: '6px 10px', background: h ? 'var(--bg-surface)' : 'transparent', borderRadius: 'var(--radius)', marginBottom: '3px' }}>
                <span style={{ width: '30px', fontSize: '11px', fontWeight: 700, color: h ? 'var(--text-primary)' : 'var(--text-disabled)' }}>{day}</span>
                {h ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--status-checkedin-text)' }}>{h[0]} â€“ {h[1]}</span>
                   : <span style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>Off</span>}
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' }}>Leave Blocks</div>
          {selected.leaveBlocks.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No leave scheduled</div>
          ) : (
            selected.leaveBlocks.map(lb => (
              <div key={lb.date} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '6px 10px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius)', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--status-cancelled-text)' }}>{lb.date}</span>
                <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>{lb.reason}</span>
                <button className="btn btn-danger btn-sm" onClick={() => handleRemoveLeave(lb.date)}>Remove</button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Add Leave Day</div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '8px', alignItems: 'end' }}>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Date</div>
              <input type="date" className="form-input" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Reason</div>
              <input className="form-input" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="e.g. Conference" />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAddLeave} disabled={saving || !leaveDate || !leaveReason.trim()}>
              {saving ? 'â€¦' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Users Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UsersTab() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { showToast } = useApp();

  const load = () => { setLoading(true); usersApi.list().then(setUserList).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleDeactivate = async (u) => {
    try { await usersApi.deactivate(u.id); showToast(`${u.username} deactivated`, 'warning'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };
  const handleReset = async (u) => {
    try { await usersApi.resetPassword(u.id); showToast(`Password reset for ${u.username}`); }
    catch (e) { showToast(e.message, 'error'); }
  };
  const handleUnlock = async (u) => {
    try { await usersApi.unlockAccount(u.id); showToast(`${u.username} unlocked`); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{userList.length} users</span>
        <button className="btn btn-primary btn-sm" onClick={() => setDrawerOpen(true)}>+ Add User</button>
      </div>
      <div className="dense-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        <table className="dense-table">
          <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Attempts</th><th></th></tr></thead>
          <tbody>
            {userList.map(u => (
              <tr key={u.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.username}</td>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  {u.active
                    ? u.forcePasswordChange
                      ? <span className="badge badge-partial">Pwd Change</span>
                      : <span className="badge badge-checkedin">Active</span>
                    : <span className="badge badge-noshow">Inactive</span>}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: u.failedAttempts >= 5 ? 'var(--status-cancelled-text)' : 'var(--text-muted)' }}>
                  {u.failedAttempts}/5 {u.failedAttempts >= 5 && 'ðŸ”’'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-subtle btn-sm" onClick={() => handleReset(u)}>Reset Pwd</button>
                    {u.failedAttempts >= 5 && <button className="btn btn-secondary btn-sm" onClick={() => handleUnlock(u)}>Unlock</button>}
                    {u.active && <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u)}>Deactivate</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {drawerOpen && <UserFormDrawer onClose={() => { setDrawerOpen(false); load(); }} />}
    </div>
  );
}

function UserFormDrawer({ onClose }) {
  const [form, setForm] = useState({ name: '', username: '', role: 'RECEPTIONIST', password: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.username.trim()) errs.username = 'Required';
    if (!form.password || form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await usersApi.create(form);
      showToast(`User ${form.username} created`);
      onClose();
    } catch (e) {
      if (e.fieldErrors) setErrors(e.fieldErrors);
      else setErrors({ _global: e.message });
    } finally { setSaving(false); }
  };

  return (
    <Drawer title="Add User" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {errors._global && <div style={{ color: '#fb7185', fontSize: '12px', marginBottom: '12px', padding: '8px', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius)' }}>{errors._global}</div>}
        {[
          { label: 'Full Name', id: 'u-name', key: 'name' },
          { label: 'Username', id: 'u-uname', key: 'username' },
        ].map(f => (
          <div key={f.key} className="form-group">
            <label className="form-label">{f.label}<span className="req">*</span></label>
            <input id={f.id} className={`form-input ${errors[f.key] ? 'error' : ''}`} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            {errors[f.key] && <div className="form-error">âš  {errors[f.key]}</div>}
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="DOCTOR">Doctor</option>
            <option value="CASHIER">Cashier</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Initial Password<span className="req">*</span></label>
          <input type="password" className={`form-input ${errors.password ? 'error' : ''}`} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          {errors.password && <div className="form-error">âš  {errors.password}</div>}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creatingâ€¦' : 'Create User'}</button>
        </div>
      </form>
    </Drawer>
  );
}

// â”€â”€ Audit Log Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', entity: '', dateFrom: '', dateTo: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await auditApi.list(filters);
      setLogs(results);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const setFilter = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }));

  const entityColors = {
    Patient: 'var(--status-scheduled-text)', Appointment: 'var(--status-checkedin-text)',
    Bill: 'var(--accent)', User: 'var(--status-completed-text)', Doctor: '#e879f9',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, minWidth: '160px', height: '28px', fontSize: '12px' }} placeholder="Search action, entity, userâ€¦" value={filters.search} onChange={setFilter('search')} />
        <select className="form-select" style={{ width: 'auto', height: '28px', fontSize: '12px' }} value={filters.entity} onChange={setFilter('entity')}>
          <option value="">All Entities</option>
          {['Patient','Appointment','Bill','User','Doctor'].map(e => <option key={e}>{e}</option>)}
        </select>
        <input type="date" className="form-input" style={{ width: '130px', height: '28px', fontSize: '12px' }} value={filters.dateFrom} onChange={setFilter('dateFrom')} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>â€“</span>
        <input type="date" className="form-input" style={{ width: '130px', height: '28px', fontSize: '12px' }} value={filters.dateTo} onChange={setFilter('dateTo')} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{logs.length} entries</span>
      </div>

      {/* Log table */}
      <div className="dense-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '13px' }}>No audit entries found</div>
        ) : (
          <table className="dense-table">
            <thead><tr><th>Time</th><th>User</th><th>Entity</th><th>Action</th><th>Detail</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {fmt.date(log.ts)} {new Date(log.ts).toLocaleTimeString('en-US', { hour12: false })}
                  </td>
                  <td style={{ fontSize: '12px', fontWeight: 500 }}>{log.userName}</td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: entityColors[log.entity] || 'var(--text-secondary)' }}>{log.entity}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)' }}>{log.action}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-primary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

