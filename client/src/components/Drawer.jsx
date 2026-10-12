import React, { useEffect, useRef } from 'react';

export default function Drawer({ title, onClose, footer, children, width = 520 }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Trap focus
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focusable = el.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
  }, []);

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={ref} className="drawer" style={{ width }} onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">{title}</div>
          <button id="drawer-close" className="btn btn-subtle btn-sm btn-icon" onClick={onClose} title="Close (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </div>
  );
}

// Drawer Tab Helper
export function DrawerTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          style={{
            padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: active === tab.id ? 600 : 400,
            color: active === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: active === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px', transition: 'all 0.12s', fontFamily: 'var(--font-sans)',
          }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

