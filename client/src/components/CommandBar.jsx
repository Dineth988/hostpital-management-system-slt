import React, { useState, useEffect, useRef, useCallback } from 'react';
import { patients as patientsApi, appointments, doctors } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function CommandBar({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const { can } = useAuth();
  const { openDrawer } = useApp();

  const ACTIONS = [
    can('patient:create') && { type: 'action', label: 'New Patient', icon: 'ðŸ‘¤', action: () => { openDrawer('new-patient'); onClose(); } },
    can('appointment:create') && { type: 'action', label: 'Book Appointment', icon: 'ðŸ“…', action: () => { openDrawer('new-appointment'); onClose(); } },
    can('bill:pay') && { type: 'action', label: 'Payment Queue', icon: 'ðŸ’³', action: () => { window.location.hash = '#billing'; onClose(); } },
  ].filter(Boolean);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults(ACTIONS); setSelectedIdx(0); return; }
    setLoading(true);
    try {
      const pts = await patientsApi.list({ search: q });
      const patientResults = pts.slice(0, 6).map(p => ({
        type: 'patient', label: p.name, sub: `${p.pid} Â· ${p.phone}`,
        active: p.active,
        action: () => { openDrawer('patient-detail', { patientId: p.id }); onClose(); },
      }));
      const actionResults = ACTIONS.filter(a => a.label.toLowerCase().includes(q.toLowerCase()));
      setResults([...patientResults, ...actionResults]);
      setSelectedIdx(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!query) setResults(ACTIONS);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { results[selectedIdx].action(); }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '80px' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '560px', maxWidth: '95vw',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search patient by name, NIC, phone, IDâ€¦ or type an action"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-sans)',
            }} />
          {loading && <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border-medium)', borderTopColor: 'var(--accent)', animation: 'spin 0.6s linear infinite' }} />}
          <kbd className="kbd">Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          {results.length === 0 && query && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No results for "{query}"
            </div>
          )}
          {results.length === 0 && !query && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Start typing to search patients or find actions
            </div>
          )}
          {results.map((r, i) => (
            <button key={i} type="button" onClick={r.action}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '10px 16px', border: 'none', background: i === selectedIdx ? 'var(--bg-surface-hover)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', borderLeft: i === selectedIdx ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.1s',
              }}
              onMouseEnter={() => setSelectedIdx(i)}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>
                {r.type === 'patient' ? 'ðŸ‘¤' : (r.icon || 'âš¡')}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{
                  display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
                  opacity: r.active === false ? 0.5 : 1,
                }}>{r.label} {r.active === false && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Inactive)</span>}</span>
                {r.sub && <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{r.sub}</span>}
              </span>
              {r.type === 'action' && <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '3px' }}>Action</span>}
            </button>
          ))}
        </div>

        {/* Footer hints */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span><kbd className="kbd">â†‘â†“</kbd> navigate</span>
          <span><kbd className="kbd">â†µ</kbd> select</span>
          <span><kbd className="kbd">Esc</kbd> close</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}

