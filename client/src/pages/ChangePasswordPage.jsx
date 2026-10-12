ï»¿import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function ChangePasswordPage() {
  const { user, handleChangePassword, handleLogout } = useAuth();
  const { showToast } = useApp();
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.current) errs.current = 'Required';
    if (!form.newPw || form.newPw.length < 8) errs.newPw = 'Minimum 8 characters';
    if (form.newPw !== form.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await handleChangePassword(form.current, form.newPw);
      showToast('Password changed successfully');
    } catch (err) {
      if (err.fieldErrors) setErrors({ current: err.fieldErrors.currentPassword, newPw: err.fieldErrors.newPassword });
      else setErrors({ _global: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔒</div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Change Password Required</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Your account requires a password change before continuing.</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleSubmit}>
            {errors._global && <div style={{ color: '#fb7185', fontSize: '12px', marginBottom: '12px', padding: '8px 10px', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius)' }}>{errors._global}</div>}
            {[
              { label: 'Current Password', key: 'current' },
              { label: 'New Password', key: 'newPw' },
              { label: 'Confirm New Password', key: 'confirm' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}<span className="req">*</span></label>
                <input type="password" className={`form-input ${errors[f.key] ? 'error' : ''}`}
                  value={form[f.key]} onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(err => { const n = { ...err }; delete n[f.key]; return n; }); }} />
                {errors[f.key] && <div className="form-error">Ã¢Å¡  {errors[f.key]}</div>}
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '36px' }} disabled={saving}>
              {saving ? 'ChangingÃ¢â¬Â¦' : 'Change Password'}
            </button>
          </form>
          <button onClick={handleLogout} className="btn btn-subtle" style={{ width: '100%', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Sign out instead</button>
        </div>
      </div>
    </div>
  );
}

