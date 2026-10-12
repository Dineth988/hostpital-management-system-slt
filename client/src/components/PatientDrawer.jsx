ï»¿import React, { useState, useEffect } from 'react';
import { patients as patientsApi, fmt } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import Drawer, { DrawerTabs } from './Drawer.jsx';
import PatientForm from './PatientForm.jsx';
import AppointmentList from './AppointmentList.jsx';
import BillList from './BillList.jsx';

export default function PatientDrawer({ patientId, onClose }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const { can } = useAuth();
  const { showToast } = useApp();

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    patientsApi.get(patientId).then(setPatient).catch(() => setPatient(null)).finally(() => setLoading(false));
  }, [patientId]);

  const handleDeactivate = async () => {
    if (!window.confirm(`Deactivate ${patient.name}? They cannot be deleted.`)) return;
    try {
      await patientsApi.deactivate(patientId);
      showToast(`${patient.name} deactivated`);
      setPatient(p => ({ ...p, active: false }));
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleReactivate = async () => {
    try {
      await patientsApi.reactivate(patientId);
      showToast(`${patient.name} reactivated`);
      setPatient(p => ({ ...p, active: true }));
    } catch (e) { showToast(e.message, 'error'); }
  };

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'bills', label: 'Bills' },
  ];

  if (loading) return (
    <Drawer title="Patient Details" onClose={onClose}>
      <Spinner />
    </Drawer>
  );

  if (!patient) return (
    <Drawer title="Patient Details" onClose={onClose}>
      <EmptyState message="Patient not found" />
    </Drawer>
  );

  if (editing) return (
    <Drawer title={<>Edit Patient <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{patient.pid}</span></>} onClose={() => setEditing(false)}>
      <PatientForm
        initial={patient}
        onSave={async (data) => {
          const updated = await patientsApi.update(patientId, data);
          setPatient(updated);
          setEditing(false);
          showToast('Patient updated');
        }}
        onCancel={() => setEditing(false)}
      />
    </Drawer>
  );

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{patient.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{patient.pid}</span>
          {!patient.active && <span className="badge badge-cancelled" style={{ fontSize: '10px' }}>Inactive</span>}
        </div>
      }
      onClose={onClose}
      footer={
        can('patient:update') && (
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
            <div>
              {patient.active
                ? <button className="btn btn-danger btn-sm" onClick={handleDeactivate}>Deactivate</button>
                : <button className="btn btn-success btn-sm" onClick={handleReactivate}>Reactivate</button>
              }
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
          </div>
        )
      }
    >
      <DrawerTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'info' && <PatientInfoTab patient={patient} />}
      {activeTab === 'appointments' && <AppointmentList patientId={patientId} />}
      {activeTab === 'bills' && <BillList patientId={patientId} />}
    </Drawer>
  );
}

function PatientInfoTab({ patient }) {
  const rows = [
    { label: 'Patient ID', value: patient.pid, mono: true },
    { label: 'Date of Birth', value: `${fmt.date(patient.dob)} (${fmt.age(patient.dob)})` },
    { label: 'Gender', value: patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other' },
    { label: 'NIC', value: patient.nic || '—', mono: true },
    { label: 'Phone', value: patient.phone, mono: true },
    { label: 'Address', value: patient.address },
    { label: 'Registered', value: fmt.date(patient.createdAt) },
  ];

  return (
    <div>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: '12px' }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: 'grid', gridTemplateColumns: '100px 1fr',
            padding: '8px 12px', borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '1px' }}>{r.label}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: r.mono ? 'var(--font-mono)' : 'var(--font-sans)' }}>{r.value}</span>
          </div>
        ))}
      </div>

      {patient.guardian && (
        <div style={{ background: 'var(--accent-subtle)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 700, marginBottom: '6px' }}>Guardian (Minor)</div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{patient.guardian.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{patient.guardian.phone} Ã· {patient.guardian.relation}</div>
        </div>
      )}
    </div>
  );
}

export function Spinner({ size = 24 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '2px solid var(--border-medium)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.6s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}

export function EmptyState({ message = 'No data', icon }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon || 'Ã°Å¸“Â­'}</div>
      <div style={{ fontSize: '13px' }}>{message}</div>
    </div>
  );
}

