import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import CommandBar from './CommandBar.jsx';
import PatientDrawer from './PatientDrawer.jsx';
import AppointmentDrawer from './AppointmentDrawer.jsx';
import BillDrawer from './BillDrawer.jsx';
import Drawer from './Drawer.jsx';
import PatientForm from './PatientForm.jsx';
import { patients as patientsApi } from '../api/api.js';

const NAV = [
  { id: 'today',    label: 'Today',    path: '/',          roles: ['RECEPTIONIST','DOCTOR','CASHIER','ADMIN'] },
  { id: 'patients', label: 'Patients', path: '/patients',  roles: ['RECEPTIONIST','ADMIN','DOCTOR','CASHIER'] },
  { id: 'doctors',  label: 'Doctors',  path: '/doctors',   roles: ['RECEPTIONIST','ADMIN','DOCTOR','CASHIER'] },
  { id: 'billing',  label: 'Billing',  path: '/billing',   roles: ['CASHIER','ADMIN'] },
  { id: 'admin',    label: 'Admin',    path: '/admin',      roles: ['ADMIN'] },
];

export default function AppShell({ children }) {
  const { user, handleLogout, idleWarning, can } = useAuth();
  const { drawer, closeDrawer, openDrawer, setCmdBarOpen, cmdBarOpen, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Global keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdBarOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const visibleTabs = NAV.filter(n => n.roles.includes(user?.role));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Idle warning banner */}
      {idleWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(245,158,11,0.95)', color: '#0b0f19',
          padding: '8px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        }}>
          â± Session expires in 2 minutes due to inactivity.
          <button style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>Keep me in</button>
        </div>
      )}

      {/* Top bar */}
      <div className="topbar" style={{ marginTop: idleWarning ? '36px' : 0 }}>
        <div className="topbar-left">
          {/* Brand */}
          <div className="brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>
            </svg>
            HMS
            <span className="brand-badge">Console</span>
          </div>
          {/* Nav tabs */}
          <nav className="topbar-nav">
            {visibleTabs.map(tab => (
              <button key={tab.id} onClick={() => navigate(tab.path)}
                className={`nav-tab ${location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path)) ? 'active' : ''}`}
                style={{ background: 'none', border: '1px solid transparent' }}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="topbar-right">
          {/* Command bar trigger */}
          <button className="command-bar-trigger" onClick={() => setCmdBarOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Searchâ€¦</span>
            <kbd className="kbd">Ctrl+K</kbd>
          </button>

          {/* Live time */}
          <LiveTime />

          {/* Role pill / user menu */}
          <div style={{ position: 'relative' }}>
            <button className="role-pill" onClick={() => setShowUserMenu(v => !v)}
              style={{ cursor: 'pointer', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius)', padding: '3px 8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-checkedin-text)', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{user?.name?.split(' ')[0]}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role?.slice(0, 4)}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showUserMenu && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', zIndex: 60,
                minWidth: '160px', overflow: 'hidden',
              }} onMouseLeave={() => setShowUserMenu(false)}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role}</div>
                </div>
                <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '12px', color: '#fb7185' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-viewport">
        <div className="content-pane">{children}</div>
      </div>

      {/* Command bar modal */}
      {cmdBarOpen && <CommandBar onClose={() => setCmdBarOpen(false)} />}

      {/* Drawer router */}
      {drawer?.type === 'patient-detail' && (
        <PatientDrawer patientId={drawer.props.patientId} onClose={closeDrawer} />
      )}
      {drawer?.type === 'new-patient' && (
        <Drawer title="New Patient" onClose={closeDrawer}>
          <PatientForm onSave={async (data) => {
            const p = await patientsApi.create(data);
            showToast(`Patient ${p.pid} registered`);
            closeDrawer();
          }} onCancel={closeDrawer} />
        </Drawer>
      )}
      {drawer?.type === 'new-appointment' && (
        <AppointmentDrawer prePatientId={drawer.props?.prePatientId} onClose={closeDrawer} onBooked={() => {}} />
      )}
      {drawer?.type === 'bill-detail' && (
        <BillDrawer billId={drawer.props.billId} onClose={closeDrawer} onUpdate={drawer.props.onUpdate} />
      )}
    </div>
  );
}

function LiveTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </div>
  );
}

