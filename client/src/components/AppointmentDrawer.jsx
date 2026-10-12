import React, { useState, useEffect } from 'react';
import { appointments as apptApi, doctors as doctorsApi, patients as patientsApi, fmt } from '../api/api.js';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Drawer from './Drawer.jsx';
import { Spinner } from './PatientDrawer.jsx';

const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export default function AppointmentDrawer({ onClose, onBooked, prePatientId }) {
  const [step, setStep] = useState('doctor'); // doctor â†’ slot â†’ confirm
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [leaveDay, setLeaveDay] = useState(false);
  const [patientId, setPatientId] = useState(prePatientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [walkIn, setWalkIn] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { showToast } = useApp();

  function todayStr(offsetDays = 0) {
    const d = new Date(); d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  useEffect(() => {
    doctorsApi.list({ active: true }).then(setDoctors);
    if (prePatientId) {
      patientsApi.get(prePatientId).then(p => {
        setSelectedPatient(p);
        setPatientSearch(p.name);
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    doctorsApi.slots(selectedDoctor.id, selectedDate)
      .then(({ slots, leaveDay }) => { setSlots(slots); setLeaveDay(leaveDay); })
      .finally(() => setSlotsLoading(false));
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (patientSearch.length < 2) { setPatientResults([]); return; }
      const res = await patientsApi.list({ search: patientSearch });
      setPatientResults(res.filter(p => p.active).slice(0, 6));
    }, 200);
    return () => clearTimeout(t);
  }, [patientSearch]);

  // Date options: today + 60 days
  const dateOptions = Array.from({ length: 61 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().slice(0, 10),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }),
      dayName: DAYS[d.getDay()],
    };
  });

  const handleBook = async () => {
    const errs = {};
    if (!selectedPatient) errs.patient = 'Select a patient';
    if (!selectedDoctor) errs.doctor = 'Select a doctor';
    if (!selectedSlot) errs.slot = 'Select a time slot';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const appt = await apptApi.create({
        patientId: selectedPatient.id, doctorId: selectedDoctor.id,
        date: selectedDate, time: selectedSlot.time, reason: reason || 'Consultation', walkIn,
      });
      showToast(`Appointment booked for ${selectedPatient.name} at ${selectedSlot.time}`);
      onBooked?.(appt);
      onClose();
    } catch (e) {
      setErrors({ _global: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Book Appointment"
      onClose={onClose}
      footer={
        step === 'confirm' ? (
          <>
            <button className="btn btn-secondary" onClick={() => setStep('slot')}>Back</button>
            <button className="btn btn-primary" onClick={handleBook} disabled={saving}>{saving ? 'Bookingâ€¦' : 'Confirm Booking'}</button>
          </>
        ) : null
      }
    >
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
        {['doctor', 'slot', 'confirm'].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step === s ? 'var(--accent)' : (i < ['doctor','slot','confirm'].indexOf(step) ? 'var(--status-checkedin-bg)' : 'var(--bg-surface)'),
              border: `1px solid ${step === s ? 'var(--accent)' : 'var(--border-medium)'}`,
              fontSize: '11px', fontWeight: 700, color: step === s ? 'var(--accent-contrast)' : 'var(--text-muted)',
            }}>{i + 1}</div>
            {i < 2 && <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }} />}
          </React.Fragment>
        ))}
      </div>

      {errors._global && (
        <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#fb7185' }}>
          {errors._global}
        </div>
      )}

      {/* STEP 1: Patient + Doctor */}
      {step === 'doctor' && (
        <div>
          {/* Patient search */}
          <div className="form-group">
            <label className="form-label">Patient <span className="req">*</span></label>
            {selectedPatient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedPatient.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{selectedPatient.pid} Â· {selectedPatient.phone}</div>
                </div>
                {!prePatientId && <button type="button" className="btn btn-subtle btn-sm" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}>Change</button>}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input className={`form-input ${errors.patient ? 'error' : ''}`} value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Search by name, NIC, phoneâ€¦" />
                {patientResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                    {patientResults.map(p => (
                      <button key={p.id} type="button" onClick={() => { setSelectedPatient(p); setPatientResults([]); setErrors(e => ({ ...e, patient: undefined })); }}
                        style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{p.pid} Â· {p.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.patient && <div className="form-error">âš  {errors.patient}</div>}
          </div>

          {/* Doctor selection */}
          <div className="form-group">
            <label className="form-label">Doctor <span className="req">*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {doctors.map(doc => (
                <button key={doc.id} type="button" onClick={() => { setSelectedDoctor(doc); setErrors(e => ({ ...e, doctor: undefined })); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                    background: selectedDoctor?.id === doc.id ? 'var(--accent-muted)' : 'var(--bg-surface)',
                    border: `1px solid ${selectedDoctor?.id === doc.id ? 'rgba(245,158,11,0.4)' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                  }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>ðŸ©º</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{doc.specialty}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>LKR {doc.consultFee.toLocaleString()}</div>
                </button>
              ))}
            </div>
            {errors.doctor && <div className="form-error">âš  {errors.doctor}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => { if (!selectedDoctor) { setErrors(e => ({ ...e, doctor: 'Select a doctor' })); return; } if (!selectedPatient) { setErrors(e => ({ ...e, patient: 'Select a patient' })); return; } setStep('slot'); }}>
              Next: Choose Slot â†’
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Date + Slot */}
      {step === 'slot' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px' }}>ðŸ©º</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedDoctor.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selectedDoctor.specialty} Â· LKR {selectedDoctor.consultFee.toLocaleString()}</div>
            </div>
          </div>

          {/* Date selector */}
          <div className="form-group">
            <label className="form-label">Date</label>
            <select className="form-select" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
              {dateOptions.map(d => {
                const hasSchedule = !!selectedDoctor.schedule[d.dayName];
                return (
                  <option key={d.value} value={d.value} disabled={!hasSchedule}>
                    {d.label} {!hasSchedule ? '(No clinic)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Slots */}
          {slotsLoading ? <Spinner size={20} /> : leaveDay ? (
            <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius)', padding: '12px', fontSize: '13px', color: '#fb7185', textAlign: 'center' }}>
              Doctor is on leave this day
            </div>
          ) : slots.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>No clinic on this day</div>
          ) : (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                {slots.filter(s => s.available).length} of {slots.length} slots available
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {slots.map(slot => (
                  <button key={slot.time} type="button" disabled={!slot.available}
                    onClick={() => { setSelectedSlot(slot); setErrors(e => ({ ...e, slot: undefined })); }}
                    style={{
                      padding: '7px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid',
                      borderColor: selectedSlot?.time === slot.time ? 'var(--accent)' : slot.available ? 'var(--border-medium)' : 'transparent',
                      background: selectedSlot?.time === slot.time ? 'var(--accent-muted)' : slot.available ? 'var(--bg-surface)' : 'var(--bg-app)',
                      color: selectedSlot?.time === slot.time ? 'var(--accent)' : slot.available ? 'var(--text-primary)' : 'var(--text-disabled)',
                      cursor: slot.available ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: slot.available ? 500 : 400,
                      textDecoration: !slot.available ? 'line-through' : 'none',
                      transition: 'all 0.1s',
                    }}>
                    {slot.time}
                  </button>
                ))}
              </div>
              {errors.slot && <div className="form-error" style={{ marginTop: '8px' }}>âš  {errors.slot}</div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep('doctor')}>â† Back</button>
            <button className="btn btn-primary" onClick={() => { if (!selectedSlot) { setErrors(e => ({ ...e, slot: 'Select a time slot' })); return; } setStep('confirm'); }}>
              Next: Confirm â†’
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm */}
      {step === 'confirm' && (
        <div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '16px' }}>
            {[
              { label: 'Patient', value: `${selectedPatient.name} (${selectedPatient.pid})` },
              { label: 'Doctor', value: selectedDoctor.name },
              { label: 'Specialty', value: selectedDoctor.specialty },
              { label: 'Date', value: fmt.date(selectedDate + 'T12:00:00') },
              { label: 'Time', value: selectedSlot.time },
              { label: 'Fee', value: fmt.lkr(selectedDoctor.consultFee), mono: true },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', padding: '8px 12px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: '13px', fontFamily: r.mono ? 'var(--font-mono)' : 'var(--font-sans)', color: 'var(--text-primary)' }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Notes</label>
            <input className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Follow-up, Consultationâ€¦" />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px', padding: '10px 12px', background: 'var(--accent-subtle)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius)' }}>
            <input type="checkbox" checked={walkIn} onChange={e => setWalkIn(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Walk-in patient <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>(no prior appointment)</span></span>
          </label>
        </div>
      )}
    </Drawer>
  );
}

