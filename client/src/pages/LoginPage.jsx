import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { handleLogin, loading } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await handleLogin(form.username, form.password);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-app)', padding: '20px'
    }}>
      {/* Background grid lines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.4,
      }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'var(--accent-muted)', border: '1px solid rgba(245,158,11,0.3)',
            marginBottom: '12px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>HMS Console</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Hospital Management System</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
          borderRadius: '10px', padding: '28px', boxShadow: 'var(--shadow-lg)',
        }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                id="login-username"
                className="form-input"
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter username"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  style={{ paddingRight: '36px' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="btn-subtle" style={{
                  position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                  padding: '4px', height: 'auto', background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}>
                  {showPw ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: '16px',
                fontSize: '12px', color: '#fb7185', lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button id="login-submit" type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', height: '36px', fontSize: '13px' }}>
              {loading ? 'Signing inâ€¦' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-app)', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Demo Accounts (password: pass123)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {[
                { u: 'priya', r: 'Receptionist', color: 'var(--status-scheduled-text)' },
                { u: 'amal',  r: 'Doctor',        color: 'var(--status-checkedin-text)' },
                { u: 'kasun', r: 'Cashier',       color: 'var(--status-completed-text)' },
                { u: 'admin', r: 'Admin',          color: 'var(--accent)' },
              ].map(({ u, r, color }) => (
                <button key={u} type="button" onClick={() => setForm({ username: u, password: 'pass123' })} style={{
                  background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '4px',
                  padding: '4px 8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                }} onMouseEnter={e => e.currentTarget.style.borderColor = color}
                   onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color }}>{u}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{r}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

