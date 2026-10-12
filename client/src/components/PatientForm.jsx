ï»¿import React, { useState, useEffect } from 'react';
import { fmt } from '../api/api.js';

const REQUIRED_FIELDS = ['name', 'dob', 'gender', 'phone'];

export default function PatientForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', dob: '', gender: '', nic: '', phone: '', address: '',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    ...initial,
    guardianName: initial?.guardian?.name || '',
    guardianPhone: initial?.guardian?.phone || '',
    guardianRelation: initial?.guardian?.relation || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [isMinor, setIsMinor] = useState(false);

  useEffect(() => {
    if (form.dob) setIsMinor(fmt.isMinor(form.dob));
  }, [form.dob]);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => { const n = { ...err }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.dob) errs.dob = 'Required';
    if (!form.gender) errs.gender = 'Required';
    if (!form.phone.trim()) errs.phone = 'Required';
    else if (!/^0[1-9]\d{8}$/.test(form.phone)) errs.phone = 'Must be 10 digits starting with 0';
    if (form.nic) {
      const nicOk = /^\d{9}[VXvx]$/.test(form.nic) || /^\d{12}$/.test(form.nic);
      if (!nicOk) errs.nic = 'NIC must be 9 digits + V/X or 12 digits';
    }
    if (isMinor && !form.guardianPhone.trim()) errs.guardianPhone = 'Guardian phone required for patients under 18';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        dob: form.dob,
        gender: form.gender,
        nic: form.nic.trim() || null,
        phone: form.phone.trim(),
        address: form.address.trim(),
      };
      if (isMinor && form.guardianName) {
        data.guardian = { name: form.guardianName, phone: form.guardianPhone, relation: form.guardianRelation };
      }
      await onSave(data);
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      else setErrors({ _global: err.message });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, id, req, error, children }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}{req && <span className="req">*</span>}
      </label>
      {children}
      {error && <div className="form-error">Ã¢Å¡  {error}</div>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {errors._global && (
        <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#fb7185' }}>
          {errors._global}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Full Name" id="pt-name" req error={errors.name}>
            <input id="pt-name" className={`form-input ${errors.name ? 'error' : ''}`} value={form.name} onChange={set('name')} placeholder="As per NIC/passport" />
          </Field>
        </div>

        <Field label="Date of Birth" id="pt-dob" req error={errors.dob}>
          <input id="pt-dob" className={`form-input ${errors.dob ? 'error' : ''}`} type="date" value={form.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} />
        </Field>

        <Field label="Gender" id="pt-gender" req error={errors.gender}>
          <select id="pt-gender" className={`form-select ${errors.gender ? 'error' : ''}`} value={form.gender} onChange={set('gender')}>
            <option value="">SelectÃ¢â¬Â¦</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </Field>

        <Field label="NIC" id="pt-nic" error={errors.nic}>
          <input id="pt-nic" className={`form-input ${errors.nic ? 'error' : ''}`} value={form.nic} onChange={set('nic')} placeholder="9-digit+V/X or 12-digit" style={{ fontFamily: 'var(--font-mono)' }} />
        </Field>

        <Field label="Phone" id="pt-phone" req error={errors.phone}>
          <input id="pt-phone" className={`form-input ${errors.phone ? 'error' : ''}`} value={form.phone} onChange={set('phone')} placeholder="07XXXXXXXX" style={{ fontFamily: 'var(--font-mono)' }} />
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Address" id="pt-address" error={errors.address}>
            <textarea id="pt-address" className="form-textarea" value={form.address} onChange={set('address')} rows={2} placeholder="Street, City" />
          </Field>
        </div>
      </div>

      {/* Guardian section for minors */}
      {isMinor && (
        <div style={{ marginTop: '8px', padding: '12px', background: 'var(--accent-subtle)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Guardian Required (Patient is a Minor)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Guardian Name" id="pt-gname" error={errors.guardianName}>
                <input id="pt-gname" className="form-input" value={form.guardianName} onChange={set('guardianName')} />
              </Field>
            </div>
            <Field label="Guardian Phone" id="pt-gphone" req error={errors.guardianPhone}>
              <input id="pt-gphone" className={`form-input ${errors.guardianPhone ? 'error' : ''}`} value={form.guardianPhone} onChange={set('guardianPhone')} style={{ fontFamily: 'var(--font-mono)' }} />
            </Field>
            <Field label="Relation" id="pt-grel" error={errors.guardianRelation}>
              <select id="pt-grel" className="form-select" value={form.guardianRelation} onChange={set('guardianRelation')}>
                <option value="">SelectÃ¢â¬Â¦</option>
                <option>Father</option><option>Mother</option><option>Guardian</option><option>Other</option>
              </select>
            </Field>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'SavingÃ¢â¬Â¦' : 'Save Patient'}</button>
      </div>
    </form>
  );
}

